import { useState, useEffect } from 'react';
import { Search, Trash2, Volume2, AlertTriangle, BookOpen, Brain, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { db } from '../lib/storage';
import { flashcardDb } from '../lib/flashcardStorage';
import { spellingDb } from '../lib/spellingStorage';

export default function BrowseView({ words, loadWords, settings, setView }) {
  const [search, setSearch] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [fcStats, setFcStats] = useState(null);
  const [spStats, setSpStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const flashStats = await flashcardDb.getStats(words);
      const spellStats = await spellingDb.getStats(words);
      setFcStats(flashStats);
      setSpStats(spellStats);
    };
    fetchStats();
  }, [words]);

  const playAudio = (wordObj) => {
    if (settings.apiSource === 'free-dictionary') {
      const accentMap = { us: '-us', uk: '-uk', au: '-au' };
      const preferredAudio = wordObj.phonetics?.find(p => 
        p.audio && p.audio.includes(accentMap[settings.accent])
      );
      const audioUrl = preferredAudio?.audio || wordObj.phonetics?.find(p => p.audio)?.audio;
      if (audioUrl) new Audio(audioUrl).play().catch(e => console.error(e));
    } else if (wordObj.audioUrl) {
      new Audio(wordObj.audioUrl).play().catch(e => console.error(e));
    }
  };

  const deleteWord = async (id) => {
    await db.vocabulary.delete(id);
    await loadWords();
  };

  const filtered = words.filter(w => w.word && w.word.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-12 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-5xl font-black text-white">Words and Stats</h2>
        <button onClick={() => setShowClearConfirm(true)} className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/30 text-red-400 rounded-2xl font-bold transition-all">
          Clear Library
        </button>
      </div>

      {/* FLASHCARD STATS (ANKI STYLE) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
            <Brain size={20} /> Flashcard Performance
          </h3>
          <button onClick={() => setView('flashcards')} className="text-indigo-400 font-bold hover:underline">
            Go to Flashcards →
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 border-2 border-blue-500/20 p-4 rounded-2xl">
            <p className="text-slate-400 text-xs font-bold uppercase">New</p>
            <p className="text-2xl font-black text-white">{fcStats?.newCards || 0}</p>
          </div>
          <div className="bg-slate-900/50 border-2 border-orange-500/20 p-4 rounded-2xl">
            <p className="text-slate-400 text-xs font-bold uppercase">Learning</p>
            <p className="text-2xl font-black text-white">{fcStats?.learning || 0}</p>
          </div>
          <div className="bg-slate-900/50 border-2 border-emerald-500/20 p-4 rounded-2xl">
            <p className="text-slate-400 text-xs font-bold uppercase">Review</p>
            <p className="text-2xl font-black text-white">{fcStats?.review || 0}</p>
          </div>
          <div className="bg-slate-900/50 border-2 border-purple-500/20 p-4 rounded-2xl">
            <p className="text-slate-400 text-xs font-bold uppercase">Due Today</p>
            <p className="text-2xl font-black text-white text-purple-400">{fcStats?.dueToday || 0}</p>
          </div>
        </div>
      </div>

      {/* SPELLING STATS */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-blue-400 flex items-center gap-2">
            <Volume2 size={20} /> Spelling Proficiency
          </h3>
          <button onClick={() => setView('spelling')} className="text-indigo-400 font-bold hover:underline">
            Go to Spelling →
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 border-2 border-slate-700 p-4 rounded-2xl">
            <p className="text-slate-400 text-xs font-bold uppercase">Attempts</p>
            <p className="text-2xl font-black text-white">{spStats?.totalAttempts || 0}</p>
          </div>
          <div className="bg-slate-900/50 border-2 border-slate-700 p-4 rounded-2xl">
            <p className="text-slate-400 text-xs font-bold uppercase">Accuracy</p>
            <p className="text-2xl font-black text-white">{spStats?.accuracy || 0}%</p>
          </div>
          <div className="bg-slate-900/50 border-2 border-red-500/20 p-4 rounded-2xl">
            <p className="text-slate-400 text-xs font-bold uppercase">Misspelled Words</p>
            <p className="text-2xl font-black text-red-400">{spStats?.misspelledCount || 0}</p>
          </div>
        </div>
      </div>

      {/* WORD LIST */}
      <div className="relative mb-8">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
        <input
          type="text"
          placeholder="Search words..."
          className="w-full bg-slate-900 border-2 border-slate-700 focus:border-indigo-500 pl-16 pr-6 py-4 rounded-2xl outline-none transition-all text-lg text-white"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No words found</div>
        ) : (
          <div className="divide-y-2 divide-slate-800">
            {filtered.map((w) => (
              <div key={w.id} className="p-6 hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                <div className="flex-grow">
                  <h3 className="text-2xl font-bold text-white capitalize mb-1">{w.word}</h3>
                  <p className="text-slate-400 text-sm line-clamp-2">{w.definition}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => playAudio(w)} className="p-3 bg-slate-800 hover:bg-indigo-500 rounded-xl transition-colors">
                    <Volume2 size={20} />
                  </button>
                  <button onClick={() => deleteWord(w.id)} className="p-3 bg-slate-800 hover:bg-red-500 rounded-xl transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
