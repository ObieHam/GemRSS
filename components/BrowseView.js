import { useState, useEffect, useRef } from 'react';
import { Volume2, CheckCircle, SkipForward, ChevronRight, Loader2 } from 'lucide-react';
import { spellingDb } from '../lib/spellingStorage';

export default function SpellingView({ words, settings }) {
  const [session, setSession] = useState({ 
    active: false, 
    currentIndex: 0, 
    list: [], 
    correct: 0, 
    incorrect: 0 
  });
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState(null); // 'correct', 'incorrect'
  const [audioCache, setAudioCache] = useState({});
  const [loadingAudio, setLoadingAudio] = useState(false);
  const inputRef = useRef(null);

  // Auto-play sound when word changes and preload the next word in the list
  useEffect(() => {
    if (session.active && session.list[session.currentIndex]) {
      const current = session.list[session.currentIndex].word;
      playWord(current);
      preloadNext();
    }
  }, [session.currentIndex, session.active]);

  const startPractice = () => {
    if (words.length === 0) return alert("Add words to your library first!");
    // Shuffle words for the session
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setSession({ 
      active: true, 
      currentIndex: 0, 
      list: shuffled, 
      correct: 0, 
      incorrect: 0 
    });
    setFeedback(null);
    setUserInput("");
    setAudioCache({});
  };

  const currentWord = session.list[session.currentIndex]?.word || "";

  // Helper to fetch audio from the TTS API
  const fetchAudio = async (word) => {
    if (audioCache[word]) return audioCache[word];
    try {
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word })
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setAudioCache(prev => ({ ...prev, [word]: url }));
        return url;
      }
    } catch (e) {
      console.error("TTS fetch failed", e);
    }
    return null;
  };

  const playWord = async (word) => {
    setLoadingAudio(true);
    const url = await fetchAudio(word);
    
    if (url) {
      const audio = new Audio(url);
      audio.play().catch(() => playFallback(word));
    } else {
      playFallback(word);
    }
    setLoadingAudio(false);
  };

  const playFallback = (word) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const preloadNext = () => {
    const nextIdx = session.currentIndex + 1;
    if (nextIdx < session.list.length) {
      fetchAudio(session.list[nextIdx].word);
    }
  };

  const checkAnswer = () => {
    const isCorrect = userInput.toLowerCase().trim() === currentWord.toLowerCase();
    const wordId = session.list[session.currentIndex].id;

    if (isCorrect) {
      setFeedback('correct');
      // FSRS: Map correct spelling to "Good" (2)
      spellingDb.recordResult(wordId, 2); 
      setSession(s => ({ ...s, correct: s.correct + 1 }));
      // Transition automatically on success
      setTimeout(nextWord, 1000);
    } else {
      setFeedback('incorrect');
      // FSRS: Map incorrect spelling to "Again" (0)
      spellingDb.recordResult(wordId, 0);
      setSession(s => ({ ...s, incorrect: s.incorrect + 1 }));
    }
  };

  const nextWord = () => {
    if (session.currentIndex + 1 < session.list.length) {
      setSession(s => ({ ...s, currentIndex: s.currentIndex + 1 }));
      setFeedback(null);
      setUserInput("");
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSession(s => ({ ...s, active: false }));
    }
  };

  // Vertical stack: User's typed letters on top, target letters on bottom
  const renderComparisonVertical = () => {
    const correct = currentWord.toLowerCase();
    const user = userInput.toLowerCase();
    const maxLen = Math.max(correct.length, user.length);
    
    return (
      <div className="flex flex-wrap gap-2 justify-start font-mono text-xl">
        {Array.from({ length: maxLen }).map((_, i) => (
          <div key={i} className="flex flex-col items-center min-w-[1.2rem]">
            <span className={`${user[i] === correct[i] ? 'text-emerald-400' : 'text-red-400 font-black border-b-2 border-red-500'}`}>
              {user[i] || '_'}
            </span>
            <span className="text-slate-500 text-xs mt-1">
              {correct[i] || '_'}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (!session.active) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header>
            <h2 className="text-4xl font-black text-white">Spelling Trainer</h2>
            <p className="text-slate-400">Master your vocabulary through dictation and the FSRS algorithm.</p>
        </header>
        <div className="bg-[#1e293b] border border-slate-700/50 rounded-3xl p-12 text-center shadow-2xl">
          <button onClick={startPractice} className="bg-blue-600 hover:bg-blue-500 px-12 py-5 rounded-2xl font-black text-xl shadow-lg shadow-blue-500/20 transition-all">
            Start Practice Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/30 flex justify-between items-center font-black uppercase text-[10px] tracking-widest">
        <span className="text-slate-500">Word {session.currentIndex + 1} / {session.list.length}</span>
        <div className="flex gap-6">
            <span className="text-emerald-400">Correct: {session.correct}</span>
            <span className="text-red-400">Incorrect: {session.incorrect}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Main Practice Hub */}
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
                placeholder="Type the word..."
                disabled={feedback === 'correct'}
                className="w-full bg-slate-950 border border-slate-800 p-6 rounded-3xl text-3xl text-center font-black text-white outline-none focus:border-blue-500 mb-8 transition-all"
            />

            {/* Buttons Morphing: Becomes long "Next Word" on error */}
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
                            <SkipForward size={20} /> Skip Word
                        </button>
                        <button onClick={checkAnswer} className="bg-blue-600 py-5 rounded-3xl font-black text-white text-base hover:bg-blue-500 transition-colors shadow-xl shadow-blue-500/20">
                            Check Spelling
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Side Feedback Container: Prevents layout pushing */}
        <div className="w-full lg:w-80 min-h-[300px]">
          {(feedback === 'incorrect' || feedback === 'correct') && (
              <div className="bg-slate-900 border border-slate-700 rounded-[2rem] p-8 animate-in slide-in-from-right-4 duration-500 sticky top-8">
                  <div className="mb-6">
                      <span className={`text-xs font-black uppercase tracking-[0.2em] ${feedback === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {feedback === 'correct' ? 'Result: Correct' : 'Result: Incorrect'}
                      </span>
                  </div>
                  
                  {feedback === 'incorrect' && (
                      <div className="space-y-6">
                          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Letter-for-Letter Diff:</p>
                          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                            {renderComparisonVertical()}
                          </div>
                          <div className="pt-6 border-t border-slate-800">
                              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Target Spelling:</p>
                              <p className="text-2xl font-black text-white capitalize tracking-wider">{currentWord}</p>
                          </div>
                      </div>
                  )}

                  {feedback === 'correct' && (
                      <div className="text-center py-6">
                          <div className="bg-emerald-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} className="text-emerald-500" />
                          </div>
                          <p className="text-white text-lg font-black">Well Done!</p>
                      </div>
                  )}
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
