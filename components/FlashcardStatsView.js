import { useState, useMemo } from 'react';
import { Search, Brain, ChevronRight } from 'lucide-react';

export default function FlashcardStatsView({ words, setView }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("due"); // Default to due date
  const [sortOrder, setSortOrder] = useState("asc");

  const flashcardReviews = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('flashcardReviews') || '[]') : [];

  const filteredAndSorted = useMemo(() => {
    const list = words.map(w => {
      const review = flashcardReviews.find(r => r.wordId === w.id) || { lapses: 0, repetitions: 0, nextReview: Date.now() };
      return { ...w, ...review };
    }).filter(w => w.word.toLowerCase().includes(search.toLowerCase()));

    return list.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'due') { valA = a.nextReview; valB = b.nextReview; }
      else if (sortBy === 'mistakes') { valA = a.lapses; valB = b.lapses; }
      else { valA = a.dateAdded; valB = b.dateAdded; }
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
  }, [words, search, sortBy, sortOrder, flashcardReviews]);

  const toggleSort = (type) => {
    if (sortBy === type) setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    else { setSortBy(type); setSortOrder(type === 'due' ? 'asc' : 'desc'); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-white flex items-center gap-3"><Brain className="text-emerald-400" size={32} /> Flashcard Stats</h2>
        <div className="flex gap-2">
          {['due', 'mistakes', 'date'].map(type => (
            <button key={type} onClick={() => toggleSort(type)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${sortBy === type ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
              {type} {sortBy === type && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          ))}
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input type="text" placeholder="Search performance..." className="w-full bg-[#1e293b] border border-slate-700/50 pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:border-emerald-500 text-white" onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="grid gap-3">
        {filteredAndSorted.map(w => (
          <div key={w.id} className="bg-[#1e293b] p-5 rounded-2xl flex items-center justify-between border border-slate-700/30 group">
            <div className="flex-grow">
              <h4 className="text-xl font-bold text-white capitalize mb-1">{w.word}</h4>
              <div className="flex gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span>Reps: {w.repetitions || 0}</span>
                <span>Due: {new Date(w.nextReview).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="text-right flex items-center gap-6">
              <div><p className="text-[10px] font-black text-slate-500 uppercase mb-1">Lapses</p><span className={`text-sm font-black px-4 py-1.5 rounded-full ${w.lapses > 0 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-500'}`}>{w.lapses || 0}</span></div>
              <button onClick={() => setView('flashcards')} className="p-2 bg-slate-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
