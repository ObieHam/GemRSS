import React, { useState, useEffect, useRef } from 'react';
import { Upload, Search, BookOpen, Loader2, Trash2, Volume2, Plus, Menu, X, Settings, ChevronLeft, ChevronRight, FileText, List } from 'lucide-react';

// Mock database (replace with your Dexie implementation)
const mockDB = {
  vocabulary: {
    toArray: async () => JSON.parse(localStorage.getItem('vocabWords') || '[]'),
    add: async (word) => {
      const words = JSON.parse(localStorage.getItem('vocabWords') || '[]');
      const newWord = { ...word, id: Date.now() };
      words.push(newWord);
      localStorage.setItem('vocabWords', JSON.stringify(words));
      return newWord;
    },
    delete: async (id) => {
      const words = JSON.parse(localStorage.getItem('vocabWords') || '[]');
      localStorage.setItem('vocabWords', JSON.stringify(words.filter(w => w.id !== id)));
    },
    where: (field) => ({
      equals: (value) => ({
        first: async () => {
          const words = JSON.parse(localStorage.getItem('vocabWords') || '[]');
          return words.find(w => w[field] === value);
        }
      })
    })
  }
};

const STOP_WORDS = new Set(["the", "and", "was", "for", "that", "with", "this", "are", "have", "from", "but", "not", "you", "all", "any", "can", "had", "her", "him", "his", "its", "one", "our", "out", "she", "there", "their", "they", "will", "would"]);

// Mock API call (replace with your actual API)
const fetchDefinition = async (word) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  return {
    baseWord: word.toLowerCase(),
    definition: `Definition of ${word} - a sample definition for demonstration purposes.`,
    audioUrl: null,
    dateAdded: Date.now()
  };
};

