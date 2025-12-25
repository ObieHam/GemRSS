"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Search, BookOpen, Loader2, Trash2, Volume2, Plus, Menu, X, Settings, ChevronLeft, ChevronRight, FileText, List, AlertTriangle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
}

// Top 300 most common English words to ignore
const COMMON_WORDS = new Set([
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",
  "is", "was", "are", "been", "has", "had", "were", "said", "did", "having", "may", "should", "could", "being", "does", "did", "might", "must", "shall", "can",
  "tell", "does", "set", "each", "why", "ask", "men", "change", "went", "light", "kind", "off", "need", "house", "picture", "try", "us", "again", "animal", "point",
  "mother", "world", "near", "build", "self", "earth", "father", "head", "stand", "own", "page", "should", "country", "found", "answer", "school", "grow", "study", "still", "learn",
  "plant", "cover", "food", "sun", "four", "between", "state", "keep", "eye", "never", "last", "let", "thought", "city", "tree", "cross", "farm", "hard", "start", "might",
  "story", "saw", "far", "sea", "draw", "left", "late", "run", "don", "while", "press", "close", "night", "real", "life", "few", "north", "open", "seem", "together",
  "next", "white", "children", "begin", "got", "walk", "example", "ease", "paper", "group", "always", "music", "those", "both", "mark", "often", "letter", "until", "mile", "river",
  "car", "feet", "care", "second", "book", "carry", "took", "science", "eat", "room", "friend", "began", "idea", "fish", "mountain", "stop", "once", "base", "hear", "horse",
  "cut", "sure", "watch", "color", "face", "wood", "main", "enough", "plain", "girl", "usual", "young", "ready", "above", "ever", "red", "list", "though", "feel", "talk",
  "bird", "soon", "body", "dog", "family", "direct", "pose", "leave", "song", "measure", "door", "product", "black", "short", "numeral", "class", "wind", "question", "happen", "complete",
  "ship", "area", "half", "rock", "order", "fire", "south", "problem", "piece", "told", "knew", "pass", "since", "top", "whole", "king", "space", "heard", "best", "hour",
  "better", "true", "during", "hundred", "five", "remember", "step", "early", "hold", "west", "ground", "interest", "reach", "fast", "verb", "sing", "listen", "six", "table", "travel"
]);

// Database operations using localStorage
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
      if (typeof window === 'undefined') return;
      const words = await db.vocabulary.toArray();
      const filtered = words.filter(w => w.id !== id);
      localStorage.setItem('vocabWords', JSON.stringify(filtered));
    },
    clear: async () => {
      if (typeof window === 'undefined') return;
      localStorage.setItem('vocabWords', JSON.stringify([]));
    },
    where: (field) => ({
      equals: (value) => ({
        first: async () => {
          if (typeof window === 'undefined') return null;
          const words = await db.vocabulary.toArray();
          return words.find(w => w[field] === value);
        }
      })
    })
  }
};

// Settings management
const getSettings = () => {
  if (typeof window === 'undefined') {
    return {
      apiSource: 'free-dictionary',
      accent: 'us',
      autoSave: false,
      mwApiKey: ''
    };
  }
  const settings = localStorage.getItem('appSettings');
  return settings ? JSON.parse(settings) : {
    apiSource: 'free-dictionary',
    accent: 'us',
    autoSave: false,
    mwApiKey: ''
  };
};

const saveSettings = (settings) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('appSettings', JSON.stringify(settings));
};

// Validate if a word is likely a real English word
const isValidWord = (word) => {
  if (word === word.toUpperCase() && word.length > 3) return false;
  if (/\d/.test(word)) return false;
  if (!/^[a-z]+$/i.test(word)) return false;
  if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(word)) return false;
  if (word.length < 4 || word.length > 20) return false;
  const pdfTerms = ['tounicode', 'descendantfonts', 'cmap', 'basefont', 'subtype', 'encoding'];
  if (pdfTerms.includes(word.toLowerCase())) return false;
  return true;
};

