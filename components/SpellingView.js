import { useState, useEffect, useRef } from 'react';
import { Volume2, CheckCircle, SkipForward, ChevronRight, Loader2, TrendingUp, BarChart3 } from 'lucide-react';
import { spellingDb } from '../lib/spellingStorage';

export default function SpellingView({ words, settings }) {
  const [mode, setMode] = useState('menu'); 
  const [session, setSession] = useState({ currentIndex: 0, list: [], correct: 0, incorrect: 0 });
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { loadStats(); }, [words]);

  const loadStats = async () => {
    const s = await spellingDb.getStats(words);
    setStats(s);
  };

  const startSession = async () => {
    const due = await spellingDb.getDueCards(words);
    if (due.length === 0) return alert("You're all caught up on spelling!");
    setSession({ currentIndex: 0, list: due, correct: 0, incorrect: 0 });
    setMode('session');
    setFeedback(null);
    setUserInput("");
  };

  const currentItem = session.list[session.currentIndex];
  const currentWord = currentItem?.word?.word || "";

  useEffect(() => {
    if (mode === 'session' && currentWord) {
      playWord(currentWord);
      // Small delay to ensure input is ready for focus
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [session.currentIndex, mode]);

  const playWord = async (word) => {
    setLoadingAudio(true);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
    setLoadingAudio(false);
  };

  const checkAnswer = () => {
    if (!userInput.trim()) return;
    const isCorrect = userInput.toLowerCase().trim() === currentWord.toLowerCase();
    const wordId = currentItem.word.id;

    if (isCorrect) {
      setFeedback('correct');
      spellingDb.recordResult(wordId, 3); 
      setSession(s => ({ ...s, correct: s.correct + 1 }));
      // Transition cut by half to 500ms as requested
      setTimeout(nextWord, 500); 
    } else {
      setFeedback('incorrect');
      spellingDb.recordResult(wordId, 0); 
      setSession(s => ({ ...s, incorrect: s.incorrect + 1 }));
    }
  };

  const nextWord = () => {
    if (session.currentIndex + 1 < session.list.length) {
      setSession(s => ({ ...s, currentIndex: s.currentIndex + 1 }));
      setFeedback(null);
      setUserInput("");
    } else {
      setMode('menu');
      loadStats();
    }
  };

  if (mode === 'menu') {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header className="flex items-center gap-4">
          <div className="bg-blue-500 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
            <Volume2 size={32} className="text-white" />
          </div>
          <h2 className="text-5xl font-black text-white">Spelling Practice</h2>
        </header>

        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#1e293b] border border-slate-700/50 rounded-[2.5rem] p-10 flex flex-col justify-center text-center shadow-2xl">
              <h3 className="text-3xl font-bold text-white mb-4">
                {stats.dueToday > 0 ? `${stats.dueToday} Words Due Now` : "All Caught Up!"}
              </h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Master your vocabulary through audio dictation. We prioritize words you find difficult.
              </p>
              <button
                onClick={startSession}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-3xl font-bold text-xl text-white transition-all shadow-xl shadow-blue-500/10 flex items-center justify-center gap-3"
              >
                <TrendingUp size={24} />
                Start Session
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-700/50 p-6 rounded-3xl flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Due Cards</p>
                  <p className="text-3xl font-black text-blue-400">{stats.dueToday}</p>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-700/50 p-6 rounded-3xl flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">New Words</p>
                  <p className="text-3xl font-black text-emerald-400">{stats.newWords}</p>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-700/50 p-6 rounded-3xl flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Learning</p>
                  <p className="text-3xl font-black text-orange-400">{stats.learning}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/30 flex justify-between items-center font-black uppercase text-[10px] tracking-widest">
        <span className="text-slate-500">Word {session.currentIndex + 1} / {session.list.length}</span>
        <div className="flex gap-6">
            <span className="text-emerald-400">Correct: {session.correct}</span>
            <span className="text-red-400">Incorrect: {session.incorrect}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 bg-[#1e293b] border border-slate-700/50 rounded-[2.5rem] p-12 text-center shadow-2xl w-full">
            <button 
              onClick={() => playWord(currentWord)} 
              disabled={loadingAudio}
              className="mb-10 p-6 bg-slate-800 hover:bg-blue-600 rounded-3xl transition-all group"
            >
              {loadingAudio ? (
                <Loader2 size={48} className="animate-spin text-white" />
              ) : (
                <Volume2 size={48} className="text-white group-hover:scale-105" />
              )}
            </button>

            <input
                ref={inputRef}
                type="text"
                autoFocus
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (feedback === 'incorrect' ? nextWord() : checkAnswer())}
                placeholder="Type what you hear..."
                disabled={feedback === 'correct'}
                className="w-full bg-slate-950 border border-slate-800 p-6 rounded-3xl text-3xl text-center font-black text-white outline-none focus:border-blue-500 mb-8 transition-all"
            />

            <div className="w-full">
                {feedback === 'incorrect' ? (
                    <button 
                        onClick={nextWord} 
                        className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 rounded-3xl font-black text-white text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/20"
                    >
                        Next Word <ChevronRight size={24} />
                    </button>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={nextWord} className="bg-slate-800 py-5 rounded-3xl font-black text-white text-base flex items-center justify-center gap-3 hover:bg-slate-700 transition-colors">
                            <SkipForward size={20} /> Skip
                        </button>
                        <button onClick={checkAnswer} className="bg-blue-600 py-5 rounded-3xl font-black text-white text-base hover:bg-blue-500 transition-colors shadow-xl shadow-blue-500/20">
                            Check Answer
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Feedback sidebar logic remains intact */}
        {(feedback === 'incorrect' || feedback === 'correct') && (
            <div className="w-full lg:w-80 min-h-[300px]">
                <div className="bg-slate-900 border border-slate-700 rounded-[2rem] p-8 animate-in slide-in-from-right-4 duration-500">
                    <span className={`text-xs font-black uppercase tracking-[0.2em] mb-4 block ${feedback === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {feedback === 'correct' ? 'Correct!' : 'Incorrect'}
                    </span>
                    {feedback === 'incorrect' && (
                        <div className="space-y-4">
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Correct Spelling:</p>
                            <p className="text-2xl font-black text-white capitalize">{currentWord}</p>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
