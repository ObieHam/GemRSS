"use client";
import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Upload, Search, BookOpen, Loader2, Trash2, Volume2, Plus, LayoutDashboard } from 'lucide-react';
// FIX: Use the standard entry point for pdfjs-dist, not the legacy build folder
import * as pdfjsLib from 'pdfjs-dist';

// FIX: Set the worker source safely. 
// Ensure this matches the version installed in package.json (4.4.168)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const STOP_WORDS = new Set(["the", "and", "was", "for", "that", "with", "this", "are", "have", "from", "but", "not", "you", "all", "any", "can", "had", "her", "him", "his", "its", "one", "our", "out", "she", "there", "their", "they", "will", "would"]);

export default function VocabApp() {
  const [words, setWords] = useState([]);
  const [status, setStatus] = useState({ loading: false, msg: '' });
  const [search, setSearch] = useState("");

  useEffect(() => { loadWords(); }, []);

  const loadWords = async () => {
    try {
      const all = await db.vocabulary.toArray();
      setWords(all.sort((a, b) => b.dateAdded - a.dateAdded));
    } catch (error) {
      console.error("Failed to load words", error);
    }
  };

  const playAudio = (url) => { 
    if (url) new Audio(url).play().catch(e => console.error("Audio play failed", e)); 
  };

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
        } catch (e) { 
          console.error("Definition fetch error", e); 
        }
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
        const arrayBuffer = await file.arrayBuffer();
        // Loading document using the fixed pdfjsLib import
        const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(s => s.str).join(" ") + " ";
        }
      } else { 
        text = await file.text(); 
      }
      await processContent(text);
    } catch (err) { 
      console.error(err);
      alert("Error processing file. See console for details."); 
    } finally {
      setStatus({ loading: false, msg: '' });
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 bg-[#0f172a]/50 backdrop-blur-3xl border-r border-slate-800 p-8 flex flex-col hidden lg:flex">
        <div className="flex items-center gap-3 mb-16">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
            <BookOpen size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">LEXIBUILD</h1>
        </div>
        
        <nav className="space-y-6 flex-grow">
          <label className="flex items-center gap-4 p-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl cursor-pointer transition-all font-bold shadow-lg shadow-indigo-600/10">
            <Plus size={20} /> Import PDF
            <input type="file" className="hidden" onChange={handleFile} accept=".pdf,.txt" />
          </label>
          
          <div className="p-5 bg-slate-800/30 rounded-2xl border border-white/5 space-y-1">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Workspace</p>
            <div className="flex items-center gap-3 text-slate-400 font-bold text-sm hover:text-white transition-colors cursor-pointer p-2">
               <LayoutDashboard size={18} /> Overview
            </div>
          </div>
        </nav>

        <div className="mt-auto p-5 bg-slate-900/80 rounded-3xl border border-white/5">
          <p className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest">Library Stats</p>
          <div className="flex justify-between items-end">
            <span className="text-4xl font-black text-white">{words.length}</span>
            <span className="text-slate-500 text-xs mb-1 font-bold">Stored Terms</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col p-6 md:p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-16">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={22} />
            <input 
              type="text" 
              placeholder="Search library..." 
              className="w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800 focus:border-indigo-500/50 pl-16 pr-6 py-5 rounded-3xl outline-none transition-all text-lg font-medium shadow-2xl shadow-black/50"
              onChange={(e) => setSearch(e.target.value.toLowerCase())}
            />
          </div>
        </header>

        {status.loading && (
          <div className="mb-12 p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center gap-4 animate-pulse">
            <Loader2 className="animate-spin text-indigo-400" />
            <span className="font-black text-sm uppercase tracking-[0.25em] text-indigo-400">{status.msg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {words.filter(w => w.word && w.word.toLowerCase().includes(search)).map((w) => (
            <div key={w.id} className="bg-slate-900/30 backdrop-blur-2xl border border-white/5 hover:border-white/10 p-10 rounded-[2.5rem] transition-all duration-500 group relative flex flex-col justify-between min-h-[340px]">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-3xl font-black text-white capitalize tracking-tighter group-hover:text-indigo-400 transition-colors">{w.word}</h2>
                  <div className="flex gap-2">
                    <button onClick={() => playAudio(w.audioUrl)} className="text-slate-500 hover:text-white transition-colors bg-white/5 hover:bg-indigo-600 p-2.5 rounded-xl">
                      <Volume2 size={20} />
                    </button>
                    <button onClick={() => deleteWord(w.id)} className="text-slate-500 hover:text-red-500 transition-colors bg-white/5 hover:bg-red-500/20 p-2.5 rounded-xl">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium group-hover:text-slate-200 transition-colors line-clamp-4">
                  {w.definition}
                </p>
              </div>

              <div className="bg-black/20 p-6 rounded-3xl border border-white/5 relative">
                <span className="absolute -top-3 left-4 text-3xl text-indigo-500/30 italic">"</span>
                <p className="text-sm text-slate-500 italic leading-relaxed line-clamp-2">{w.context}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