// API call functions with caching
const fetchFromFreeDictionary = async (word) => {
  const cacheKey = `dict_free_${word}`;
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!res.ok) throw new Error('Word not found');
    
    const data = await res.json();
    const entry = data[0];
    
    const result = {
      word: entry.word.toLowerCase(), // Updated from baseWord to word
      definition: entry.meanings[0]?.definitions[0]?.definition || 'No definition found',
      example: entry.meanings[0]?.definitions[0]?.example || null,
      phonetics: entry.phonetics || [],
      dateAdded: Date.now()
    };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(cacheKey, JSON.stringify(result));
    }
    return result;
  } catch (error) {
    return { error: 'Word not found' };
  }
};

const fetchFromMerriamWebster = async (word, apiKey) => {
  const cacheKey = `dict_mw_${word}`;
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  if (!apiKey) return { error: 'API key required' };

  try {
    const res = await fetch(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${apiKey}`);
    const data = await res.json();

    if (data && data[0] && typeof data[0] === 'object') {
      const audioFile = data[0].hwi?.prs?.[0]?.sound?.audio;
      let audioUrl = null;

      if (audioFile) {
        let subdirectory = audioFile.charAt(0);
        if (audioFile.startsWith("bix")) subdirectory = "bix";
        else if (audioFile.startsWith("gg")) subdirectory = "gg";
        else if (/^\d/.test(subdirectory)) subdirectory = "number";
        audioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${subdirectory}/${audioFile}.mp3`;
      }

      const result = {
        word: data[0].hwi?.hw?.replace(/\*/g, "").toLowerCase() || word.toLowerCase(), // Updated from baseWord to word
        definition: data[0].shortdef?.[0] || "No definition found",
        audioUrl: audioUrl,
        example: null,
        dateAdded: Date.now()
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      }
      return result;
    }
    return { error: 'Word not found' };
  } catch (error) {
    return { error: 'API Error' };
  }
};

const fetchDefinition = async (word, settings) => {
  if (settings.apiSource === 'free-dictionary') {
    return await fetchFromFreeDictionary(word);
  } else {
    return await fetchFromMerriamWebster(word, settings.mwApiKey);
  }
};

