import { useState } from 'react';
import { Search, Trash2, Volume2, AlertTriangle, BookOpen } from 'lucide-react';
import { db } from '../lib/storage';

export default function BrowseView({ words, loadWords, settings }) {
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

        {/* Library Stats */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen size={20} className="text-indigo-400" />
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Words</p>
            </div>
            <p className="text-4xl font-black text-white">{words.length}</p>
          </div>
          
          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen size={20} className="text-purple-400" />
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Added Today</p>
            </div>
            <p className="text-4xl font-black text-white">
              {words.filter(w => {
                const today = new Date().setHours(0, 0, 0, 0);
                const wordDate = new Date(w.dateAdded).setHours(0, 0, 0, 0);
                return wordDate === today;
              }).length}
            </p>
          </div>

          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen size={20} className="text-pink-400" />
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">This Week</p>
            </div>
            <p className="text-4xl font-black text-white">
              {words.filter(w => {
                const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                return w.dateAdded >= weekAgo;
              }).length}
            </p>
          </div>
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
          <div className="bg-slate-900 border-2 border-red-500/30 rounded-3xl p-8 max-w-md w-full">
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
