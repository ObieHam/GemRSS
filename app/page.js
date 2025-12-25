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
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

const COMMON_WORDS = new Set(["the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what"]);

const normalizeWord = (word) => {
  let normalized = word.toLowerCase().trim().replace(/[.,!?;:()"]/g, "");
  if (normalized.endsWith('ily')) return normalized.replace(/ily$/, 'y');
  if (normalized.endsWith('ly')) return normalized.slice(0, -2);
  if (normalized.endsWith('ed')) return normalized.slice(0, -2);
  if (normalized.endsWith('ing')) return normalized.slice(0, -3);
  if (normalized.endsWith('ies')) return normalized.replace(/ies$/, 'y');
  if (normalized.endsWith('s') && !normalized.endsWith('ss')) return normalized.slice(0, -1);
  return normalized;
};

const db = {
  vocabulary: {
    toArray: async () => {
      if (typeof window === 'undefined') return [];
      const words = localStorage.getItem('vocabWords');
      return words ? JSON.parse(words) : [];
    },
    add: async (word) => {
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
  if (typeof window === 'undefined') return { apiSource: 'free-dictionary', accent: 'us', autoSave: false };
  const settings = localStorage.getItem('appSettings');
  return settings ? JSON.parse(settings) : { apiSource: 'free-dictionary', accent: 'us', autoSave: false };
};

const isValidWord = (word) => {
  const ignored = db.ignored.get();
  const lower = word.toLowerCase();
  if (ignored.includes(lower)) return false;
  // Filter out PDF metadata/nonsense strings
  if (lower.length < 4 || /\d/.test(lower) || !/^[a-z]+$/i.test(lower) || lower.includes('obj') || lower.includes('endobj')) return false;
  return true;
};

const fetchDefinition = async (rawWord) => {
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

  useEffect(() => { loadWords(); }, []);

  const loadWords = async () => {
    const all = await db.vocabulary.toArray();
    setWords(all.sort((a, b) => b.dateAdded - a.dateAdded));
  };

  const MainMenu = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-16">
          <div className="bg-indigo-500 p-4 rounded-2xl shadow-2xl inline-block mb-6"><BookOpen size={48} /></div>
          <h1 className="text-7xl font-black tracking-tighter mb-4 bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">LEXIBUILD</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Swapped: Interactive Reader is now where Library & Stats was */}
          <button onClick={() => setView('reader')} className="group bg-slate-900 border-2 border-slate-700 hover:border-pink-500 p-8 rounded-3xl transition-all hover:scale-105 cursor-pointer text-left">
            <FileText size={40} className="text-pink-400 mb-4" />
            <h3 className="text-2xl font-bold text-white">Interactive Reader</h3>
            <p className="text-slate-400">Read PDFs and click to learn</p>
          </button>

          <button onClick={() => setView('parse')} className="group bg-slate-900 border-2 border-slate-700 hover:border-indigo-500 p-8 rounded-3xl transition-all hover:scale-105 cursor-pointer text-left">
            <Upload size={40} className="text-indigo-400 mb-4" />
            <h3 className="text-2xl font-bold text-white">Parse PDF</h3>
            <p className="text-slate-400">Deep extract vocabulary</p>
          </button>

          {/* Library & Stats moved to bottom span */}
          <button onClick={() => setView('browse')} className="group md:col-span-2 bg-slate-900 border-2 border-slate-700 hover:border-purple-500 p-8 rounded-3xl transition-all hover:scale-105 cursor-pointer flex items-center justify-between">
            <div className="flex items-center gap-6">
              <List size={40} className="text-purple-400" />
              <div className="text-left">
                <h3 className="text-2xl font-bold text-white">Library & Stats</h3>
                <p className="text-slate-400">Review and manage your words</p>
              </div>
            </div>
            <div className="bg-purple-500/20 text-purple-400 px-6 py-2 rounded-2xl font-black border border-purple-500/30 text-xl">
              {words.length} WORDS
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      {view === 'home' ? <MainMenu /> : (
        <div className="flex">
          <Sidebar view={view} setView={setView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <div className={`flex-grow transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
            {view === 'parse' && <ParseView loadWords={loadWords} settings={settings} />}
            {view === 'browse' && <BrowseView words={words} loadWords={loadWords} settings={settings} />}
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
    { id: 'reader', icon: FileText, label: 'Reader' },
    { id: 'parse', icon: Upload, label: 'Parse' },
    { id: 'browse', icon: List, label: 'Library' },
  ];
  return (
    <div className={`fixed top-0 left-0 h-full bg-slate-950 border-r-2 border-slate-800 transition-all z-50 ${sidebarOpen ? 'w-72' : 'w-20'}`}>
      <div className="p-6">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 mb-10 hover:bg-slate-800 rounded-xl cursor-pointer"><Menu size={24} /></button>
        <nav className="space-y-3">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id)} className={`w-full flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${view === item.id ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
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

  const processPDF = async (file) => {
    setStatus({ loading: true, msg: 'Reading PDF layers...', progress: 0, total: 0 });
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        // Fixed: Ensure only valid text items are joined to avoid metadata objects
        const pageText = content.items
          .filter(item => item.str && item.str.trim().length > 0)
          .map(item => item.str)
          .join(" ");
        fullText += pageText + " ";
      }

      const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];
      const tokens = [];
      const existing = await db.vocabulary.toArray();

      sentences.forEach(s => {
        const wordsInSentence = s.toLowerCase().match(/\b[a-z]{4,}\b/g);
        if (wordsInSentence) {
          wordsInSentence.forEach(t => {
            if (!COMMON_WORDS.has(t) && isValidWord(t) && !existing.some(e => e.word === normalizeWord(t))) {
              if (!tokens.find(tk => tk.word === t)) tokens.push({ word: t, context: s.trim() });
            }
          });
        }
      });

      setStatus({ loading: true, msg: 'Extracting definitions...', progress: 0, total: tokens.length });
      for (let i = 0; i < tokens.length; i++) {
        const info = await fetchDefinition(tokens[i].word);
        if (!info.error) await db.vocabulary.add({ ...info, context: tokens[i].context });
        setStatus(prev => ({ ...prev, progress: i + 1 }));
      }
      await loadWords();
      setStatus({ loading: false, msg: 'Extraction Complete!' });
    } catch (e) { setStatus({ loading: false, msg: 'Error parsing PDF' }); }
  };

  return (
    <div className="p-12 max-w-4xl mx-auto text-center">
      <h2 className="text-5xl font-black mb-8">Deep Parser</h2>
      <div className="bg-slate-900 border-2 border-dashed border-slate-700 p-20 rounded-[3rem]">
        <input ref={fileInputRef} type="file" className="hidden" accept=".pdf" onChange={e => e.target.files[0] && processPDF(e.target.files[0])} />
        <button onClick={() => fileInputRef.current.click()} className="px-12 py-6 bg-indigo-500 rounded-3xl font-black text-xl cursor-pointer hover:bg-indigo-600 transition-all flex items-center gap-4 mx-auto shadow-2xl shadow-indigo-500/20">
          <Upload /> CHOOSE PDF FILE
        </button>
        {status.loading && (
          <div className="mt-10">
            <div className="text-indigo-400 font-bold mb-2">{status.msg}</div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${(status.progress/status.total)*100}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BrowseView({ words, loadWords, settings }) {
  const [search, setSearch] = useState("");
  const [activeContext, setActiveContext] = useState(null);

  const playAudio = (phonetics) => {
    const audio = phonetics.find(p => p.audio)?.audio;
    if (audio) new Audio(audio).play().catch(() => {});
  };

  const filtered = words.filter(w => w.word.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-12 max-w-5xl mx-auto">
      <h2 className="text-5xl font-black mb-8">Vocabulary Library</h2>
      <div className="relative mb-10">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" />
        <input onChange={(e) => setSearch(e.target.value)} className="w-full bg-slate-900 border-2 border-slate-700 p-5 pl-16 rounded-2xl outline-none focus:border-indigo-500 transition-all text-xl" placeholder="Search your words..." />
      </div>

      <div className="grid gap-4">
        {filtered.map(w => (
          <div key={w.id} className="bg-slate-900 p-8 rounded-[2rem] border-2 border-slate-800 flex justify-between items-center group hover:border-slate-600 transition-all">
            <div>
              <h3 className="text-3xl font-black capitalize text-white mb-2">{w.word}</h3>
              <p className="text-slate-400 leading-relaxed max-w-2xl">{w.definition}</p>
            </div>
            <div className="flex gap-3">
              {/* Restored: Audio Button */}
              {w.phonetics?.length > 0 && (
                <button onClick={() => playAudio(w.phonetics)} className="p-4 bg-slate-800 hover:bg-indigo-500 rounded-2xl cursor-pointer transition-colors text-slate-300">
                  <Volume2 size={24} />
                </button>
              )}
              {w.context && (
                <button onClick={() => setActiveContext(w.context)} className="p-4 bg-slate-800 hover:bg-pink-500 rounded-2xl cursor-pointer transition-colors text-slate-300">
                  <MessageSquare size={24} />
                </button>
              )}
              <button onClick={() => db.vocabulary.delete(w.id).then(loadWords)} className="p-4 bg-slate-800 hover:bg-red-500 rounded-2xl cursor-pointer transition-colors text-slate-300">
                <Trash2 size={24} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {activeContext && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 z-[100]">
          <div className="bg-slate-900 p-12 rounded-[3rem] border-2 border-indigo-500/30 max-w-3xl w-full">
            <div className="flex justify-between items-center mb-8">
              <span className="text-indigo-400 font-black uppercase tracking-widest text-sm">Sentence Context</span>
              <button onClick={() => setActiveContext(null)} className="p-2 hover:bg-slate-800 rounded-full cursor-pointer"><X /></button>
            </div>
            <p className="text-3xl leading-relaxed italic text-white font-serif">"{activeContext}"</p>
            <button onClick={() => setActiveContext(null)} className="mt-12 w-full py-5 bg-slate-800 rounded-2xl font-black cursor-pointer hover:bg-slate-700 transition-all uppercase tracking-widest">Close Context</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReaderView({ settings, loadWords }) {
  const [pdfData, setPdfData] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [definition, setDefinition] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const loadPDF = async (file) => {
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const extractedPages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // Fixed: Joining only strings to avoid metadata showing up
        const text = textContent.items
          .filter(item => item.str)
          .map(item => item.str)
          .join(" ");
        extractedPages.push(text);
      }
      setPages(extractedPages);
      setPdfData(true);
      setCurrentPage(1);
    } catch (e) { alert("Error loading PDF"); }
    setLoading(false);
  };

  const handleWordClick = async (word, context) => {
    if (!isValidWord(word)) return;
    setLoading(true);
    const info = await fetchDefinition(word);
    if (!info.error) setDefinition({ ...info, context });
    setLoading(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-grow p-12 overflow-y-auto bg-slate-900/20">
        {!pdfData ? (
          <div className="max-w-xl mx-auto mt-20 text-center">
            <div className="bg-pink-500/10 p-10 rounded-[3rem] border-2 border-dashed border-pink-500/20">
              <Upload className="mx-auto mb-6 text-pink-400" size={64} />
              <h3 className="text-3xl font-black mb-4">Interactive PDF Reader</h3>
              <p className="text-slate-400 mb-10 text-lg">Upload any PDF to start learning interactively.</p>
              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf" onChange={e => e.target.files[0] && loadPDF(e.target.files[0])} />
              <button onClick={() => fileInputRef.current.click()} className="w-full py-6 bg-pink-500 rounded-3xl font-black text-xl cursor-pointer hover:bg-pink-600 transition-all shadow-xl shadow-pink-500/20">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : "UPLOAD PDF"}
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-10 bg-slate-900 p-6 rounded-3xl border-2 border-slate-800">
              <button onClick={() => setCurrentPage(c => Math.max(1, c-1))} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl cursor-pointer"><ChevronLeft /></button>
              <span className="font-black text-xl">PAGE {currentPage} / {pages.length}</span>
              <button onClick={() => setCurrentPage(c => Math.min(pages.length, c+1))} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl cursor-pointer"><ChevronRight /></button>
            </div>
            
            <div className="bg-slate-900 border-2 border-slate-800 p-20 rounded-[4rem] shadow-2xl min-h-[1000px]">
              <div className="text-2xl leading-[2.5] text-slate-200 font-serif">
                {pages[currentPage-1].split(/(\s+)/).map((part, idx) => {
                  const isWord = /^[a-zA-Z]{4,}$/.test(part.replace(/[.,!?;:()"]/g, ""));
                  return (
                    <span 
                      key={idx}
                      onClick={() => isWord && handleWordClick(part, pages[currentPage-1])}
                      className={isWord ? "cursor-pointer hover:bg-indigo-500/40 hover:text-white rounded px-1 transition-all border-b-2 border-indigo-500/10 mx-0.5" : ""}
                    >
                      {part}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {definition && (
        <div className="w-[450px] bg-slate-950 border-l-2 border-slate-800 p-12 flex flex-col shadow-2xl overflow-y-auto">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-4xl font-black text-white capitalize">{definition.word}</h3>
            <button onClick={() => setDefinition(null)} className="p-3 hover:bg-slate-800 rounded-2xl cursor-pointer"><X size={28} /></button>
          </div>
          
          <div className="space-y-10 flex-grow">
            <div className="bg-indigo-500/5 p-8 rounded-3xl border border-indigo-500/10">
              <span className="text-indigo-400 text-xs font-black uppercase mb-4 block tracking-widest">Definition</span>
              <p className="text-white text-xl leading-relaxed">{definition.definition}</p>
            </div>
            {definition.example && (
              <div className="bg-pink-500/5 p-8 rounded-3xl border border-pink-500/10">
                <span className="text-pink-400 text-xs font-black uppercase mb-4 block tracking-widest">Usage Example</span>
                <p className="text-slate-300 italic text-lg">"{definition.example}"</p>
              </div>
            )}
          </div>

          <div className="mt-auto pt-10 space-y-4">
            <button onClick={() => { db.vocabulary.add(definition).then(loadWords); setDefinition(null); }} className="w-full py-6 bg-indigo-500 hover:bg-indigo-600 rounded-3xl font-black text-xl cursor-pointer transition-all uppercase shadow-lg shadow-indigo-500/20">
              SAVE TO LIBRARY
            </button>
            <button onClick={() => { db.ignored.add(definition.word); setDefinition(null); }} className="w-full py-5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-3xl font-bold cursor-pointer transition-all flex items-center justify-center gap-3">
              <EyeOff size={20} /> IGNORE WORD
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