export default function LexiBuildApp() {
  const [view, setView] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [words, setWords] = useState([]);
  const [settings, setSettings] = useState(getSettings());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    const all = await db.vocabulary.toArray();
    setWords(all.sort((a, b) => b.dateAdded - a.dateAdded));
  };

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const SettingsPanel = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black text-white">Settings</h2>
          <button onClick={() => setShowSettings(false)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
            <X size={24} className="text-white" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-slate-400 text-sm font-bold uppercase tracking-wider mb-3">Dictionary API Source</label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-750 transition-colors">
                <input
                  type="radio"
                  name="apiSource"
                  checked={settings.apiSource === 'free-dictionary'}
                  onChange={() => updateSettings({ ...settings, apiSource: 'free-dictionary' })}
                  className="w-5 h-5"
                />
                <div>
                  <div className="text-white font-bold">Free Dictionary API</div>
                  <div className="text-slate-400 text-sm">Unlimited calls, includes examples</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-750 transition-colors">
                <input
                  type="radio"
                  name="apiSource"
                  checked={settings.apiSource === 'merriam-webster'}
                  onChange={() => updateSettings({ ...settings, apiSource: 'merriam-webster' })}
                  className="w-5 h-5"
                />
                <div>
                  <div className="text-white font-bold">Merriam-Webster API</div>
                  <div className="text-slate-400 text-sm">Premium definitions (requires setup)</div>
                </div>
              </label>
            </div>
          </div>

          {settings.apiSource === 'free-dictionary' && (
            <div>
              <label className="block text-slate-400 text-sm font-bold uppercase tracking-wider mb-3">Pronunciation Accent</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'us', label: 'American' },
                  { value: 'uk', label: 'British' },
                  { value: 'au', label: 'Australian' }
                ].map(accent => (
                  <button
                    key={accent.value}
                    onClick={() => updateSettings({ ...settings, accent: accent.value })}
                    className={`p-4 rounded-xl font-bold transition-colors ${
                      settings.accent === accent.value
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {accent.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="flex items-center justify-between p-4 bg-slate-800 rounded-xl cursor-pointer">
              <div>
                <div className="text-white font-bold">Auto-save words in reader</div>
                <div className="text-slate-400 text-sm">Automatically add words to library when clicked</div>
              </div>
              <div className={`w-14 h-8 rounded-full transition-colors ${settings.autoSave ? 'bg-indigo-500' : 'bg-slate-700'} relative`}>
                <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${settings.autoSave ? 'translate-x-7' : 'translate-x-1'}`}></div>
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={settings.autoSave}
                onChange={(e) => updateSettings({ ...settings, autoSave: e.target.checked })}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );

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

        <div className="mt-12 flex gap-6">
          <div className="flex-grow p-6 bg-slate-900 border-2 border-slate-700 rounded-3xl">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Library Stats</p>
            <p className="text-4xl font-black text-white">{words.length} <span className="text-xl text-slate-500">words</span></p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-6 bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-indigo-500 rounded-3xl transition-all"
          >
            <Settings size={32} className="text-slate-400" />
          </button>
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
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <Settings size={20} />
            {sidebarOpen && <span className="font-bold">Settings</span>}
          </button>
        </nav>
      </div>
    </div>
  );

  if (view === 'home') {
    return (
      <>
        <MainMenu />
        {showSettings && <SettingsPanel />}
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
        <Sidebar />
        <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
          {view === 'parse' && <ParseView loadWords={loadWords} settings={settings} />}
          {view === 'browse' && <BrowseView words={words} loadWords={loadWords} settings={settings} />}
          {view === 'reader' && <ReaderView settings={settings} loadWords={loadWords} words={words} />}
        </div>
      </div>
      {showSettings && <SettingsPanel />}
    </>
  );
}

function ParseView({ loadWords, settings }) {
  const [status, setStatus] = useState({ loading: false, msg: '', progress: 0, total: 0 });
  const fileInputRef = useRef(null);

  const processContent = async (text) => {
    const sentences = text.replace(/\n/g, " ").match(/[^.!?]+[.!?]+/g) || [text];
    const allTokens = [];
    const existingWords = await db.vocabulary.toArray();

    for (const sentence of sentences) {
      const tokens = sentence.toLowerCase().match(/\b[a-z]{4,}\b/g);
      if (!tokens) continue;

      for (const token of tokens) {
        if (COMMON_WORDS.has(token) || !isValidWord(token)) continue;
        const exists = existingWords.find(w => w.word === token);
        if (!exists && !allTokens.find(t => t.word === token)) {
          allTokens.push({ word: token, context: sentence.trim() });
        }
      }
    }

    const total = allTokens.length;
    setStatus({ loading: true, msg: 'Processing words...', progress: 0, total });

    const batchSize = 10;
    for (let i = 0; i < allTokens.length; i += batchSize) {
      const batch = allTokens.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async ({ word, context }) => {
          try {
            const info = await fetchDefinition(word, settings);
            if (!info.error) {
              const baseExists = existingWords.find(w => w.word === info.word); // Match word property
              if (!baseExists) {
                await db.vocabulary.add({
                  ...info,
                  context: context
                });
                existingWords.push({ word: info.word });
              }
            }
          } catch (e) {
            console.error("Definition fetch error", e);
          }
        })
      );
      setStatus({ loading: true, msg: 'Processing words...', progress: Math.min(i + batchSize, total), total });
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
      let text = "";
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(" ") + " ";
        }
      } else {
        text = await file.text();
      }
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

