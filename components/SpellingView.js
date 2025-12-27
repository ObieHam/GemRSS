import { useState, useEffect, useRef } from 'react';
import { Volume2, CheckCircle, SkipForward, ChevronRight, Loader2, TrendingUp, GraduationCap } from 'lucide-react';
import { spellingDb } from '../lib/spellingStorage';
import { IELTS_WORDS } from '../lib/ieltsWords';

export default function SpellingView({ words, settings }) {
  const [mode, setMode] = useState('menu'); 
  const [practiceType, setPracticeType] = useState('general');
  const [session, setSession] = useState({ currentIndex: 0, list: [], correct: 0, incorrect: 0 });
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState(null); // 'correct', 'incorrect'
  const [stats, setStats] = useState(null);
  const [audioCache, setAudioCache] = useState({});
  const [loadingAudio, setLoadingAudio] = useState(false);
  const inputRef = useRef(null);
  const longPressTimer = useRef(null);

  useEffect(() => { loadStats(); }, [words, practiceType]);

  const loadStats = async () => {
    const wordList = practiceType === 'ielts' ? IELTS_WORDS : words;
    const s = await spellingDb.getStats(wordList, practiceType);
    setStats(s);
  };

  const startSession = async (type) => {
    setPracticeType(type);
    const wordList = type === 'ielts' ? IELTS_WORDS : words;
    const due = await spellingDb.getDueCards(wordList, type);
    
    if (due.length === 0) {
      alert(`You are all caught up on ${type === 'ielts' ? 'IELTS' : 'Library'} spelling!`);
      return;
    }
    
    setSession({ currentIndex: 0, list: due, correct: 0, incorrect: 0 });
    setMode('session');
    setFeedback(null);
    setUserInput("");
    setAudioCache({});
  };

  const currentItem = session.list[session.currentIndex];
  const currentWord = currentItem?.word?.word || "";
  const currentExample = currentItem?.word?.example || currentItem?.word?.definition || "";

  useEffect(() => {
    if (mode === 'session' && currentWord) {
      playWord(currentWord);
      preloadNext();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [session.currentIndex, mode]);

  // --- Audio Logic (Original TTS + Fallback) ---
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
    } catch (e) { console.error("TTS fetch failed", e); }
    return null;
  };

  const playWord = async (word, rate = 0.85) => {
    setLoadingAudio(true);
    const url = await fetchAudio(word);
    if (url) {
      const audio = new Audio(url);
      audio.playbackRate = rate;
      audio.play().catch(() => playFallback(word, rate));
    } else {
      playFallback(word, rate);
    }
    setLoadingAudio(false);
  };

  const playFallback = (text, rate = 0.85) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  };

  const preloadNext = () => {
    const nextIdx = session.currentIndex + 1;
    if (nextIdx < session.list.length) {
      fetchAudio(session.list[nextIdx].word.word);
    }
  };

  // --- Interaction Handlers ---
  const handleAudioBtnDown = () => {
    longPressTimer.current = setTimeout(() => {
      if (currentExample) playFallback(currentExample, 1.0);
    }, 600); // Long press for example
  };

  const handleAudioBtnUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      if (!window.speechSynthesis.speaking) playWord(currentWord);
    }
  };

  const checkAnswer = () => {
    if (!userInput.trim()) return;
    const isCorrect = userInput.toLowerCase().trim() === currentWord.toLowerCase().trim();
    const wordId = currentItem.word.id;

    if (isCorrect) {
      setFeedback('correct');
      spellingDb.recordResult(wordId, 3, practiceType); // Map to FSRS 'Good'
      setSession(s => ({ ...s, correct: s.correct + 1 }));
      setTimeout(nextWord, 500); // Transition after 500ms
    } else {
      setFeedback('incorrect');
      spellingDb.recordResult(wordId, 0, practiceType); // Map to FSRS 'Again'
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

  // --- UI Components ---
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
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-600/20">
            <Volume2 size={32} className="text-white" />
          </div>
          <h2 className="text-5xl font-black text-white">Spelling Trainer</h2>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <button onClick={() => startSession('general')} className="group bg-[#1e293b] border-2 border-slate-700/50 hover:border-blue-500 p-10 rounded-[2.5rem] transition-all text-left shadow-xl">
            <TrendingUp className="text-blue-500 mb-6" size={48} />
            <h3 className="text-3xl font-bold text-white mb-2">Library Session</h3>
            <p className="text-slate-400">Practice vocabulary from your uploaded PDFs.</p>
          </button>

          <button onClick={() => startSession('ielts')} className="group bg-[#1e293b] border-2 border-slate-700/50 hover:border-emerald-500 p-10 rounded-[2.5rem] transition-all text-left shadow-xl">
            <GraduationCap className="text-emerald-500 mb-6" size={48} />
            <h3 className="text-3xl font-bold text-white mb-2">IELTS Masterlist</h3>
            <p className="text-slate-400">138 most commonly misspelled IELTS words.</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/30 flex justify-between items-center font-black uppercase text-[10px] tracking-widest">
        <span className="text-blue-400">{practiceType === 'ielts' ? 'IELTS MODE' : 'LIBRARY MODE'}</span>
        <span className="text-slate-500">Word {session.currentIndex + 1} / {session.list.length}</span>
        <div className="flex gap-4">
          <span className="text-emerald-400">Correct: {session.correct}</span>
          <span className="text-red-400">Incorrect: {session.incorrect}</span>
        </div>
      </div>

      <div className="bg-[#1e293b] border border-slate-700/50 rounded-[2.5rem] p-12 text-center shadow-2xl relative">
          <button 
            onMouseDown={handleAudioBtnDown} 
            onMouseUp={handleAudioBtnUp} 
            className="mb-10 p-8 bg-slate-800 hover:bg-blue-600 rounded-full transition-all group active:scale-95"
            title="Click for Word, Hold for Example"
          >
            {loadingAudio ? <Loader2 className="animate-spin text-white" size={64}/> : <Volume2 size={64} className="text-white group-hover:scale-110" />}
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
              className="w-full bg-slate-950 border border-slate-800 p-8 rounded-3xl text-4xl text-center font-black text-white outline-none focus:border-blue-500 mb-8 transition-all"
          />

          {feedback === 'incorrect' && (
            <div className="mt-4 p-8 bg-red-500/10 border border-red-500/20 rounded-3xl animate-in fade-in zoom-in-95">
                <p className="text-red-400 text-xs font-black uppercase mb-4 tracking-widest">Letter Comparison</p>
                <div className="mb-8">{renderComparisonVertical()}</div>
                
                <p className="text-slate-500 text-[10px] font-black uppercase mb-2 tracking-widest">Context Sentence</p>
                <p className="text-slate-200 text-lg italic leading-relaxed">"{currentExample}"</p>
            </div>
          )}

          {feedback !== 'incorrect' ? (
             <div className="grid grid-cols-2 gap-4">
                <button onClick={nextWord} className="bg-slate-800 py-5 rounded-3xl font-black text-white flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
                  <SkipForward size={20} /> Skip
                </button>
                <button onClick={checkAnswer} className="bg-blue-600 py-5 rounded-3xl font-black text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20">
                  Check Answer
                </button>
             </div>
          ) : (
             <button onClick={nextWord} className="w-full py-6 mt-4 bg-indigo-600 hover:bg-indigo-500 rounded-3xl font-black text-white text-xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20">
                Continue Session <ChevronRight />
             </button>
          )}
      </div>
    </div>
  );
}
