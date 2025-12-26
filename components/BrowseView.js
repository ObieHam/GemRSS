import { useState } from 'react';
import { Search, Trash2, Volume2, AlertTriangle, BookOpen, ExternalLink } from 'lucide-react';
import { db } from '../lib/storage';

export default function BrowseView({ words, loadWords, settings, setView }) {
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
    // 1. Clear the primary vocabulary database
    await db.vocabulary.clear();
    
    // 2. Clear performance data for both Flashcards and Spelling
    if (typeof window !== 'undefined') {
      localStorage.removeItem('flashcardReviews');
      localStorage.removeItem('spellingReviews');
      
      // 3. Clear any cached dictionary definitions
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('dict_')) {
          localStorage.removeItem(key);
        }
      });
    }
    
    await loadWords();
    setShowClearConfirm(false);
  };

  const filtered = words.filter(w => 
    w.word && w.word.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header & Management Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-white">Library Management</h2>
          <p className="text-slate-400 text-lg mt-1">Manage your {words.length} saved words</p>
        </div>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/30 text-red-400 rounded-2xl font-bold text-sm transition-all"
        >
          <Trash2 size={18} />
          Reset Library
        </button>
      </div>

      {/* Quick Access Stats Row (Compact) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <button 
          onClick={() => setView('flashcard-stats')}
          className="bg-[#1e293b] border-2 border-slate-700/50 p-5 rounded-[2rem] flex items-center justify-between group hover:border-indigo-500/50 transition-all"
        >
          <div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Flashcard Stats</p>
            <p className="text-lg font-bold text-white">View Progress</p>
          </div>
          <ExternalLink size={18} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
        </button>

        <button 
          onClick={() => setView('spelling-stats')}
          className="bg-[#1e293b] border-2 border-slate-700/50 p-5 rounded-[2rem] flex items-center justify-between group hover:border-blue-500/50 transition-all"
        >
          <div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Spelling Stats</p>
            <p className="text-lg font-bold text-white">View Accuracy</p>
          </div>
          <ExternalLink size={18} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
        </button>

        <div className="hidden md:flex bg-[#1e293b] border-2 border-slate-700/50 p-5 rounded-[2rem] items-center gap-3">
          <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Total</p>
            <p className="text-lg font-bold text-white">{words.length} Words</p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Search vocabulary..."
          className="w-full bg-slate-900 border-2 border-slate-700/50 focus:border-indigo-500/50 pl-12 pr-6 py-4 rounded-2xl outline-none transition-all text-white placeholder-slate-600"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Word List Table Style */}
      <div className="bg-[#1e293b] border-2 border-slate-700/50 rounded-3xl overflow-hidden shadow-xl">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <BookOpen size={40} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium text-lg">No words found in library</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {filtered.map((w) => (
              <div key={w.id} className="p-5 hover:bg-slate-800/30 transition-colors flex items-center justify-between group">
                <div className="flex-grow max-w-[70%]">
                  <h3 className="text-xl font-bold text-white capitalize mb-0.5">{w.word}</h3>
                  <p className="text-slate-400 text-sm line-clamp-1">{w.definition}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => playAudio(w)}
                    className="p-2.5 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-xl transition-all"
                    title="Play Audio"
                  >
                    <Volume2 size={18} />
                  </button>
                  <button
                    onClick={() => deleteWord(w.id)}
                    className="p-2.5 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-xl transition-all"
                    title="Delete Word"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-slate-900 border-2 border-red-500/30 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="p-5 bg-red-500/20 rounded-full mb-6 text-red-400">
                <AlertTriangle size={48} />
              </div>
              <h3 className="text-3xl font-black text-white mb-3">Reset Library?</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">
                This will permanently delete all <span className="text-white font-bold">{words.length} words</span>, 
                clear your Flashcard progress, and reset Spelling stats. 
                <span className="block mt-2 font-black text-red-500/80 uppercase text-xs tracking-tighter">This action cannot be undone.</span>
              </p>
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={clearAll}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black shadow-lg shadow-red-600/20 transition-all"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
