import { useState, useEffect, useRef } from 'react';
import { Volume2, CheckCircle, XCircle, SkipForward, Play } from 'lucide-react';

export default function SpellingView({ words, settings }) {
  const [session, setSession] = useState({ active: false, currentIndex: 0, list: [], correct: 0, incorrect: 0 });
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState(null); // 'correct', 'incorrect'
  const inputRef = useRef(null);

  const startPractice = () => {
    if (words.length === 0) return alert("Add words to your library first!");
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setSession({ active: true, currentIndex: 0, list: shuffled, correct: 0, incorrect: 0 });
    setFeedback(null);
    setUserInput("");
  };

  const currentWord = session.list[session.currentIndex]?.word || "";

  const playWord = () => {
    const utterance = new SpeechSynthesisUtterance(currentWord);
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const checkAnswer = () => {
    if (userInput.toLowerCase().trim() === currentWord.toLowerCase()) {
      setFeedback('correct');
      setSession(s => ({ ...s, correct: s.correct + 1 }));
      setTimeout(nextWord, 1200);
    } else {
      setFeedback('incorrect');
      setSession(s => ({ ...s, incorrect: s.incorrect + 1 }));
    }
  };

  const nextWord = () => {
    if (session.currentIndex + 1 < session.list.length) {
      setSession(s => ({ ...s, currentIndex: s.currentIndex + 1 }));
      setFeedback(null);
      setUserInput("");
    } else {
      setSession(s => ({ ...s, active: false }));
    }
  };

  const renderComparison = () => {
    const correct = currentWord.toLowerCase();
    const user = userInput.toLowerCase();
    const maxLen = Math.max(correct.length, user.length);
    
    return (
      <div className="flex gap-1.5 justify-center font-mono text-2xl mt-8 p-6 bg-slate-950/50 rounded-3xl border border-slate-800">
        {Array.from({ length: maxLen }).map((_, i) => (
          <span key={i} className={`px-1 border-b-4 rounded-sm ${user[i] === correct[i] ? 'text-emerald-400 border-emerald-500/30' : 'text-red-400 border-red-500 font-bold'}`}>
            {user[i] || '_'}
          </span>
        ))}
      </div>
    );
  };

  if (!session.active) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-12">
        <header>
            <h2 className="text-5xl font-black text-white">Spelling Trainer</h2>
            <p className="text-slate-400 mt-2">Listen to the pronunciation and master the spelling.</p>
        </header>
        <div className="bg-[#1e293b] border border-slate-700/50 rounded-[3rem] p-16 text-center">
          <button onClick={startPractice} className="bg-blue-600 hover:bg-blue-500 px-12 py-5 rounded-3xl font-black text-xl shadow-xl shadow-blue-500/20 transition-all">
            Start Practice Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-700/30 flex justify-between items-center font-black uppercase text-xs">
        <span className="text-slate-500">Word {session.currentIndex + 1} of {session.list.length}</span>
        <div className="flex gap-6">
            <span className="text-emerald-400">✓ {session.correct}</span>
            <span className="text-red-400">✗ {session.incorrect}</span>
        </div>
      </div>

      <div className="bg-[#1e293b] border border-slate-700/50 rounded-[3rem] p-16 text-center shadow-2xl relative">
        <button onClick={playWord} className="mb-10 p-8 bg-slate-800 hover:bg-blue-600 rounded-[2.5rem] transition-all group shadow-xl">
          <Volume2 size={56} className="text-white group-hover:scale-110 transition-transform" />
        </button>

        <input
          ref={inputRef}
          type="text"
          autoFocus
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
          placeholder="Type what you hear..."
          className="w-full bg-slate-950 border border-slate-800 p-6 rounded-3xl text-3xl text-center font-black text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-700 mb-6"
        />

        {feedback === 'incorrect' && (
          <div className="animate-in slide-in-from-top-4 duration-300 mb-8">
             <span className="text-red-400 font-black uppercase text-xs tracking-widest">Correction</span>
             {renderComparison()}
             <p className="mt-4 text-slate-400 font-bold">Correct: <span className="text-white">{currentWord}</span></p>
          </div>
        )}

        {feedback === 'correct' && (
          <p className="text-emerald-400 font-black text-2xl mb-8 flex items-center justify-center gap-2">
            <CheckCircle size={28} /> Perfect!
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
            <button onClick={nextWord} className="bg-slate-800 py-5 rounded-3xl font-black text-white flex items-center justify-center gap-3 hover:bg-slate-700 transition-all">
                <SkipForward size={24} /> Skip Word
            </button>
            <button onClick={checkAnswer} className="bg-blue-600 py-5 rounded-3xl font-black text-white hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20">
                Check Answer
            </button>
        </div>
      </div>
    </div>
  );
}
