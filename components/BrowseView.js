import { useState, useEffect, useMemo } from 'react';
import { Search, Trash2, Volume2, Calendar, AlertCircle, SortAsc, SortDesc, Brain } from 'lucide-react';
import { db } from '../lib/storage';

export default function BrowseView({ words, loadWords, settings, setView }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("mistakes"); // mistakes, date
  const [sortOrder, setSortOrder] = useState("desc");
  const [allStats, setAllStats] = useState({});

  useEffect(() => {
    const fetchAllPerformance = async () => {
      const spData = JSON.parse(localStorage.getItem('spellingReviews') || '{}');
      const fcData = JSON.parse(localStorage.getItem('flashcardReviews') || '[]');
      
      const combined = {};
      words.forEach(w => {
        const sp = spData[w.id] || { lapses: 0, repetitions: 0 };
        const fc = fcData.find(r => r.wordId === w.id) || { lapses: 0, repetitions: 0 };
        combined[w.id] = {
          totalMistakes: (sp.lapses || 0) + (fc.lapses || 0),
          spellingMistakes: sp.lapses || 0,
          flashcardMistakes: fc.lapses || 0,
          spellingAccuracy: sp.repetitions > 0 ? Math.round(((sp.repetitions - sp.lapses)/sp.repetitions)*100) : 0
        };
      });
      setAllStats(combined);
    };
    fetchAllPerformance();
  }, [words]);

  const filteredAndSorted = useMemo(() => {
    let result = words.filter(w => 
      w.word.toLowerCase().includes(search.toLowerCase()) || 
      w.definition.toLowerCase().includes(search.toLowerCase())
    );

    result.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'mistakes') {
        valA = allStats[a.id]?.totalMistakes || 0;
        valB = allStats[b.id]?.totalMistakes || 0;
      } else {
        valA = a.dateAdded || 0;
        valB = b.dateAdded || 0;
      }
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return result;
  }, [words, search, sortBy, sortOrder, allStats]);

  const toggleSort = (type) => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(type);
      setSortOrder('desc');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black text-white">Words and Stats</h2>
        <div className="flex gap-4">
            <button 
                onClick={() => toggleSort('mistakes')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${sortBy === 'mistakes' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
            >
                <AlertCircle size={14} /> Sort by Mistakes {sortBy === 'mistakes' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button 
                onClick={() => toggleSort('date')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${sortBy === 'date' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
            >
                <Calendar size={14} /> Sort by Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
        <input
          type="text"
          placeholder="Search your vocabulary..."
          className="w-full bg-[#1e293b] border border-slate-700/50 pl-14 pr-6 py-4 rounded-2xl outline-none focus:border-indigo-500 transition-all text-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAndSorted.map((w) => {
          const stats = allStats[w.id];
          return (
            <div key={w.id} className="bg-[#1e293b] border border-slate-700/50 p-6 rounded-3xl flex items-center gap-6 hover:border-slate-500 transition-all group">
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-black text-white capitalize">{w.word}</h3>
                  {stats?.totalMistakes > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {stats.totalMistakes} MISTAKES
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm line-clamp-1">{w.definition}</p>
              </div>

              {/* Performance Meters */}
              <div className="hidden md:flex items-center gap-8 text-right">
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Spelling</p>
                    <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${stats?.spellingAccuracy || 0}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-white">{stats?.spellingAccuracy || 0}%</span>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Flashcards</p>
                    <p className="text-xs font-bold text-white flex items-center gap-1 justify-end">
                        <Brain size={12} className="text-emerald-400" />
                        {stats?.flashcardMistakes || 0} lapses
                    </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setView('spelling')} className="p-3 bg-slate-800 hover:bg-blue-600 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                    <Volume2 size={18} />
                </button>
                <button onClick={async () => { await db.vocabulary.delete(w.id); loadWords(); }} className="p-3 bg-slate-800 hover:bg-red-600 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
