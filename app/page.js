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
    await db.vocabulary.delete(id);
    loadWords();
  };

  const processContent = async (text) => {
    const sentences = text.replace(/\n/g, " ").match(/[^.!?]+[.!?]+/g) || [text];
    for (const sentence of sentences) {
      const tokens = sentence.toLowerCase().match(/\b[a-z]{4,}\b/g);
      if (!tokens) continue;

      for (const token of tokens) {
        if (STOP_WORDS.has(token)) continue;
        
        setStatus({ loading: true, msg: `Checking: ${token}...` });
        const res = await fetch(`/api/define?word=${token}`);
        if (!res.ok) continue;
        
        const info = await res.json();
        const exists = await db.vocabulary.where('word').equals(info.baseWord).first();
        
        if (!exists && !info.error) {
          await db.vocabulary.add({
            word: info.baseWord,
            definition: info.definition,
            pronunciation: info.pronunciation,
            context: sentence.trim(),
            dateAdded: Date.now()
          });
          await loadWords();
        }
      }
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus({ loading: true, msg: 'Reading file...' });

    try {
      let text = "";
      if (file.type === "application/pdf") {
        const doc = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(s => s.str).join(" ") + " ";
        }
      } else {
        text = await file.text();
      }
      await processContent(text);
    } catch (err) { alert("Error processing file"); }
    setStatus({ loading: false, msg: '' });
  };

  const exportCSV = () => {
    const rows = [["Word", "Definition", "Pronunciation", "Context"], ...words.map(w => [w.word, w.definition, w.pronunciation, w.context])];
    const content = "data:text/csv;charset=utf-8," + rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(content);
    link.download = "vocabulary.csv";
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-indigo-600 flex items-center gap-3">
            <BookOpen size={40} /> LexiBuild
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Automatic context-aware vocabulary builder</p>
        </div>
        <div className="flex gap-3">
          <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold cursor-pointer transition-all shadow-lg shadow-indigo-100 flex items-center gap-2">
            <Upload size={20} /> {status.loading ? 'Processing...' : 'Upload PDF / TXT'}
            <input type="file" className="hidden" onChange={handleFile} accept=".pdf,.txt" disabled={status.loading} />
          </label>
          <button onClick={exportCSV} className="bg-white border-2 border-slate-200 hover:border-indigo-200 text-slate-700 px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2">
            <Download size={20} /> Export
          </button>
        </div>
      </header>

      {status.loading && (
        <div className="flex items-center justify-center gap-3 p-6 mb-8 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 animate-pulse">
          <Loader2 className="animate-spin" /> <span className="font-bold">{status.msg}</span>
        </div>
      )}

      <div className="relative mb-10">
        <Search className="absolute left-5 top-5 text-slate-400" size={24} />
        <input 
          type="text" placeholder="Search your collection..." 
          className="w-full pl-14 pr-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all text-lg shadow-sm"
          onChange={(e) => setSearch(e.target.value.toLowerCase())}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {words.filter(w => w.word.includes(search)).map((w) => (
          <div key={w.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group relative">
            <button onClick={() => deleteWord(w.id)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors">
              <Trash2 size={20} />
            </button>
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="text-3xl font-bold text-slate-800 capitalize">{w.word}</h2>
              <span className="text-indigo-400 font-mono text-sm">/{w.pronunciation}/</span>
            </div>
            <p className="text-slate-600 leading-relaxed mb-6 text-lg">{w.definition}</p>
            <div className="bg-slate-50 p-5 rounded-2xl border-l-4 border-indigo-400">
              <p className="text-sm text-slate-500 italic leading-snug">"{w.context}"</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
