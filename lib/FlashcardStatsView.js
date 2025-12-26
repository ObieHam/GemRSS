import { useState, useMemo } from 'react';
import { Search, Brain, TrendingUp, Calendar, AlertCircle, ChevronRight } from 'lucide-react';

export default function FlashcardStatsView({ words, setView }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("mistakes");
  const [sortOrder, setSortOrder] = useState("desc");

  const flashcardReviews = JSON.parse(localStorage.getItem('flashcardReviews') || '[]');

  const filteredAndSorted = useMemo(() => {
    const list = words.map(w => {
      const review = flashcardReviews.find(r => r.wordId === w.id) || { lapses: 0, repetitions: 0 };
      return { ...w, ...review };
    }).filter(w => w.word.toLowerCase().includes(search.toLowerCase()));

    return list.sort((a, b) => {
      const valA = sortBy === 'mistakes' ? a.lapses : a.dateAdded;
      const valB = sortBy === 'mistakes' ? b.lapses : b.dateAdded;
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
  }, [words, search, sortBy, sortOrder]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <Brain className="text-emerald-400" /> Flashcard Statistics
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setSortBy('mistakes')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase ${sortBy === 'mistakes' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-slate-800 text-slate-500'}`}>By Mistakes</button>
          <button onClick={() => setSortBy('date')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase ${sortBy === 'date' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' : 'bg-slate-800 text-slate-500'}`}>By Date</button>
        </div>
      </div>

      <input 
        type="text" placeholder="Search performance..." 
        className="w-full bg-[#1e293b] border border-slate-700/50 p-4 rounded-2xl outline-none" 
        onChange={e => setSearch(e.target.value)}
      />

      <div className="grid gap-3">
        {filteredAndSorted.map(w => (
          <div key={w.id} className="bg-[#1e293b] p-4 rounded-2xl flex items-center justify-between border border-slate-700/30">
            <div>
              <h4 className="font-bold capitalize">{w.word}</h4>
              <p className="text-xs text-slate-500">Repetitions: {w.repetitions} | Stability: {Math.round(w.stability || 0)}d</p>
            </div>
            <div className="text-right">
              <span className={`text-sm font-black px-3 py-1 rounded-full ${w.lapses > 0 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-500'}`}>
                {w.lapses} Mistakes
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