function BrowseView({ words, loadWords, settings }) {
  const [search, setSearch] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const playAudio = (wordObj) => {
    if (settings.apiSource === 'free-dictionary') {
      const accentMap = { us: '-us', uk: '-uk', au: '-au' };
      const preferredAudio = wordObj.phonetics?.find(p => 
        p.audio && p.audio.includes(accentMap[settings.accent])
      );
      const audioUrl = preferredAudio?.audio || wordObj.phonetics?.find(p => p.audio)?.audio;
      
      if (audioUrl) {
        new Audio(audioUrl).play().catch(e => console.error("Audio play failed", e));
      }
    } else if (wordObj.audioUrl) {
      new Audio(wordObj.audioUrl).play().catch(e => console.error("Audio play failed", e));
    }
  };

  const deleteWord = async (id) => {
    await db.vocabulary.delete(id);
    await loadWords();
  };

  const clearAll = async () => {
    await db.vocabulary.clear();
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('dict_')) {
          localStorage.removeItem(key);
        }
      });
    }
    await loadWords();
    setShowClearConfirm(false);
  };

  const filtered = words.filter(w => w.word && w.word.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-5xl font-black text-white">Word Library</h2>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-3 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/30 hover:border-red-500 rounded-2xl font-bold text-red-400 transition-all"
          >
            <Trash2 size={20} />
            Clear All
          </button>
        </div>
        
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
                    <p className="text-slate-400 text-sm line-clamp-2">{w.definition}</p>
                    {w.example && (
                      <p className="text-slate-500 text-sm italic mt-2">"{w.example}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {((settings.apiSource === 'free-dictionary' && w.phonetics?.length > 0) || 
                      (settings.apiSource === 'merriam-webster' && w.audioUrl)) && (
                      <button
                        onClick={() => playAudio(w)}
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

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-red-500/30 rounded-3xl p-8 max-md w-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <AlertTriangle size={32} className="text-red-400" />
              </div>
              <h3 className="text-2xl font-black text-white">Clear All Words?</h3>
            </div>
            <p className="text-slate-400 mb-8">
              This will permanently delete all {words.length} words from your library and clear all cached data. This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={clearAll}
                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-bold transition-colors"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReaderView({ settings, loadWords, words }) {
  const [pdfPages, setPdfPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [highlightedWords, setHighlightedWords] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [definitionPanel, setDefinitionPanel] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          pages.push(pageText);
        }

        setPdfPages(pages);
        setTotalPages(pages.length);
        setCurrentPage(1);
        analyzePageWords(pages[0]);
      } else {
        const text = await file.text();
        const pages = text.split('\n\n\n');
        setPdfPages(pages);
        setTotalPages(pages.length);
        setCurrentPage(1);
        analyzePageWords(pages[0]);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const analyzePageWords = async (pageText) => {
    const tokens = pageText.match(/\b[a-zA-Z]{4,}\b/g) || [];
    const newWords = [];
    const allWords = await db.vocabulary.toArray();

    for (const token of tokens) {
      const lowerToken = token.toLowerCase();
      if (COMMON_WORDS.has(lowerToken)) continue;
      
      if (isValidWord(lowerToken) || token === token.toUpperCase()) {
        const exists = allWords.find(w => w.word === lowerToken);
        if (!exists && !newWords.includes(token)) {
          newWords.push(token);
        }
      }
    }

    setHighlightedWords(newWords);
  };

  useEffect(() => {
    if (pdfPages.length > 0 && currentPage > 0) {
      analyzePageWords(pdfPages[currentPage - 1]);
      setDefinitionPanel(null);
    }
  }, [currentPage, pdfPages, words]);

  const handleWordClick = async (word) => {
    const lowerWord = word.toLowerCase();
    
    if (!isValidWord(lowerWord) && word !== word.toUpperCase()) {
      return;
    }
    
    setSelectedWord(lowerWord);
    setDefinitionPanel({ loading: true });
    
    try {
      const info = await fetchDefinition(lowerWord, settings);
      
      if (info.error) {
        setDefinitionPanel({ error: info.error });
        return;
      }
      
      setDefinitionPanel(info);

      if (settings.autoSave) {
        await db.vocabulary.add(info);
        await loadWords();
        setHighlightedWords(prev => prev.filter(w => w.toLowerCase() !== info.word));
      }
    } catch (error) {
      console.error('Error fetching definition:', error);
      setDefinitionPanel({ error: 'Failed to load definition' });
    }
  };

  const addToLibrary = async () => {
    if (definitionPanel && !definitionPanel.loading && !definitionPanel.error) {
      await db.vocabulary.add(definitionPanel);
      await loadWords();
      setHighlightedWords(prev => prev.filter(w => w.toLowerCase() !== definitionPanel.word));
      setDefinitionPanel(null);
    }
  };

  const playAudio = () => {
    if (!definitionPanel) return;
    
    if (settings.apiSource === 'free-dictionary' && definitionPanel.phonetics) {
      const accentMap = { us: '-us', uk: '-uk', au: '-au' };
      const preferredAudio = definitionPanel.phonetics.find(p =>
        p.audio && p.audio.includes(accentMap[settings.accent])
      );
      const audioUrl = preferredAudio?.audio || definitionPanel.phonetics.find(p => p.audio)?.audio;

      if (audioUrl) {
        new Audio(audioUrl).play().catch(e => console.error("Audio play failed", e));
      }
    } else if (definitionPanel.audioUrl) {
      new Audio(definitionPanel.audioUrl).play().catch(e => console.error("Audio play failed", e));
    }
  };

  const renderText = () => {
    if (pdfPages.length === 0) return null;
    const currentText = pdfPages[currentPage - 1] || '';
    const parts = currentText.split(/(\s+|[.,!?;:()"])/);
    
    return (
      <div className="text-slate-200 leading-relaxed text-lg">
        {parts.map((part, idx) => {
          if (highlightedWords.includes(part)) {
            return (
              <mark
                key={idx}
                className="bg-yellow-400/40 border-b-2 border-yellow-500 cursor-pointer hover:bg-yellow-400/60 transition-colors px-0.5"
                onClick={() => handleWordClick(part)}
              >
                {part}
              </mark>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="flex h-screen">
      <div className="flex-grow p-12 overflow-y-auto">
        {pdfPages.length === 0 ? (
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
                disabled={loading}
                className="inline-flex items-center gap-4 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 rounded-2xl font-bold text-lg transition-colors"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                {loading ? 'Processing...' : 'Upload PDF'}
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
                  className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-slate-400 font-bold min-w-[120px] text-center">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-12 min-h-[600px]">
              {renderText()}
            </div>
          </div>
        )}
      </div>

      {definitionPanel && (
        <div className="w-96 bg-slate-950 border-l-2 border-slate-800 p-8 overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-white capitalize">
              {definitionPanel.loading ? 'Loading...' : definitionPanel.word || selectedWord}
            </h3>
            <button onClick={() => setDefinitionPanel(null)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          {definitionPanel.loading ? (
            <div className="flex-grow flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-400" size={32} />
            </div>
          ) : definitionPanel.error ? (
            <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-6 text-center">
              <p className="text-red-400 font-bold mb-2">Word Not Found</p>
              <p className="text-slate-400 text-sm">{definitionPanel.error}</p>
            </div>
          ) : (
            <div className="space-y-6 flex-grow flex flex-col">
              <div>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Definition</p>
                <p className="text-white leading-relaxed">{definitionPanel.definition}</p>
              </div>

              {definitionPanel.example && (
                <div>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Example</p>
                  <p className="text-slate-300 italic leading-relaxed">"{definitionPanel.example}"</p>
                </div>
              )}

              <div className="flex-grow"></div>

              <div className="space-y-3">
                {((settings.apiSource === 'free-dictionary' && definitionPanel.phonetics?.some(p => p.audio)) ||
                  (settings.apiSource === 'merriam-webster' && definitionPanel.audioUrl)) && (
                  <button
                    onClick={playAudio}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors font-bold"
                  >
                    <Volume2 size={20} />
                    Play Pronunciation
                  </button>
                )}

                {!settings.autoSave && (
                  <button
                    onClick={addToLibrary}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-colors font-bold text-lg"
                  >
                    <Plus size={20} />
                    Add to Library
                  </button>
                )}

                {settings.autoSave && (
                  <div className="bg-green-500/10 border-2 border-green-500/30 rounded-2xl p-4 text-center">
                    <p className="text-green-400 text-sm font-bold">✓ Auto-saved to library</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
