import { useState, useEffect } from 'react';
import { Brain, Volume2, CheckCircle, TrendingUp } from 'lucide-react';
import { flashcardDb } from '../lib/flashcardStorage';

export default function FlashcardView({ words, settings }) {
  const [mode, setMode] = useState('menu');
  const [dueCards, setDueCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [stats, setStats] = useState(null);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => { loadStats(); }, [words]);

  const loadStats = async () => {
    const statistics = await flashcardDb.getStats(words);
    setStats(statistics);
  };

  const startSession = async () => {
    const due = await flashcardDb.getDueCards(words);
    if (due.length === 0) return alert('No cards due for review!');
    setDueCards(due);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setSessionComplete(false);
    setMode('session');
  };

  const handleAnswer = async (quality) => {
    const currentCard = dueCards[currentCardIndex];
    const updatedReview = flashcardDb.calculateNextReview(currentCard.review, quality);
    await flashcardDb.save(updatedReview);
    
    if (currentCardIndex + 1 < dueCards.length) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      setSessionComplete(true);
      await loadStats();
    }
  };

  const playAudio = (word) => {
    if (settings.apiSource === 'free-dictionary' && word.phonetics) {
      const accentMap = { us: '-us', uk: '-uk', au: '-au' };
      const preferredAudio = word.phonetics.find(p => p.audio && p.audio.includes(accentMap[settings.accent]));
      const audioUrl = preferredAudio?.audio || word.phonetics.find(p => p.audio)?.audio;
      if (audioUrl) new Audio(audioUrl).play().catch(e => console.error(e));
    } else if (word.audioUrl) {
      new Audio(word.audioUrl).play().catch(e => console.error(e));
    }
  };

  // ----------------------------------------------------------------------
  // MENU VIEW
  // ----------------------------------------------------------------------
  if (mode === 'menu') {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
              <Brain size={32} className="text-white" />
            </div>
            <h2 className="text-5xl font-black text-white">Flashcards</h2>
          </div>
        </header>

        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Call to Action Card */}
            <div className="lg:col-span-2 bg-[#1e293b] border border-slate-700/50 rounded-[2.5rem] p-10 flex flex-col justify-center text-center shadow-2xl">
              <h3 className="text-3xl font-bold text-white mb-4">
                {stats.dueToday > 0 ? `${stats.dueToday} Cards Due Now` : "All Caught Up!"}
              </h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Master your vocabulary through spaced repetition (FSRS). We prioritize words you're about to forget.
              </p>
              <button
                onClick={startSession}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 rounded-3xl font-bold text-xl text-white transition-all shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-3"
              >
                <TrendingUp size={24} />
                Start Session
              </button>
            </div>

            {/* Quick Stats Column */}
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-700/50 p-6 rounded-3xl flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Due Cards</p>
                  <p className="text-3xl font-black text-emerald-400">{stats.dueToday}</p>
                </div>
                <div className="h-10 w-1 bg-emerald-500/20 rounded-full"></div>
              </div>
              <div className="bg-slate-900 border border-slate-700/50 p-6 rounded-3xl flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">New Words</p>
                  <p className="text-3xl font-black text-blue-400">{stats.newCards}</p>
                </div>
                <div className="h-10 w-1 bg-blue-500/20 rounded-full"></div>
              </div>
              <div className="bg-slate-900 border border-slate-700/50 p-6 rounded-3xl flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Learning</p>
                  <p className="text-3xl font-black text-orange-400">{stats.learning}</p>
                </div>
                <div className="h-10 w-1 bg-orange-500/20 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // SESSION COMPLETE VIEW
  // ----------------------------------------------------------------------
  if (sessionComplete) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95 duration-300">
        <div className="bg-emerald-500 p-6 rounded-full mb-8 shadow-2xl shadow-emerald-500/20">
          <CheckCircle size={64} className="text-white" />
        </div>
        <h2 className="text-4xl font-black text-white mb-4">Session Complete!</h2>
        <p className="text-slate-400 mb-8 text-lg">You've successfully reviewed all due cards.</p>
        <button 
          onClick={() => setMode('menu')} 
          className="bg-indigo-600 hover:bg-indigo-500 px-10 py-4 rounded-2xl font-bold text-white transition-all shadow-lg shadow-indigo-500/20"
        >
          Return to Menu
        </button>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // ACTIVE SESSION VIEW
  // ----------------------------------------------------------------------
  const currentCard = dueCards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / dueCards.length) * 100;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Progress Bar */}
      <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-700/30 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Card {currentCardIndex + 1} of {dueCards.length}
            </span>
            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
              {Math.round(progress)}%
            </span>
        </div>
        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
        </div>
      </div>

      {/* Main Flashcard Area */}
      <div className="bg-[#1e293b] border border-slate-700/50 rounded-[3rem] p-16 min-h-[500px] flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden transition-all">
        {!showAnswer ? (
          // FRONT SIDE (Definition)
          <div className="space-y-10 animate-in zoom-in-95 duration-300 w-full max-w-3xl">
            <div>
                <span className="text-indigo-400 font-black text-xs uppercase tracking-[0.2em] block mb-6">
                  Definition
                </span>
                <p className="text-3xl md:text-4xl font-bold text-white leading-relaxed">
                  {currentCard.word.definition}
                </p>
            </div>
            <button
              onClick={() => setShowAnswer(true)}
              className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 rounded-3xl font-black text-xl text-white shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
            >
              Reveal Answer
            </button>
          </div>
        ) : (
          // BACK SIDE (Word + Options)
          <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="space-y-4">
                <span className="text-emerald-400 font-black text-xs uppercase tracking-[0.2em] block">
                  The Word
                </span>
                <h3 className="text-6xl md:text-7xl font-black text-white capitalize tracking-tight">
                  {currentCard.word.word}
                </h3>
                <button 
                  onClick={() => playAudio(currentCard.word)} 
                  className="p-4 bg-slate-800 hover:bg-blue-600 rounded-full mt-4 transition-all group inline-flex"
                  title="Play Pronunciation"
                >
                    <Volume2 size={32} className="text-white group-hover:scale-110 transition-transform" />
                </button>
            </div>

            {/* Glowing Anki Buttons */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl mx-auto">
                {[
                  { q: 0, l: 'Again', c: 'bg-red-500/10 text-red-400 border border-red-500/20', i: '<1m' },
                  { q: 1, l: 'Hard', c: 'bg-orange-500/10 text-orange-400 border border-orange-500/20', i: '2d' },
                  { q: 2, l: 'Good', c: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', i: '4d' },
                  { q: 3, l: 'Easy', c: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20', i: '7d' },
                ].map((btn) => (
                  <button
                    key={btn.l}
                    onClick={() => handleAnswer(btn.q)}
                    className={`${btn.c} p-5 rounded-2xl transition-all hover:scale-105 flex flex-col items-center justify-center gap-1 active:scale-95 hover:bg-opacity-20`}
                  >
                    <span className="block font-black text-lg">{btn.l}</span>
                    <span className="text-xs font-bold opacity-80">{btn.i}</span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
