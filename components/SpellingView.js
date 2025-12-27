import { useState, useEffect, useRef } from 'react';
import { Volume2, CheckCircle, SkipForward, ChevronRight, Loader2, TrendingUp, GraduationCap, PlayCircle } from 'lucide-react';
import { spellingDb } from '../lib/spellingStorage';
import { IELTS_WORDS } from '../lib/ieltsWords';

export default function SpellingView({ words, settings }) {
  const [mode, setMode] = useState('menu'); 
  const [practiceType, setPracticeType] = useState('general');
  const [session, setSession] = useState({ currentIndex: 0, list: [], correct: 0, incorrect: 0 });
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState(null); // 'correct', 'incorrect'
  const [stats, setStats] = useState({ general: null, ielts: null });
  const [loadingAudio, setLoadingAudio] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { loadAllStats(); }, [words]);

  const loadAllStats = async () => {
    const generalStats = await spellingDb.getStats(words, 'general');
    const ieltsStats = await spellingDb.getStats(IELTS_WORDS, 'ielts');
    setStats({ general: generalStats, ielts: ieltsStats });
  };

  const startSession = async (type) => {
    setPracticeType(type);
    const wordList = type === 'ielts' ? IELTS_WORDS : words;
    const due = await spellingDb.getDueCards(wordList, type);
    if (due.length === 0) return alert(`All caught up on ${type === 'ielts' ? 'IELTS' : 'Library'} words!`);
    
    setSession({ currentIndex: 0, list: due, correct: 0, incorrect: 0 });
    setMode('session');
    setFeedback(null);
    setUserInput("");
  };

  const currentItem = session.list[session.currentIndex];
  const currentWord = currentItem?.word?.word || "";
  const currentExample = currentItem?.word?.example || "";

  useEffect(() => {
    if (mode === 'session' && currentWord) {
      playText(currentWord);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [session.currentIndex, mode]);

  const playText = (text, rate = 0.85) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  };

  const checkAnswer = () => {
    if (!userInput.trim()) return;
    const isCorrect = userInput.toLowerCase().trim() === currentWord.toLowerCase().trim();
    const wordId = currentItem.word.id;

    if (isCorrect) {
      setFeedback('correct');
      // FSRS: Map correct spelling to "Good" (2)
      spellingDb.recordResult(wordId, 2, practiceType); 
      setSession(s => ({ ...s, correct: s.correct + 1 }));
      // Transition automatically on success
      setTimeout(nextWord, 1000); 
    } else {
      setFeedback('incorrect');
      // FSRS: Map incorrect spelling to "Again" (0)
      spellingDb.recordResult(wordId, 0, practiceType); 
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
      loadAllStats();
    }
  };

  const renderComparisonVertical = () => {
    const correct = currentWord.toLowerCase().trim();
    const user = userInput.toLowerCase().trim();
    const maxLen = Math.max(correct.length, user.length);
    return (
      <div className="flex flex-wrap gap-2 justify-center font-mono text-xl">
        {Array.from({ length: maxLen }).map((_, i) => (
          <div key={i} className="flex flex-col items-center min-w-[1.2rem]">
            <span className={`${user[i] === correct[i] ? 'text-emerald-400' : 'text-red-400 font-black border-b-2 border-red-500'}`}>
              {user[i] || '_'}
            </span>
            <span className="text-slate-500 text-xs mt-1">{correct[i] || '_'}</span>
          </div>
        ))}
      </div>
    );
  };

  if (mode === 'menu') {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-600/20"><Volume2 size={32} className="text-white" /></div>
          <h2 className="text-4xl font-black text-white">Spelling Trainer</h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* General Library Mode Card */}
          <div className="bg-[#1e293b] border border-slate-700/50 p-8 rounded-[2rem] shadow-xl flex flex-col items-center text-center">
            <TrendingUp className="text-blue-500 mb-4" size={40} />
            <h3 className="text-2xl font-bold text-white mb-2">My Library</h3>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex flex-col gap-1">
              <span>Due: <span className="text-blue-400">{stats.general?.dueToday || 0}</span></span>
              <span>New: <span className="text-emerald-400">{stats.general?.newWords || 0}</span></span>
              <span>Learning: <span className="text-orange-400">{stats.general?.learning || 0}</span></span>
            </div>
            <button onClick={() => startSession('general')} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-white transition-all shadow-lg shadow-blue-600/20">
              Start Practice
            </button>
          </div>

          {/* IELTS Masterlist Mode Card */}
          <div className="bg-[#1e293b] border border-slate-700/50 p-8 rounded-[2rem] shadow-xl flex flex-col items-center text-center">
            <GraduationCap className="text-emerald-500 mb-4" size={40} />
            <h3 className="text-2xl font-bold text-white mb-2">IELTS Masterlist</h3>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex flex-col gap-1">
              <span>Due: <span className="text-blue-400">{stats.ielts?.dueToday || 0}</span></span>
              <span>New: <span className="text-emerald-400">{stats.ielts?.newWords || 0}</span></span>
              <span>Learning: <span className="text-orange-400">{stats.ielts?.learning || 0}</span></span>
            </div>
            <button onClick={() => startSession('ielts')} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-white transition-all shadow-lg shadow-emerald-600/20">
              Master IELTS
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/30 flex justify-between items-center font-black uppercase text-[10px] tracking-widest">
        <span className="text-blue-400">{practiceType === 'ielts' ? 'IELTS MODE' : 'LIBRARY MODE'}</span>
        <span className="text-slate-500">Word {session.currentIndex + 1} / {session.list.length}</span>
        <div className="flex gap-4">
          <span className="text-emerald-400">Correct: {session.correct}</span>
          <span className="text-red-400">Incorrect: {session.incorrect}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start min-h-[500px]">
        {/* Left Section: Question and Input Area */}
        <div className={`transition-all duration-500 bg-[#1e293b] border border-slate-700/50 rounded-[2.5rem] p-12 text-center shadow-2xl h-full flex flex-col justify-center ${feedback ? 'flex-1' : 'w-full'}`}>
            <div className="flex justify-center gap-4 mb-10">
              <button 
                onClick={() => playText(currentWord)} 
                className="p-6 bg-slate-800 hover:bg-blue-600 rounded-3xl transition-all group shadow-lg"
                title="Pronounce Word"
              >
                <Volume2 size={48} className="text-white group-hover:scale-105" />
              </button>
              {currentExample && (
                <button 
                  onClick={() => playText(currentExample, 1.0)} 
                  className="p-6 bg-slate-800 hover:bg-emerald-600 rounded-3xl transition-all group shadow-lg"
                  title="Pronounce Example"
                >
                  <PlayCircle size={48} className="text-white group-hover:scale-105" />
                </button>
              )}
            </div>

            <input
                ref={inputRef}
                type="text"
                autoFocus
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (feedback === 'incorrect' ? nextWord() : checkAnswer())}
                placeholder="Type the word..."
                disabled={feedback === 'correct'}
                className="w-full bg-slate-950 border border-slate-800 p-8 rounded-3xl text-4xl text-center font-black text-white outline-none focus:border-blue-500 mb-8 transition-all"
            />

            {!feedback && (
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={nextWord} className="bg-slate-800 py-5 rounded-3xl font-black text-white flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
                    <SkipForward size={20} /> Skip Word
                  </button>
                  <button onClick={checkAnswer} className="bg-blue-600 py-5 rounded-3xl font-black text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20">
                    Check Answer
                  </button>
               </div>
            )}
        </div>

        {/* Right Section: Dedicated Feedback/Result Area */}
        {feedback && (
          <div className="w-full lg:w-[450px] animate-in slide-in-from-right-8 duration-500 flex flex-col gap-4 h-full">
            {feedback === 'incorrect' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-[2rem] p-8 shadow-xl">
                  <p className="text-red-400 text-xs font-black uppercase mb-4 tracking-widest">Letter Comparison</p>
                  <div className="mb-8">{renderComparisonVertical()}</div>
                  <div className="pt-6 border-t border-red-500/20">
                    <p className="text-slate-500 text-[10px] font-black uppercase mb-2 tracking-widest">Correct Spelling</p>
                    <p className="text-3xl font-black text-white capitalize mb-4">{currentWord}</p>
                    {currentExample && (
                      <p className="text-slate-300 text-lg italic leading-relaxed">"{currentExample}"</p>
                    )}
                  </div>
                  <button onClick={nextWord} className="w-full py-5 mt-8 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-white text-xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 transition-all">
                    Continue <ChevronRight size={24} />
                  </button>
              </div>
            )}

            {feedback === 'correct' && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-12 shadow-xl text-center flex flex-col items-center justify-center h-full">
                  <div className="bg-emerald-500/20 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle size={48} className="text-emerald-500" />
                  </div>
                  <p className="text-white text-3xl font-black">Well Done!</p>
                  <p className="text-emerald-400/60 text-sm mt-2 font-bold">Moving to next word...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
