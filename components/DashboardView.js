import { useState, useEffect } from 'react';
import { Upload, FileText, Brain, Volume2, BookOpen, Clock, Target } from 'lucide-react';
import { flashcardDb } from '../lib/flashcardStorage';

export default function DashboardView({ words, setView }) {
  const [fcStats, setFcStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      const stats = await flashcardDb.getStats(words);
      setFcStats(stats);
    };
    loadStats();
  }, [words]);

  const actionCards = [
    { id: 'parse', label: 'Parse New PDF', desc: 'Extract vocabulary', icon: Upload, color: 'bg-indigo-600 hover:bg-indigo-500' },
    { id: 'reader', label: 'PDF Reader', desc: 'Read interactively', icon: FileText, color: 'bg-pink-600 hover:bg-pink-500' },
    { id: 'flashcards', label: 'Flashcard Session', desc: 'Review due cards', icon: Brain, color: 'bg-emerald-600 hover:bg-emerald-500' },
    { id: 'spelling', label: 'Spelling Practice', desc: 'Master typing', icon: Volume2, color: 'bg-blue-600 hover:bg-blue-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-bold text-white mb-2">Welcome back!</h1>
        <p className="text-slate-400">Ready to expand your vocabulary today?</p>
      </header>

      {/* Primary Action Grid - 4 Equal Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {actionCards.map((card) => (
          <button
            key={card.id}
            onClick={() => setView(card.id)}
            className={`${card.color} p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center transition-all hover:scale-[1.02] shadow-xl aspect-square`}
          >
            <card.icon size={48} className="text-white mb-4" />
            <h3 className="text-xl font-bold text-white leading-tight">{card.label}</h3>
            <p className="text-white/70 text-sm mt-2">{card.desc}</p>
          </button>
        ))}
      </div>

      {/* Unified Stats Area */}
      <div className="bg-[#1e293b] border border-slate-700/50 rounded-[2.5rem] p-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Learning Progress</h2>
          <button 
            onClick={() => setView('browse')}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-full text-sm font-bold transition-all"
          >
            Detailed Stats
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-6 p-6 bg-slate-800/40 rounded-3xl">
            <div className="bg-indigo-500/20 p-4 rounded-2xl text-indigo-400">
              <BookOpen size={32} />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Total Vocabulary</p>
              <p className="text-3xl font-black text-white">{words.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 p-6 bg-slate-800/40 rounded-3xl">
            <div className="bg-emerald-500/20 p-4 rounded-2xl text-emerald-400">
              <Clock size={32} />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Flashcards Due</p>
              <p className="text-3xl font-black text-white">{fcStats?.dueToday || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 p-6 bg-slate-800/40 rounded-3xl">
            <div className="bg-blue-500/20 p-4 rounded-2xl text-blue-400">
              <Target size={32} />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Spelling Accuracy</p>
              <p className="text-3xl font-black text-white">92%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