export default function LexiBuildApp() {
  const [view, setView] = useState('home'); // 'home', 'parse', 'browse', 'reader'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [words, setWords] = useState([]);
  const [autoSave, setAutoSave] = useState(false);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    const all = await mockDB.vocabulary.toArray();
    setWords(all.sort((a, b) => b.dateAdded - a.dateAdded));
  };

  const MainMenu = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="bg-indigo-500 p-4 rounded-2xl shadow-2xl shadow-indigo-500/30">
              <BookOpen size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-7xl font-black tracking-tighter mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            LEXIBUILD
          </h1>
          <p className="text-slate-400 text-xl font-medium">Smart Vocabulary Builder</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => setView('parse')}
            className="group bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-indigo-500 p-8 rounded-3xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20"
          >
            <Upload size={40} className="text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-2 text-white">Parse PDF</h3>
            <p className="text-slate-400 text-sm">Extract all vocabulary from document</p>
          </button>

          <button
            onClick={() => setView('browse')}
            className="group bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-purple-500 p-8 rounded-3xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
          >
            <List size={40} className="text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-2 text-white">Browse Library</h3>
            <p className="text-slate-400 text-sm">View your saved vocabulary</p>
          </button>

          <button
            onClick={() => setView('reader')}
            className="group bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-pink-500 p-8 rounded-3xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20"
          >
            <FileText size={40} className="text-pink-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-2 text-white">PDF Reader</h3>
            <p className="text-slate-400 text-sm">Read and learn interactively</p>
          </button>
        </div>

        <div className="mt-12 p-6 bg-slate-900 border-2 border-slate-700 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Library Stats</p>
              <p className="text-4xl font-black text-white">{words.length} <span className="text-xl text-slate-500">words</span></p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <span className="text-slate-400 text-sm font-medium">Auto-save words</span>
                <div className={`w-14 h-8 rounded-full transition-colors ${autoSave ? 'bg-indigo-500' : 'bg-slate-700'} relative`}>
                  <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${autoSave ? 'translate-x-7' : 'translate-x-1'}`}></div>
                </div>
                <input type="checkbox" className="hidden" checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const Sidebar = () => (
    <div className={`fixed top-0 left-0 h-full bg-slate-950 border-r-2 border-slate-800 transition-all duration-300 z-50 ${sidebarOpen ? 'w-72' : 'w-20'}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-12">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 p-2 rounded-xl">
                <BookOpen size={24} className="text-white" />
              </div>
              <span className="text-xl font-black">LEXIBUILD</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="space-y-3">
          <button
            onClick={() => setView('home')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${view === 'home' ? 'bg-indigo-500 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <BookOpen size={20} />
            {sidebarOpen && <span className="font-bold">Home</span>}
          </button>
          <button
            onClick={() => setView('parse')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${view === 'parse' ? 'bg-indigo-500 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Upload size={20} />
            {sidebarOpen && <span className="font-bold">Parse PDF</span>}
          </button>
          <button
            onClick={() => setView('browse')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${view === 'browse' ? 'bg-indigo-500 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <List size={20} />
            {sidebarOpen && <span className="font-bold">Browse</span>}
          </button>
          <button
            onClick={() => setView('reader')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${view === 'reader' ? 'bg-indigo-500 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <FileText size={20} />
            {sidebarOpen && <span className="font-bold">Reader</span>}
          </button>
        </nav>
      </div>
    </div>
  );

  if (view === 'home') {
    return <MainMenu />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <Sidebar />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        {view === 'parse' && <ParseView loadWords={loadWords} />}
        {view === 'browse' && <BrowseView words={words} loadWords={loadWords} />}
        {view === 'reader' && <ReaderView autoSave={autoSave} loadWords={loadWords} words={words} />}
      </div>
    </div>
  );
}

function ParseView({ loadWords }) {
  const [status, setStatus] = useState({ loading: false, msg: '', progress: 0, total: 0 });
  const fileInputRef = useRef(null);

  const processContent = async (text) => {
    const sentences = text.replace(/\n/g, " ").match(/[^.!?]+[.!?]+/g) || [text];
    const allTokens = [];

    for (const sentence of sentences) {
      const tokens = sentence.toLowerCase().match(/\b[a-z]{4,}\b/g);
      if (tokens) {
        for (const token of tokens) {
          if (!STOP_WORDS.has(token)) {
            const exists = await mockDB.vocabulary.where('word').equals(token).first();
            if (!exists) {
              allTokens.push({ word: token, context: sentence.trim() });
            }
          }
        }
      }
    }

    const total = allTokens.length;
    setStatus({ loading: true, msg: 'Processing words...', progress: 0, total });

    // Batch process 10 words at a time
    const batchSize = 10;
    for (let i = 0; i < allTokens.length; i += batchSize) {
      const batch = allTokens.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async ({ word, context }) => {
          try {
            const info = await fetchDefinition(word);
            const baseExists = await mockDB.vocabulary.where('word').equals(info.baseWord).first();
            if (!baseExists && !info.error) {
              await mockDB.vocabulary.add({
                word: info.baseWord,
                definition: info.definition,
                audioUrl: info.audioUrl,
                context: context,
                dateAdded: Date.now()
              });
            }
          } catch (e) {
            console.error("Definition fetch error", e);
          }
        })
      );
      setStatus({ loading: true, msg: 'Processing words...', progress: i + batch.length, total });
    }

    await loadWords();
    setStatus({ loading: false, msg: 'Complete!', progress: total, total });
    setTimeout(() => setStatus({ loading: false, msg: '', progress: 0, total: 0 }), 2000);
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus({ loading: true, msg: 'Reading file...', progress: 0, total: 0 });
    
    try {
      const text = await file.text();
      await processContent(text);
    } catch (err) {
      console.error(err);
      alert("Error processing file");
      setStatus({ loading: false, msg: '', progress: 0, total: 0 });
    }
  };

  return (
    <div className="p-12 max-w-4xl mx-auto">
      <h2 className="text-5xl font-black mb-8 text-white">Parse PDF</h2>
      <p className="text-slate-400 text-lg mb-12">Extract and save all vocabulary from your document</p>

      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-12 text-center">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFile}
          accept=".pdf,.txt"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={status.loading}
          className="inline-flex items-center gap-4 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 rounded-2xl font-bold text-lg transition-colors"
        >
          <Upload size={24} />
          {status.loading ? 'Processing...' : 'Select File'}
        </button>
      </div>

      {status.loading && status.total > 0 && (
        <div className="mt-8 bg-slate-900 border-2 border-indigo-500/30 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-bold">{status.msg}</span>
            <span className="text-indigo-400 font-bold">{Math.round((status.progress / status.total) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
              style={{ width: `${(status.progress / status.total) * 100}%` }}
            ></div>
          </div>
          <p className="text-slate-400 text-sm mt-4 text-center">
            {status.progress} of {status.total} words processed
          </p>
        </div>
      )}

      {!status.loading && status.msg === 'Complete!' && (
        <div className="mt-8 bg-green-500/10 border-2 border-green-500/30 rounded-3xl p-8 text-center">
          <p className="text-green-400 font-bold text-xl">✓ Processing Complete!</p>
        </div>
      )}
    </div>
  );
}

function BrowseView({ words, loadWords }) {
  const [search, setSearch] = useState("");

  const playAudio = (url) => {
    if (url) new Audio(url).play().catch(e => console.error("Audio play failed", e));
  };

  const deleteWord = async (id) => {
    await mockDB.vocabulary.delete(id);
    await loadWords();
  };

  const filtered = words.filter(w => w.word && w.word.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-12">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-5xl font-black mb-8 text-white">Word Library</h2>
        
        <div className="relative mb-8">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
          <input
            type="text"
            placeholder="Search words..."
            className="w-full bg-slate-900 border-2 border-slate-700 focus:border-indigo-500 pl-16 pr-6 py-4 rounded-2xl outline-none transition-all text-lg font-medium text-white placeholder-slate-500"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-xl">No words found</p>
            </div>
          ) : (
            <div className="divide-y-2 divide-slate-800">
              {filtered.map((w) => (
                <div key={w.id} className="p-6 hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                  <div className="flex-grow">
                    <h3 className="text-2xl font-bold text-white capitalize mb-1">{w.word}</h3>
                    <p className="text-slate-400 text-sm">{w.definition}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {w.audioUrl && (
                      <button
                        onClick={() => playAudio(w.audioUrl)}
                        className="p-3 bg-slate-800 hover:bg-indigo-500 rounded-xl transition-colors"
                      >
                        <Volume2 size={20} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteWord(w.id)}
                      className="p-3 bg-slate-800 hover:bg-red-500 rounded-xl transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReaderView({ autoSave, loadWords, words }) {
  const [pdfText, setPdfText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [highlightedWords, setHighlightedWords] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [definitionPanel, setDefinitionPanel] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const pages = text.split('\n\n\n'); // Simple page splitting
    setPdfText(text);
    setTotalPages(pages.length || 1);
    setCurrentPage(1);
    analyzePageWords(pages[0] || text);
  };

  const analyzePageWords = async (pageText) => {
    const tokens = pageText.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const newWords = [];

    for (const token of tokens) {
      if (!STOP_WORDS.has(token)) {
        const exists = words.find(w => w.word === token);
        if (!exists && !newWords.includes(token)) {
          newWords.push(token);
        }
      }
    }

    setHighlightedWords(newWords);
  };

  const handleWordClick = async (word) => {
    setSelectedWord(word);
    const info = await fetchDefinition(word);
    setDefinitionPanel(info);
  };

  const addToLibrary = async () => {
    if (definitionPanel) {
      await mockDB.vocabulary.add(definitionPanel);
      await loadWords();
      setHighlightedWords(prev => prev.filter(w => w !== definitionPanel.baseWord));
      if (!autoSave) {
        alert('Word added to library!');
      }
    }
  };

  const renderText = () => {
    if (!pdfText) return null;
    
    let rendered = pdfText;
    highlightedWords.forEach(word => {
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      rendered = rendered.replace(regex, `<span class="bg-yellow-500/30 border-b-2 border-yellow-500 cursor-pointer hover:bg-yellow-500/50 transition-colors" data-word="$1">$1</span>`);
    });

    return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: rendered }} onClick={(e) => {
      const word = e.target.getAttribute('data-word');
      if (word) handleWordClick(word.toLowerCase());
    }} />;
  };

  return (
    <div className="flex h-screen">
      <div className="flex-grow p-12 overflow-y-auto">
        {!pdfText ? (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-black mb-8 text-white">PDF Reader</h2>
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-12 text-center">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.txt"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-4 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 rounded-2xl font-bold text-lg transition-colors"
              >
                <Upload size={24} />
                Upload PDF
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-white">Reading Mode</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-xl transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-slate-400 font-bold">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-xl transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-12 text-slate-200 leading-relaxed">
              {renderText()}
            </div>
          </div>
        )}
      </div>

      {definitionPanel && (
        <div className="w-96 bg-slate-950 border-l-2 border-slate-800 p-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-white capitalize">{definitionPanel.baseWord}</h3>
            <button onClick={() => setDefinitionPanel(null)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Definition</p>
              <p className="text-white leading-relaxed">{definitionPanel.definition}</p>
            </div>

            {definitionPanel.audioUrl && (
              <button
                onClick={() => new Audio(definitionPanel.audioUrl).play()}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors font-bold"
              >
                <Volume2 size={20} />
                Play Pronunciation
              </button>
            )}

            <button
              onClick={addToLibrary}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-colors font-bold text-lg"
            >
              <Plus size={20} />
              Add to Library
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
