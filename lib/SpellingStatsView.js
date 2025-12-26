import { useState, useMemo } from 'react';
import { Search, Volume2, Target, Calendar } from 'lucide-react';

export default function SpellingStatsView({ words, setView }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("mistakes");
  const spellingReviews = JSON.parse(localStorage.getItem('spellingReviews') || '{}');

  const filteredAndSorted = useMemo(() => {
    const list = words.map(w => {
      const review = spellingReviews[w.id] || { lapses: 0, repetitions: 0 };
      return { ...w, ...review };
    }).filter(w => w.word.toLowerCase().includes(search.toLowerCase()));

    return list.sort((a, b) => {
      const valA = sortBy === 'mistakes' ? a.lapses : a.dateAdded;
      const valB = sortBy === 'mistakes' ? b.lapses : b.dateAdded;
      return valB - valA;
    });
  }, [words, search, sortBy]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-3xl font-black text-white flex items-center gap-3">
        <Volume2 className="text-blue-400" /> Spelling Statistics
      </h2>
      {/* Search and Sort controls similar to FlashcardStatsView */}
      <div className="grid gap-3">
        {filteredAndSorted.map(w => (
          <div key={w.id} className="bg-[#1e293b] p-4 rounded-2xl flex items-center justify-between border border-slate-700/30">
            <div>
              <h4 className="font-bold capitalize">{w.word}</h4>
              <p className="text-xs text-slate-500">Accuracy: {w.repetitions > 0 ? Math.round(((w.repetitions - w.lapses)/w.repetitions)*100) : 0}%</p>
            </div>
            <span className={`text-sm font-black px-3 py-1 rounded-full ${w.lapses > 0 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-500'}`}>
              {w.lapses} Mistakes
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
