"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Search, BookOpen, Loader2, Trash2, Volume2, Plus, 
  Menu, X, Settings, ChevronLeft, ChevronRight, FileText, 
  List, AlertTriangle, EyeOff, MessageSquare 
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
}

const COMMON_WORDS = new Set(["the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what"]);

/**
 * 5. Word Normalization Logic
 * Handles converting "primarily" -> "primary", "converted" -> "convert", etc.
 */
const normalizeWord = (word) => {
  let normalized = word.toLowerCase().trim();
  if (normalized.endsWith('ily')) return normalized.replace(/ily$/, 'y');
  if (normalized.endsWith('ly')) return normalized.slice(0, -2);
  if (normalized.endsWith('ed')) return normalized.slice(0, -2);
  if (normalized.endsWith('ing')) return normalized.slice(0, -3);
  if (normalized.endsWith('ies')) return normalized.replace(/ies$/, 'y');
  if (normalized.endsWith('s') && !normalized.endsWith('ss')) return normalized.slice(0, -1);
  return normalized;
};

// Database operations
const db = {
  vocabulary: {
    toArray: async () => {
      if (typeof window === 'undefined') return [];
      const words = localStorage.getItem('vocabWords');
      return words ? JSON.parse(words) : [];
    },
    add: async (word) => {
      if (typeof window === 'undefined') return word;
      const words = await db.vocabulary.toArray();
      const newWord = { ...word, id: Date.now() + Math.random() };
      words.push(newWord);
      localStorage.setItem('vocabWords', JSON.stringify(words));
      return newWord;
    },
    delete: async (id) => {
      const words = await db.vocabulary.toArray();
      localStorage.setItem('vocabWords', JSON.stringify(words.filter(w => w.id !== id)));
    },
    clear: async () => localStorage.setItem('vocabWords', JSON.stringify([])),
  },
  ignored: {
    get: () => {
      if (typeof window === 'undefined') return [];
      const ignored = localStorage.getItem('ignoredWords');
      return ignored ? JSON.parse(ignored) : [];
    },
    add: (word) => {
      const ignored = db.ignored.get();
      const lower = word.toLowerCase();
      if (!ignored.includes(lower)) {
        ignored.push(lower);
        localStorage.setItem('ignoredWords', JSON.stringify(ignored));
      }
    }
  }
};

const getSettings = () => {
  if (typeof window === 'undefined') return { apiSource: 'free-dictionary', accent: 'us', autoSave: false, mwApiKey: '' };
  const settings = localStorage.getItem('appSettings');
  return settings ? JSON.parse(settings) : { apiSource: 'free-dictionary', accent: 'us', autoSave: false, mwApiKey: '' };
};

const isValidWord = (word) => {
  const ignored = db.ignored.get();
  const lower = word.toLowerCase();
  if (ignored.includes(lower)) return false;
  if (lower.length < 4 || /\d/.test(lower) || !/^[a-z]+$/i.test(lower)) return false;
  return true;
};

const fetchFromFreeDictionary = async (rawWord) => {
  const word = normalizeWord(rawWord);
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    return {
      word: data[0].word.toLowerCase(),
      definition: data[0].meanings[0]?.definitions[0]?.definition || 'No definition',
      example: data[0].meanings[0]?.definitions[0]?.example || null,
      phonetics: data[0].phonetics || [],
      dateAdded: Date.now()
    };
  } catch { return { error: 'Word not found' }; }
};

