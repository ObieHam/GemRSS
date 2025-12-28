import { useState, useEffect, useRef } from 'react';
import { Volume2, CheckCircle, SkipForward, ChevronRight, Loader2, TrendingUp, GraduationCap, PlayCircle, PlusCircle, Edit3, Flame } from 'lucide-react';
import { spellingDb } from '../lib/spellingStorage';
import { IELTS_WORDS } from '../lib/ieltsWords';
import { db } from '../lib/storage';

export default function SpellingView({ words, settings, onSuccessFlash }) {
  const [mode, setMode] = useState('menu'); 
  const [practiceType, setPracticeType] = useState('general');
  const [session, setSession] = useState({ currentIndex: 0, list: [], correct: 0, incorrect: 0 });
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState(null); 
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState({ general: null, ielts: null });
  const [isEditingExample, setIsEditingExample] = useState(false);
  const [newExample, setNewExample] = useState("");
  const inputRef = useRef(null);
  
  const successAudio = useRef(null);
  const failureAudio = useRef(null);

  useEffect(() => {
    loadAllStats();
    successAudio.current = new Audio('/success.mp3');
    failureAudio.current = new Audio('/failure.mp3');
    successAudio.current.load();
    failureAudio.current.load();
  }, [words]);

  const loadAllStats = async () => {
    const generalStats = await spellingDb.getStats(words, 'general');
    const ieltsStats = await spellingDb.getStats(IELTS_WORDS, 'ielts');
    setStats({ general: generalStats, ielts: ieltsStats });
  };

  const startSession = async (type) => {
    setPracticeType(type);
    const wordList = type === 'ielts' ? IELTS_WORDS : words;
    const due = await spellingDb.getDueCards(wordList, type);
    if (due.length === 0) return alert(`All caught up on ${type} words!`);
    
    setSession({ currentIndex: 0, list: due, correct: 0, incorrect: 0 });
    setMode('session');
    setFeedback(null);
    setStreak(0);
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

  const playResultSound = (isSuccess) => {
    const audio = isSuccess ? successAudio.current : failureAudio.current;
    if (!audio) return;
    audio.currentTime = 0;
    if (isSuccess) {
      const pitchShift = Math.min(1.0 + (streak * 0.05), 1.7);
      audio.playbackRate = pitchShift;
      audio.preservesPitch = false; 
    } else {
      audio.playbackRate = 1.0;
    }
    audio.play().catch(() => {});
  };

  const handleSaveExample = async () => {
    if (practiceType === 'ielts') return;
    const wordData = await db.vocabulary.where('word').equals(currentWord).first();
    if (wordData) {
        await db.vocabulary.update(wordData.id, { example: newExample });
        session.list[session.currentIndex].word.example = newExample;
    }
    setIsEditingExample(false);
  };

  const checkAnswer = () => {
    if (!userInput.trim()) return;
    const isCorrect = userInput.toLowerCase().trim() === currentWord.toLowerCase().trim();
    const wordId = currentItem.word.id;

    if (isCorrect) {
      setFeedback('correct');
      if (onSuccessFlash) onSuccessFlash();
      playResultSound(true);
      setStreak(prev => prev + 1);
      spellingDb.recordResult(wordId, 2, practiceType); 
      setSession(s => ({ ...s, correct: s.correct + 1 }));
      setTimeout(nextWord, 1000); 
    } else {
      setFeedback('incorrect');
      setStreak(0);
      playResultSound(false);
      spellingDb.recordResult(wordId, 0, practiceType); 
      setSession(s => ({ ...s, incorrect: s.incorrect + 1 }));
    }
  };

  const nextWord = () => {
    if (session.currentIndex + 1 < session.list.length) {
      setSession(s => ({ ...s, currentIndex: s.currentIndex + 1 }));
      setFeedback(null);
      setUserInput("");
      setIsEditingExample(false);
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

  const getStreakStyle = () => {
    if (streak === 0) return 'text-slate-500 border-slate-800';
    if (streak < 5) return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    if (streak < 10) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 animate-pulse';
    return 'text-orange-500 border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.4)] animate-bounce';
  };

  if (mode === 'menu') {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-3xl shadow-lg shadow-indigo-500/20"><Volume2 size={32} className="text-white" /></div>
          <h2 className="text-4xl font-black text-white">Spelling Trainer</h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1e293b] border border-slate-700/50 p-8 rounded-3xl shadow-xl flex flex-col items-center text-center">
            <TrendingUp className="text-indigo-400 mb-4" size={40} />
            <h3 className="text-2xl font-bold text-white mb-2">My Library</h3>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex flex-col gap-1">
              <span>Due: <span className="text-indigo-400">{stats.general?.dueToday || 0}</span></span>
              <span>New: <span className="text-emerald-400">{stats.general?.newWords || 0}</span></span>
              <span>Learning: <span className="text-orange-400">{stats.general?.learning || 0}</span></span>
            </div>
            <button onClick={() => startSession('general')} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-white transition-all shadow-lg">Start Practice</button>
          </div>

          <div className="bg-[#1e293b] border border-slate-700/50 p-8 rounded-3xl shadow-xl flex flex-col items-center text-center">
            <GraduationCap className="text-emerald-400 mb-4" size={40} />
            <h3 className="text-2xl font-bold text-white mb-2">IELTS Masterlist</h3>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex flex-col gap-1">
              <span>Due: <span className="text-indigo-400">{stats.ielts?.dueToday || 0}</span></span>
              <span>New: <span className="text-emerald-400">{stats.ielts?.newWords || 0}</span></span>
              <span>Learning: <span className="text-orange-400">{stats.ielts?.learning || 0}</span></span>
            </div>
            <button onClick={() => startSession('ielts')} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-white transition-all shadow-lg">Master IELTS</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-700/30 flex justify-between items-center font-black uppercase text-[10px] tracking-widest">
        <div className="flex gap-4 items-center">
          <span className="text-indigo-400">{practiceType === 'ielts' ? 'IELTS MODE' : 'LIBRARY MODE'}</span>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all duration-300 ${getStreakStyle()}`}>
            <Flame size={12} className={streak >= 5 ? 'fill-current' : ''} />
            <span className="text-[9px] font-black">STREAK: {streak}</span>
          </div>
        </div>
        <span className="text-slate-500">Word {session.currentIndex + 1} / {session.list.length}</span>
        <div className="flex gap-4">
          <span className="text-emerald-400">Correct: {session.correct}</span>
          <span className="text-red-400">Incorrect: {session.incorrect}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start min-h-[550px]">
        <div className="flex-1 bg-[#1e293b] border border-slate-700/50 rounded-3xl p-12 text-center shadow-2xl flex flex-col justify-center min-h-[450px]">
            <div className="flex justify-center gap-4 mb-10">
              <button onClick={() => playText(currentWord)} className="p-6 bg-slate-800 hover:bg-indigo-600 rounded-2xl transition-all group shadow-lg">
                <Volume2 size={48} className="text-white" />
              </button>
              <button onClick={() => playText(currentExample || "No example available.", 1.0)} className="p-6 bg-slate-800 hover:bg-emerald-600 rounded-2xl transition-all group shadow-lg">
                <PlayCircle size={48} className="text-white" />
              </button>
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
                className="w-full bg-slate-950 border border-slate-800 p-8 rounded-3xl text-4xl text-center font-black text-white outline-none focus:border-indigo-500 mb-8"
            />

            {!feedback ? (
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={nextWord} className="bg-slate-800 py-5 rounded-2xl font-black text-white flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
                    <SkipForward size={20} /> Skip
                  </button>
                  <button onClick={checkAnswer} className="bg-indigo-600 py-5 rounded-2xl font-black text-white hover:bg-indigo-500 shadow-lg">
                    Check Answer
                  </button>
               </div>
            ) : (
                <button onClick={nextWord} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-white text-xl flex items-center justify-center gap-2">
                    Continue Session <ChevronRight size={24} />
                </button>
            )}
        </div>

        <div className="w-full lg:w-[450px] flex flex-col gap-4 self-stretch">
            <div className="bg-slate-900/50 border border-slate-700/30 rounded-3xl p-8 h-full shadow-inner flex flex-col justify-center">
                {feedback === 'incorrect' ? (
                  <div className="animate-in fade-in slide-in-from-right-4 h-full">
                      <p className="text-red-400 text-xs font-black uppercase mb-4 tracking-widest text-center">Correction</p>
                      <div className="mb-8">{renderComparisonVertical()}</div>
                      <div className="pt-6 border-t border-slate-800">
                        <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Target Spelling</p>
                        <p className="text-3xl font-black text-white capitalize mb-4">{currentWord}</p>
                        {currentExample ? (
                          <p className="text-slate-300 text-sm italic leading-relaxed">"{currentExample}"</p>
                        ) : (
                          <button onClick={() => { setIsEditingExample(true); setNewExample(""); }} className="flex items-center gap-2 text-indigo-400 text-sm font-bold hover:text-indigo-300 transition-colors">
                            <PlusCircle size={16} /> Add Context Sentence
                          </button>
                        )}
                      </div>
                  </div>
                ) : feedback === 'correct' ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center h-full animate-in zoom-in-95">
                      <div className="bg-emerald-500/20 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle size={48} className="text-emerald-500" />
                      </div>
                      <p className="text-white text-3xl font-black mb-2 text-center">Well Done!</p>
                      {streak > 1 && <p className="text-emerald-400 text-lg font-black animate-bounce">{streak}x STREAK!</p>}
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Word Proficiency Info</p>
                    <div className="space-y-6 flex-1">
                        <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                            <span className="text-slate-400 font-bold">FSRS Stability</span>
                            <span className="text-white font-black">{Math.round(currentItem.card.stability || 0)} days</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                            <span className="text-slate-400 font-bold">Repetitions</span>
                            <span className="text-white font-black">{currentItem.card.repetitions || 0}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                            <span className="text-slate-400 font-bold">Next Review</span>
                            <span className="text-white font-black">{currentItem.card.nextReview ? new Date(currentItem.card.nextReview).toLocaleDateString() : 'Now'}</span>
                        </div>
                    </div>
                    
                    {practiceType === 'general' && (
                        <div className="mt-auto pt-10">
                             <button onClick={() => { setIsEditingExample(true); setNewExample(currentExample || ""); }} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-700 flex items-center justify-center gap-2 transition-colors">
                                <Edit3 size={14} /> {currentExample ? 'Edit Context' : 'Add Context'}
                             </button>
                        </div>
                    )}
                  </div>
                )}
            </div>
        </div>
      </div>

      {isEditingExample && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-slate-900 border-2 border-indigo-500/30 rounded-3xl p-10 max-w-lg w-full shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-2">{currentExample ? 'Edit Context' : 'Add Context'}</h3>
            <textarea 
              autoFocus
              className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 mb-6"
              value={newExample}
              onChange={(e) => setNewExample(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={() => setIsEditingExample(false)} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-bold">Cancel</button>
              <button onClick={handleSaveExample} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
