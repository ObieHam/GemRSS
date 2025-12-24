"use client";
import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Upload, Download, Search, BookOpen, Loader2, Trash2, Volume2, Plus, ArrowRight } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const STOP_WORDS = new Set(["the", "and", "was", "for", "that", "with", "this", "are", "have", "from", "but", "not", "you", "all", "any", "can", "had", "her", "him", "his", "its", "one", "our", "out", "she", "there", "their", "they", "will", "would"]);

export default function VocabApp() {
  const [words, setWords] = useState([]);
  const [status, setStatus] = useState({ loading: false, msg: '' });
  const [search, setSearch] = useState("");

  useEffect(() => { loadWords(); }, []);

  const loadWords = async () => {
    const all = await db.vocabulary.toArray();
    setWords(all.sort((a, b) => b.dateAdded - a.dateAdded));
  };

  const playAudio = (url) => { if (url) new Audio(url).play(); };

  const deleteWord = async (id) => {
    await db.vocabulary.delete(id);
    await loadWords();
  };

  const processContent = async (text) => {
    const sentences = text.replace(/\n/g, " ").match(/[^.!?]+[.!?]+/g) || [text];
    for (const sentence of sentences) {
      const tokens = sentence.toLowerCase().match(/\b[a-z]{4,}\b/g);
      if (!tokens) continue;

      for (const token of tokens) {
        if (STOP_WORDS.has(token)) continue;
        const exists = await db.vocabulary.where('word').equals(token).first();
        if (exists) continue;

        setStatus({ loading: true, msg: `Unlocking: ${token}` });
        try {
          const res = await fetch(`/api/define?word=${token}`);
          if (!res.ok) continue;
          const info = await res.json();
          const baseExists = await db.vocabulary.where('word').equals(info.baseWord).first();
          
          if (!baseExists && !info.error) {
            await db.vocabulary.add({
              word: info.baseWord,
              definition: info.definition,
              audioUrl: info.audioUrl,
              context: sentence.trim(),
              dateAdded: Date.now()
            });
            await loadWords();
          }
        } catch (e) { console.error(e); }
      }
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus({ loading: true, msg: 'Processing Intelligence...' });
    try {
      let text = "";
      if (file.type === "application/pdf") {
        const doc = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(s => s.str).join(" ") + " ";
        }
      } else { text = await file.text(); }
      await processContent(text);
    } catch (err) { alert("Format not supported."); }
    setStatus({ loading: false, msg: '' });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex overflow-hidden">
      {/* Sidebar Layout */}
      <aside className="w-80 bg-[#0f172a]/40 backdrop-blur-2xl border-r border-slate-800 p-8 flex flex-col justify-between hidden lg:flex">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <BookOpen size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">LexiBuild</h1>
          </div>
          
          <nav className="space-y-4">
            <label className="flex items-center gap-4 p-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl cursor-pointer transition-all font-bold group">
              <Plus size={20} className="group-hover:rotate-90 transition-transform" /> 
              Import PDF
              <input type="file" className="hidden" onChange={handleFile} accept=".pdf,.txt" />
            </label>
            <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800/50">
              <p className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Library Stats</p>
              <div className="flex justify-between items-end">
                <span className="text-3xl font-black">{words.length}</span>
                <span className="text-slate-400 text-sm mb-1">Words Stored</span>
              </div>
            </div>
          </nav>
        </div>

        <button className="text-slate-500 hover:text-white transition-colors text-sm font-bold flex items-center gap-2">
          Settings <ArrowRight size={14} />
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col p-6 md:p-10 lg:p-16 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={22} />
            <input 
              type="text" 
              placeholder="Search library..." 
              className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-800 focus:border-indigo-500 pl-16 pr-6 py-5 rounded-3xl outline-none transition-all text-lg font-medium shadow-2xl shadow-black/50"
              onChange={(e) => setSearch(e.target.value.toLowerCase())}
            />
          </div>
          <button className="p-5 bg-slate-800/50 rounded-2xl border border-slate-800 hover:border-indigo-500 transition-all">
            <Download size={22} />
          </button>
        </header>

        {status.loading && (
          <div className="mb-12 p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center gap-4 animate-pulse">
            <Loader2 className="animate-spin text-indigo-400" />
            <span className="font-black text-sm uppercase tracking-[0.2em] text-indigo-400">{status.msg}</span>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {words.filter(w => w.word.includes(search)).map((w) => (
            <div key={w.id} className="bg-slate-900/30 backdrop-blur-xl border border-white/5 hover:border-white/10 p-8 rounded-[2.5rem] transition-all duration-500 group relative">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-black text-white capitalize mb-1 tracking-tight">{w.word}</h2>
                  <div className="flex items-center gap-3">
                    <button onClick={() => playAudio(w.audioUrl)} className="text-indigo-400 hover:text-white transition-colors bg-indigo-500/10 hover:bg-indigo-600 p-2.5 rounded-xl">
                      <Volume2 size={20} />
                    </button>
                  </div>
                </div>
                <button onClick={() => deleteWord(w.id)} className="p-2 text-slate-700 hover:text-red-500 transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>

              <p className="text-slate-400 text-lg leading-relaxed mb-8 font-medium line-clamp-3 group-hover:text-slate-200 transition-colors">
                {w.definition}
              </p>

              <div className="bg-slate-950/40 p-6 rounded-3xl border border-white/5 relative">
                <span className="absolute -top-3 left-4 text-3xl text-indigo-500/30 italic">"</span>
                <p className="text-sm text-slate-500 italic leading-relaxed">{w.context}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