export default function LexiBuildApp() {
  const [view, setView] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [words, setWords] = useState([]);
  const [settings, setSettings] = useState(getSettings());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => { loadWords(); }, []);

  const loadWords = async () => {
    const all = await db.vocabulary.toArray();
    setWords(all.sort((a, b) => b.dateAdded - a.dateAdded));
  };

  /**
   * 3. Merged Library Stats Button
   * 1. Handpick gesture (cursor-pointer)
   */
  const MainMenu = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-16">
          <div className="bg-indigo-500 p-4 rounded-2xl shadow-2xl inline-block mb-6"><BookOpen size={48} /></div>
          <h1 className="text-7xl font-black tracking-tighter mb-4 bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">LEXIBUILD</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={() => setView('parse')} className="group bg-slate-900 border-2 border-slate-700 hover:border-indigo-500 p-8 rounded-3xl transition-all hover:scale-105 cursor-pointer">
            <Upload size={40} className="text-indigo-400 mb-4" />
            <h3 className="text-2xl font-bold text-white">Parse PDF</h3>
            <p className="text-slate-400">Extract vocabulary automatically</p>
          </button>

          <button onClick={() => setView('browse')} className="group bg-slate-900 border-2 border-slate-700 hover:border-purple-500 p-8 rounded-3xl transition-all hover:scale-105 cursor-pointer text-left">
            <div className="flex justify-between items-start mb-4">
              <List size={40} className="text-purple-400" />
              <div className="bg-purple-500/20 text-purple-400 px-4 py-1 rounded-full text-sm font-black border border-purple-500/30">
                {words.length} SAVED
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white">Library & Stats</h3>
            <p className="text-slate-400">Review your collection</p>
          </button>

          <button onClick={() => setView('reader')} className="group md:col-span-2 bg-slate-900 border-2 border-slate-700 hover:border-pink-500 p-8 rounded-3xl transition-all hover:scale-105 cursor-pointer flex items-center gap-6 text-left">
            <FileText size={40} className="text-pink-400" />
            <div>
              <h3 className="text-2xl font-bold text-white">Interactive Reader</h3>
              <p className="text-slate-400">Learn while you read</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {view === 'home' ? <MainMenu /> : (
        <div className="flex">
          <Sidebar view={view} setView={setView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <div className={`flex-grow transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
            {view === 'parse' && <ParseView loadWords={loadWords} settings={settings} />}
            {view === 'browse' && <BrowseView words={words} loadWords={loadWords} />}
            {view === 'reader' && <ReaderView settings={settings} loadWords={loadWords} />}
          </div>
        </div>
      )}
    </div>
  );
}

function Sidebar({ view, setView, sidebarOpen, setSidebarOpen }) {
  const navItems = [
    { id: 'home', icon: BookOpen, label: 'Home' },
    { id: 'parse', icon: Upload, label: 'Parse PDF' },
    { id: 'browse', icon: List, label: 'Library' },
    { id: 'reader', icon: FileText, label: 'Reader' },
  ];

  return (
    <div className={`fixed top-0 left-0 h-full bg-slate-950 border-r-2 border-slate-800 transition-all z-50 ${sidebarOpen ? 'w-72' : 'w-20'}`}>
      <div className="p-6">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 mb-10 hover:bg-slate-800 rounded-xl cursor-pointer">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <nav className="space-y-3">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-colors ${view === item.id ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-bold">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

function ParseView({ loadWords, settings }) {
  const [status, setStatus] = useState({ loading: false, msg: '', progress: 0, total: 0 });
  const fileInputRef = useRef(null);

  const processContent = async (text) => {
    // Regex matches sentences
    const sentences = text.replace(/\n/g, " ").match(/[^.!?]+[.!?]+/g) || [text];
    const allTokens = [];
    const existingWords = await db.vocabulary.toArray();

    for (const sentence of sentences) {
      const tokens = sentence.toLowerCase().match(/\b[a-z]{4,}\b/g);
      if (!tokens) continue;

      for (const token of tokens) {
        if (COMMON_WORDS.has(token) || !isValidWord(token)) continue;
        const exists = existingWords.find(w => w.word === normalizeWord(token));
        if (!exists && !allTokens.find(t => t.word === token)) {
          allTokens.push({ word: token, context: sentence.trim() });
        }
      }
    }

    const total = allTokens.length;
    setStatus({ loading: true, msg: 'Normalizing & Fetching...', progress: 0, total });

    const batchSize = 5;
    for (let i = 0; i < allTokens.length; i += batchSize) {
      const batch = allTokens.slice(i, i + batchSize);
      await Promise.all(batch.map(async ({ word, context }) => {
        try {
          const info = await fetchFromFreeDictionary(word);
          if (!info.error) {
            await db.vocabulary.add({ ...info, context });
          }
        } catch (e) {}
      }));
      setStatus({ loading: true, msg: 'Processing...', progress: Math.min(i + batchSize, total), total });
    }
    await loadWords();
    setStatus({ loading: false, msg: 'Complete!' });
  };

  return (
    <div className="p-12 max-w-4xl mx-auto">
      <h2 className="text-5xl font-black mb-8">Parse PDF</h2>
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-16 text-center">
        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => processContent(ev.target.result);
            reader.readAsText(file);
          }
        }} />
        <button onClick={() => fileInputRef.current.click()} className="px-10 py-5 bg-indigo-500 rounded-2xl font-black text-xl cursor-pointer hover:bg-indigo-600 transition-all flex items-center gap-4 mx-auto">
          <Upload size={24} /> SELECT DOCUMENT
        </button>
        {status.loading && <div className="mt-8 text-indigo-400 font-bold animate-pulse">{status.msg} ({status.progress}/{status.total})</div>}
      </div>
    </div>
  );
}

function BrowseView({ words, loadWords }) {
  const [search, setSearch] = useState("");
  const [activeContext, setActiveContext] = useState(null);

  const filtered = words.filter(w => w.word.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-12 max-w-5xl mx-auto">
      <h2 className="text-5xl font-black mb-8">Word Library</h2>
      <div className="relative mb-8">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" />
        <input onChange={(e) => setSearch(e.target.value)} className="w-full bg-slate-900 border-2 border-slate-700 p-4 pl-16 rounded-2xl outline-none focus:border-indigo-500 transition-all" placeholder="Search saved vocabulary..." />
      </div>

      <div className="grid gap-4">
        {filtered.map(w => (
          <div key={w.id} className="bg-slate-900 p-6 rounded-3xl border-2 border-slate-800 flex justify-between items-center hover:border-slate-600 transition-all">
            <div>
              <h3 className="text-2xl font-bold capitalize text-white mb-1">{w.word}</h3>
              <p className="text-slate-400 text-sm italic">{w.definition}</p>
            </div>
            <div className="flex gap-2">
              {/** 5. Show Sentence Modal Button */}
              {w.context && (
                <button onClick={() => setActiveContext(w.context)} className="p-3 bg-slate-800 hover:bg-indigo-500 rounded-xl cursor-pointer transition-colors text-slate-300">
                  <MessageSquare size={20} />
                </button>
              )}
              <button onClick={() => db.vocabulary.delete(w.id).then(loadWords)} className="p-3 bg-slate-800 hover:bg-red-500 rounded-xl cursor-pointer transition-colors text-slate-300">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {activeContext && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-900 p-10 rounded-[2.5rem] border-2 border-indigo-500/50 max-w-2xl w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <span className="text-indigo-400 font-black uppercase tracking-widest text-xs">Origin Sentence</span>
              <button onClick={() => setActiveContext(null)} className="p-2 hover:bg-slate-800 rounded-full cursor-pointer transition-colors"><X size={20}/></button>
            </div>
            <p className="text-2xl leading-relaxed italic text-white">"{activeContext}"</p>
            <button onClick={() => setActiveContext(null)} className="mt-10 w-full py-4 bg-slate-800 rounded-2xl font-bold cursor-pointer hover:bg-slate-700 transition-colors uppercase tracking-widest">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReaderView({ settings, loadWords }) {
  const [pdfText, setPdfText] = useState("");
  const [definition, setDefinition] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleWordClick = async (word) => {
    if (!isValidWord(word)) return;
    setLoading(true);
    const info = await fetchFromFreeDictionary(word);
    setDefinition(info);
    setLoading(false);
  };

  /**
   * 4. Ignore Word Logic
   */
  const handleIgnore = (word) => {
    db.ignored.add(word);
    setDefinition(null);
    loadWords();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-grow p-12 overflow-y-auto bg-slate-900/50 custom-scrollbar">
        {!pdfText ? (
          <div className="max-w-xl mx-auto mt-20 text-center">
            <Upload className="mx-auto mb-6 text-indigo-400" size={64} />
            <h3 className="text-3xl font-black mb-4">Reader Mode</h3>
            <p className="text-slate-400 mb-10">Paste or upload text to read interactively.</p>
            <textarea 
              className="w-full h-64 bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 outline-none focus:border-pink-500 transition-all mb-6"
              placeholder="Paste reading material here..."
              onChange={(e) => setPdfText(e.target.value)}
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto bg-slate-900 border-2 border-slate-800 p-16 rounded-[3rem] shadow-xl">
            <div className="text-xl leading-loose text-slate-300">
              {pdfText.split(/(\s+)/).map((part, idx) => {
                const isWord = /^[a-zA-Z]{4,}$/.test(part);
                return (
                  <span 
                    key={idx}
                    onClick={() => isWord && handleWordClick(part)}
                    className={isWord ? "cursor-pointer hover:bg-indigo-500/30 hover:text-white rounded px-0.5 transition-all border-b border-indigo-500/20" : ""}
                  >
                    {part}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {definition && (
        <div className="w-[400px] bg-slate-950 border-l-2 border-slate-800 p-10 flex flex-col shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-3xl font-black text-white capitalize">{definition.word}</h3>
            <button onClick={() => setDefinition(null)} className="p-2 hover:bg-slate-800 rounded-xl cursor-pointer"><X /></button>
          </div>
          
          <div className="space-y-8 flex-grow">
            <div className="bg-indigo-500/10 p-6 rounded-2xl border border-indigo-500/20">
              <span className="text-indigo-400 text-xs font-black uppercase mb-2 block tracking-widest">Definition</span>
              <p className="text-white leading-relaxed">{definition.definition}</p>
            </div>
            {definition.example && (
              <div className="bg-pink-500/10 p-6 rounded-2xl border border-pink-500/20">
                <span className="text-pink-400 text-xs font-black uppercase mb-2 block tracking-widest">Usage</span>
                <p className="text-slate-300 italic">"{definition.example}"</p>
              </div>
            )}
          </div>

          <div className="mt-auto space-y-3 pt-8">
            <button onClick={() => { db.vocabulary.add(definition).then(loadWords); setDefinition(null); }} className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 rounded-2xl font-black cursor-pointer transition-all uppercase tracking-widest">
              Save to Library
            </button>
            <button onClick={() => handleIgnore(definition.word)} className="w-full py-4 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-2xl font-bold cursor-pointer transition-all flex items-center justify-center gap-2">
              <EyeOff size={18} /> IGNORE WORD
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
