import { useState, useEffect, useRef } from 'react';
import { Volume2, ChevronRight, Brain, RotateCcw, CheckCircle, Flame, TrendingUp } from 'lucide-react';
import { db } from '../lib/storage';
import { FSRS } from '../lib/fsrs';

export default function FlashcardView({ words, settings }) {
  const [session, setSession] = useState({ active: false, currentIndex: 0, list: [], showBack: false });
  const [stats, setStats] = useState({ due: 0, new: 0, learning: 0 });

  useEffect(() => { loadStats(); }, [words]);

  const loadStats = async () => {
    const reviews = JSON.parse(localStorage.getItem('flashcardReviews') || '[]');
    const now = Date.now();
    let dueCount = 0, newCount = 0, learningCount = 0;

    words.forEach(w => {
      const review = reviews.find(r => r.wordId === w.id);
      if (!review) newCount++;
      else if (review.nextReview <= now) dueCount++;
      else learningCount++;
    });
    setStats({ due: dueCount, new: newCount, learning: learningCount });
  };

  const startSession = async () => {
    const reviews = JSON.parse(localStorage.getItem('flashcardReviews') || '[]');
    const now = Date.now();
    
    const dueList = words
      .map(w => ({ ...w, card: reviews.find(r => r.wordId === w.id) || FSRS.initCard() }))
      .filter(w => !w.card.lastReview || w.card.nextReview <= now)
      .sort((a, b) => a.card.nextReview - b.card.nextReview);

    if (dueList.length === 0) return alert("All cards are up to date!");
    setSession({ active: true, currentIndex: 0, list: dueList, showBack: false });
  };

  const handleAnswer = async (quality) => {
    const current = session.list[session.currentIndex];
    const updatedCard = FSRS.step(current.card, quality);
    
    const reviews = JSON.parse(localStorage.getItem('flashcardReviews') || '[]');
    const existingIdx = reviews.findIndex(r => r.wordId === current.id);
    const reviewData = { wordId: current.id, ...updatedCard };

    if (existingIdx > -1) reviews[existingIdx] = reviewData;
    else reviews.push(reviewData);

    localStorage.setItem('flashcardReviews', JSON.stringify(reviews));

    if (session.currentIndex + 1 < session.list.length) {
      setSession(s => ({ ...s, currentIndex: s.currentIndex + 1, showBack: false }));
    } else {
      setSession({ active: false, currentIndex: 0, list: [], showBack: false });
      loadStats();
    }
  };

  if (!session.active) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-3xl shadow-lg"><Brain size={32} className="text-white" /></div>
          <h2 className="text-4xl font-black text-white tracking-tight">Flashcards</h2>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-end">
          <div className="flex-1 bg-[#1e293b] border border-slate-700/50 rounded-3xl p-12 text-center shadow-2xl flex flex-col justify-center min-h-[400px]">
            <h3 className="text-5xl font-black text-white mb-6 tracking-tighter">{stats.due + stats.new} Cards Due Now</h3>
            <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto">Master your vocabulary through spaced repetition (FSRS).</p>
            <button onClick={startSession} className="bg-indigo-600 hover:bg-indigo-500 px-12 py-5 rounded-2xl font-black text-xl text-white transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3 w-fit mx-auto">
              <TrendingUp size={24} /> Start Session
            </button>
          </div>

          <div className="w-full lg:w-72 space-y-4">
            {[
              { label: 'Due Cards', value: stats.due, color: 'text-indigo-400' },
              { label: 'New Words', value: stats.new, color: 'text-emerald-400' },
              { label: 'Learning', value: stats.learning, color: 'text-orange-400' }
            ].map(s => (
              <div key={s.label} className="bg-[#1e293b] border border-slate-700/50 p-6 rounded-3xl shadow-lg">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{s.label}</p>
                <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const current = session.list[session.currentIndex];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300 h-full flex flex-col">
       <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/50 p-4 rounded-2xl border border-slate-700/30">
          <span>Card {session.currentIndex + 1} of {session.list.length}</span>
          <div className="flex gap-4">
             <span className="text-indigo-400">Next Review: {new Date(current.card.nextReview).toLocaleDateString()}</span>
          </div>
       </div>

       <div className="flex flex-col lg:flex-row gap-8 items-end flex-1">
         <div 
           onClick={() => !session.showBack && setSession(s => ({ ...s, showBack: true }))}
           className={`flex-1 w-full bg-[#1e293b] border-2 border-slate-700/50 rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-500 cursor-pointer min-h-[450px] ${!session.showBack ? 'hover:border-indigo-500/50' : ''}`}
         >
            <h3 className="text-3xl font-medium text-slate-200 mb-8 leading-relaxed max-w-2xl italic">
              "{current.definition}"
            </h3>
            
            {session.showBack ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-3xl">
                 <div className="h-px bg-slate-800 w-full mb-8" />
                 <p className="text-6xl font-black text-white capitalize tracking-tighter mb-6">{current.word}</p>
                 {current.example && (
                   <p className="text-slate-500 italic text-lg bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                      "{current.example}"
                   </p>
                 )}
              </div>
            ) : (
              <p className="text-slate-500 font-bold uppercase tracking-widest animate-pulse">Click card to reveal word</p>
            )}
         </div>

         <div className="w-full lg:w-72 space-y-4">
            {[
              { label: 'Session Progress', value: `${session.currentIndex + 1}/${session.list.length}`, color: 'text-emerald-400' },
              { label: 'Card Stability', value: `${Math.round(current.card.stability || 0)}d`, color: 'text-indigo-400' }
            ].map(s => (
              <div key={s.label} className="bg-[#1e293b] border border-slate-700/50 p-6 rounded-3xl shadow-lg">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{s.label}</p>
                <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
         </div>
       </div>

       {session.showBack ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full animate-in slide-in-from-bottom-4">
             {[
               { q: 0, l: 'Again', c: 'bg-red-500/10 text-red-400 border border-red-500/20', i: '<1m' },
               { q: 1, l: 'Hard', c: 'bg-orange-500/10 text-orange-400 border border-orange-500/20', i: '2d' },
               { q: 2, l: 'Good', c: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', i: '4d' },
               { q: 3, l: 'Easy', c: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20', i: '7d' },
             ].map((btn) => (
               <button
                 key={btn.l}
                 onClick={() => handleAnswer(btn.q)}
                 className={`${btn.c} p-6 rounded-2xl transition-all hover:scale-105 flex flex-col items-center justify-center gap-1 active:scale-95 hover:bg-opacity-20`}
               >
                 <span className="font-black text-xl uppercase tracking-wider">{btn.l}</span>
                 <span className="text-xs font-bold opacity-60">{btn.i}</span>
               </button>
             ))}
          </div>
       ) : (
         <button onClick={() => setSession(s => ({ ...s, showBack: true }))} className="w-full py-6 bg-indigo-600 rounded-3xl font-black text-white text-xl shadow-xl hover:bg-indigo-500 transition-all">Reveal Word</button>
       )}
    </div>
  );
}
