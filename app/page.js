"use client";
import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Upload, Download, Search, BookOpen, Loader2, Trash2 } from 'lucide-react';
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

  const deleteWord = async (id) => {
    if (confirm("Delete this word?")) {
      await db.vocabulary.delete(id);
      loadWords();
    }
  };

  const processContent = async (text) => {
    const sentences = text.replace(/\n/g, " ").match(/[^.!?]+[.!?]+/g) || [text];
    for (const sentence of sentences) {
      const tokens = sentence.toLowerCase().match(/\b[a-z]{4,}\b/g);
      if (!tokens) continue;

      for (const token of tokens) {
        if (STOP_WORDS.has(token)) continue;
        
        const existsLocally = await db.vocabulary.where('word').equals(token).first();
        if (existsLocally) continue;

        setStatus({ loading: true, msg: `Defining: ${token}...` });
        try {
          const res = await fetch(`/api/define?word=${token}`);
          if (!res.ok) continue;
          
          const info = await res.json();
          const baseExists = await db.vocabulary.where('word').equals(info.baseWord).first();
          
          if (!baseExists && !info.error) {
            await db.vocabulary.add({
              word: info.baseWord,
              definition: info.definition,
              pronunciation: info.pronunciation,
              context: sentence.trim(),
              dateAdded: Date.now()
            });
            await loadWords(); // Update UI in real-time
          }
        } catch (e) { console.error(e); }
      }
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus({ loading: true, msg: 'Initializing parser...' });

    try {
      let text = "";
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= doc.numPages; i++) {
          setStatus({ loading: true, msg: `Reading PDF page ${i}/${doc.numPages}...` });
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
      alert("Error processing file. Ensure it is a valid PDF or TXT."); 
    }
    setStatus({ loading: false, msg: '' });
  };

  const exportCSV = () => {
    if (words.length === 0) return;
    const clean = (str) => `"${(str || "").toString().replace(/"/g, '""').replace(/\n/g, " ")}"`;
    const headers = ["Word", "Definition", "Pronunciation", "Context"];
    const rows = words.map(w => [clean(w.word), clean(w.definition), clean(w.pronunciation), clean(w.context)].join(","));
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.body.appendChild(document.createElement("a"));
    link.href = url;
    link.download = "my_vocabulary.csv";
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12">
      <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-black text-indigo-600 flex items-center justify-center md:justify-start gap-3">
            <BookOpen size={40} className="stroke-[2.5px]" /> LexiBuild
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Smart Extraction • Indexed Storage • CSV Export</p>
        </div>
        <div className="flex gap-4">
          <label className={`bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-bold cursor-pointer transition-all shadow-xl shadow-indigo-100 flex items-center gap-3 ${status.loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {status.loading ? <Loader2 className="animate-spin" size={22} /> : <Upload size={22} />}
            {status.loading ? 'Processing...' : 'Upload File'}
            <input type="file" className="hidden" onChange={handleFile} accept=".pdf,.txt" disabled={status.loading} />
          </label>
          <button onClick={exportCSV} disabled={words.length === 0} className="bg-white border-2 border-slate-200 hover:border-indigo-200 text-slate-700 px-10 py-5 rounded-2xl font-bold transition-all flex items-center gap-3 disabled:opacity-30">
            <Download size={22} /> Export CSV
          </button>
        </div>
      </header>

      {status.loading && (
        <div className="flex items-center justify-center gap-4 p-8 mb-10 bg-indigo-50 text-indigo-700 rounded-[2rem] border border-indigo-100 shadow-inner">
          <Loader2 className="animate-spin" size={28} />
          <span className="font-bold text-lg">{status.msg}</span>
        </div>
      )}

      <div className="relative mb-12 group">
        <Search className="absolute left-6 top-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={26} />
        <input 
          type="text" 
          placeholder={`Search ${words.length} saved words...`} 
          className="w-full pl-16 pr-8 py-6 rounded-3xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all text-xl shadow-sm bg-white"
          onChange={(e) => setSearch(e.target.value.toLowerCase())}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {words.filter(w => w.word.includes(search)).map((w) => (
          <div key={w.id} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <button onClick={() => deleteWord(w.id)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500 transition-colors">
              <Trash2 size={22} />
            </button>
            <div className="flex items-baseline gap-4 mb-5">
              <h2 className="text-3xl font-extrabold text-slate-800 capitalize tracking-tight">{w.word}</h2>
              <span className="text-indigo-400 font-mono text-base font-medium">/{w.pronunciation}/</span>
            </div>
            <p className="text-slate-600 leading-relaxed mb-8 text-lg font-medium">{w.definition}</p>
            <div className="bg-slate-50 p-6 rounded-3xl border-l-4 border-indigo-400 relative">
               <span className="absolute -top-3 left-4 text-4xl text-indigo-200 font-serif">“</span>
              <p className="text-base text-slate-500 italic leading-relaxed relative z-10">{w.context}”</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
