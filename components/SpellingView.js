import { useState, useEffect, useRef } from 'react';
import { Volume2, CheckCircle, XCircle, RotateCcw, ArrowRight, HelpCircle } from 'lucide-react';

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
  const inputRef = useRef(null);

  const startPractice = () => {
    if (words.length === 0) return alert("Add words to your library first!");
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setSession({ active: true, currentIndex: 0, list: shuffled, correct: 0, incorrect: 0 });
    setFeedback(null);
    setUserInput("");
  };

  const currentWord = session.list[session.currentIndex]?.word;

  const playWord = () => {
    // Logic from your spelling app's TTS service
    const utterance = new SpeechSynthesisUtterance(currentWord);
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const checkAnswer = () => {
    if (userInput.toLowerCase().trim() === currentWord.toLowerCase()) {
      setFeedback('correct');
      setSession(s => ({ ...s, correct: s.correct + 1 }));
      setTimeout(nextWord, 1000);
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

  useEffect(() => {
    if (session.active && !feedback) playWord();
  }, [session.currentIndex, session.active]);

  if (!session.active) {
    return (
      <div className="p-12 max-w-4xl mx-auto text-center">
        <h2 className="text-5xl font-black text-white mb-8">Spelling Trainer</h2>
        <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-12">
          <p className="text-slate-400 text-xl mb-8">Master your {words.length} saved words through interactive dictation.</p>
          <button onClick={startPractice} className="bg-indigo-500 hover:bg-indigo-600 px-12 py-5 rounded-2xl font-bold text-xl transition-all">
            Start Spelling Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-12 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <span className="text-slate-400 font-bold">Word {session.currentIndex + 1} of {session.list.length}</span>
        <div className="flex gap-4">
            <span className="text-green-400 font-bold">✓ {session.correct}</span>
            <span className="text-red-400 font-bold">✗ {session.incorrect}</span>
        </div>
      </div>

      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-12 text-center">
        <button onClick={playWord} className="mb-8 p-6 bg-slate-800 hover:bg-indigo-500 rounded-2xl transition-all">
          <Volume2 size={48} />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
          placeholder="Type what you hear..."
          className="w-full bg-slate-950 border-2 border-slate-800 p-6 rounded-2xl text-2xl text-center outline-none focus:border-indigo-500 mb-6"
        />

        {feedback === 'correct' && <p className="text-green-400 font-bold text-xl mb-4">Perfect!</p>}
        {feedback === 'incorrect' && (
          <div className="mb-6">
            <p className="text-red-400 font-bold text-xl mb-2">Not quite.</p>
            <p className="text-slate-400">Correct spelling: <span className="text-white font-bold">{currentWord}</span></p>
            <button onClick={nextWord} className="mt-4 text-indigo-400 font-bold">Try Next Word →</button>
          </div>
        )}

        <button onClick={checkAnswer} className="w-full bg-indigo-500 py-4 rounded-xl font-bold text-lg">Check Spelling</button>
      </div>
    </div>
  );
}
