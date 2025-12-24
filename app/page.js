"use client";
import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Upload, Download, Search, BookOpen, Loader2, Trash2, Volume2, Play } from 'lucide-react';
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

  const playAudio = (url) => {
    if (!url) return;
    const audio = new Audio(url);
    audio.play();
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
        } catch (e) { console.error(e); }
      }
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus({ loading: true, msg: 'Decoding File...' });
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

  const exportCSV = () => {
    if (words.length === 0) return;
    const clean = (s) => `"${(s || "").toString().replace(/"/g, '""')}"`;
    const rows = [["Word", "Definition", "Audio URL", "Context"], ...words.map(w => [w.word, w.definition, w.audioUrl, w.context])];
    const content = "data:text/csv;charset=utf-8," + rows.map(r => r.map(clean).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(content);
    link.download = "lexibuild_pro.csv";
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-10 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Bar */}
        <header className="flex flex-col lg:flex-row justify-between items-center mb-16 gap-8 bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[2rem] shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
              <BookOpen size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-white">LEXIBUILD <span className="text-indigo-500 text-sm align-top">PRO</span></h1>
              <p className="text-slate-500 text-xs font-bold tracking-widest uppercase">Intelligent Lexicon Engine</p>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <label className="group relative overflow-hidden bg-slate-800 hover:bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold cursor-pointer transition-all duration-300 flex items-center gap-3">
              <Upload size={20} className="group-hover:-translate-y-1 transition-transform" />
              <span>{status.loading ? 'ANALYZING...' : 'IMPORT SOURCE'}</span>
              <input type="file" className="hidden" onChange={handleFile} accept=".pdf,.txt" disabled={status.loading} />
            </label>
            <button onClick={exportCSV} className="bg-slate-800 border border-slate-700 hover:border-indigo-500/50 text-slate-300 px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 active:scale-95">
              <Download size={20} /> EXPORT
            </button>
          </div>
        </header>

        {/* Global Status Bar */}
        {status.loading && (
          <div className="mb-12 flex items-center justify-center gap-4 py-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl animate-pulse">
            <Loader2 className="animate-spin text-indigo-400" />
            <span className="text-indigo-400 font-black text-sm uppercase tracking-widest">{status.msg}</span>
          </div>
        )}

        {/* Search & Stats */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="relative flex-grow">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={22} />
            <input 
              type="text" 
              placeholder="Filter library..." 
              className="w-full bg-slate-900/80 border border-slate-800 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 pl-16 pr-6 py-5 rounded-3xl outline-none transition-all text-lg font-medium"
              onChange={(e) => setSearch(e.target.value.toLowerCase())}
            />
          </div>
          <div className="bg-slate-900/80 border border-slate-800 px-8 py-5 rounded-3xl flex items-center gap-4">
            <span className="text-slate-500 font-bold text-sm uppercase">Total Words</span>
            <span className="text-2xl font-black text-white">{words.length}</span>
          </div>
        </div>

        {/* Vocabulary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {words.filter(w => w.word.includes(search)).map((w) => (
            <div key={w.id} className="group bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 p-8 rounded-[2.5rem] transition-all duration-500 relative flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black text-white capitalize tracking-tight">{w.word}</h2>
                    {w.audioUrl && (
                      <button 
                        onClick={() => playAudio(w.audioUrl)}
                        className="bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white p-2 rounded-xl transition-all active:scale-90"
                      >
                        <Volume2 size={20} />
                      </button>
                    )}
                  </div>
                  <button onClick={() => deleteWord(w.id)} className="text-slate-700 hover:text-red-500 transition-colors p-1">
                    <Trash2 size={20} />
                  </button>
                </div>
                <p className="text-slate-400 text-lg leading-relaxed mb-8 font-medium line-clamp-3 group-hover:text-slate-300 transition-colors">
                  {w.definition}
                </p>
              </div>

              <div className="bg-slate-950/50 p-6 rounded-[1.5rem] border border-slate-800/50 relative">
                <p className="text-sm text-slate-500 italic leading-relaxed">
                  <span className="text-indigo-500 font-serif text-xl mr-1 italic">"</span>
                  {w.context}
                  <span className="text-indigo-500 font-serif text-xl ml-1 italic">"</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
