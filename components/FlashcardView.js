import { useState, useEffect, useRef } from 'react';
import { Brain, RotateCcw, Volume2, CheckCircle, Clock, BookOpen, TrendingUp, SkipForward } from 'lucide-react';
import { flashcardDb } from '../lib/flashcardStorage';

export default function FlashcardView({ words, settings }) {
  const [mode, setMode] = useState('menu');
  const [dueCards, setDueCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState(null); // 'correct', 'incorrect'
  const [stats, setStats] = useState(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const inputRef = useRef(null);

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
    setUserInput("");
    setFeedback(null);
    setSessionComplete(false);
    setMode('session');
  };

  const handleAnswer = async (quality) => {
    const currentCard = dueCards[currentCardIndex];
    const updatedReview = flashcardDb.calculateNextReview(currentCard.review, quality);
    await flashcardDb.save(updatedReview);
    
    if (currentCardIndex + 1 < dueCards.length) {
      setCurrentCardIndex(currentCardIndex + 1);
      setUserInput("");
      setFeedback(null);
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

  const renderComparison = () => {
    const correct = dueCards[currentCardIndex].word.word.toLowerCase();
    const user = userInput.toLowerCase();
    const maxLen = Math.max(correct.length, user.length);
    
    return (
      <div className="flex gap-1 justify-center font-mono text-xl mt-4">
        {Array.from({ length: maxLen }).map((_, i) => (
          <span key={i} className={`px-1 border-b-2 ${user[i] === correct[i] ? 'text-emerald-400 border-emerald-500/30' : 'text-red-400 border-red-500'}`}>
            {user[i] || '_'}
          </span>
        ))}
      </div>
    );
  };

  const checkSpelling = () => {
    const isCorrect = userInput.toLowerCase().trim() === dueCards[currentCardIndex].word.word.toLowerCase();
    setFeedback(isCorrect ? 'correct' : 'incorrect');
  };

  if (mode === 'menu') {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-lg"><Brain size={24} className="text-white" /></div>
            <h2 className="text-3xl font-black text-white">Flashcards</h2>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-slate-900 border border-slate-700/50 p-4 rounded-xl">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">New</p>
              <p className="text-2xl font-black text-white">{stats.newCards}</p>
            </div>
            <div className="bg-slate-900 border border-slate-700/50 p-4 rounded-xl">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Due</p>
              <p className="text-2xl font-black text-indigo-400">{stats.dueToday}</p>
            </div>
            <div className="bg-slate-900 border border-slate-700/50 p-4 rounded-xl md:col-span-2">
              <button onClick={startSession} className="w-full h-full bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2">
                <TrendingUp size={16} /> Start Review
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-8">
          <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
          <button onClick={() => setMode('menu')} className="bg-indigo-500 px-6 py-2 rounded-lg font-bold">Finish</button>
        </div>
      </div>
    );
  }

  const currentCard = dueCards[currentCardIndex];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 relative">
        <div className="text-center mb-6">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block mb-2">Definition</span>
          <p className="text-lg text-slate-200 leading-snug">{currentCard.word.definition}</p>
        </div>

        <div className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkSpelling()}
            placeholder="Type word to check..."
            className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-center font-bold text-white focus:border-indigo-500 outline-none"
          />

          {feedback === 'incorrect' && renderComparison()}

          <div className="grid grid-cols-4 gap-2">
            {[
              { q: 0, l: 'Again', c: 'bg-red-500/10 text-red-400 border-red-500/20', i: '<1m' },
              { q: 1, l: 'Hard', c: 'bg-orange-500/10 text-orange-400 border-orange-500/20', i: '1d' },
              { q: 2, l: 'Good', c: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', i: '4d' },
              { q: 3, l: 'Easy', c: 'bg-blue-500/10 text-blue-400 border-blue-500/20', i: '7d' },
            ].map((opt) => (
              <button
                key={opt.l}
                onClick={() => handleAnswer(opt.q)}
                className={`flex flex-col items-center py-2 rounded-lg border hover:scale-105 transition-all ${opt.c}`}
              >
                <span className="text-[10px] font-black uppercase">{opt.l}</span>
                <span className="text-[9px] opacity-60 font-mono">{opt.i}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 border-t border-slate-800/50 pt-4 mt-4">
            <button onClick={() => playAudio(currentCard.word)} className="flex-1 bg-slate-800 p-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
              <Volume2 size={14} /> Listen
            </button>
            <button onClick={() => handleAnswer(2)} className="flex-1 bg-slate-800 p-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
              <SkipForward size={14} /> Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
