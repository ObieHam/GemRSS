import { useState, useEffect } from 'react';
import { Brain, RotateCcw, Volume2, Eye, CheckCircle, Clock, BookOpen, TrendingUp } from 'lucide-react';
import { flashcardDb } from '../lib/flashcardStorage';

export default function FlashcardView({ words, settings }) {
  const [mode, setMode] = useState('menu'); // menu, session
  const [dueCards, setDueCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [stats, setStats] = useState(null);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    loadStats();
  }, [words]);

  const loadStats = async () => {
    const statistics = await flashcardDb.getStats(words);
    setStats(statistics);
  };

  const startSession = async () => {
    const due = await flashcardDb.getDueCards(words);
    
    if (due.length === 0) {
      alert('No cards due for review!');
      return;
    }
    
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
    
    // Move to next card
    if (currentCardIndex + 1 < dueCards.length) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      // Session complete
      setSessionComplete(true);
      await loadStats();
    }
  };

  const playAudio = (word) => {
    if (settings.apiSource === 'free-dictionary' && word.phonetics) {
      const accentMap = { us: '-us', uk: '-uk', au: '-au' };
      const preferredAudio = word.phonetics.find(p =>
        p.audio && p.audio.includes(accentMap[settings.accent])
      );
      const audioUrl = preferredAudio?.audio || word.phonetics.find(p => p.audio)?.audio;

      if (audioUrl) {
        new Audio(audioUrl).play().catch(e => console.error("Audio play failed", e));
      }
    } else if (word.audioUrl) {
      new Audio(word.audioUrl).play().catch(e => console.error("Audio play failed", e));
    }
  };

  const resetProgress = async () => {
    if (!confirm('Reset all flashcard progress? This cannot be undone.')) return;
    
    for (const word of words) {
      await flashcardDb.delete(word.id);
    }
    
    await loadStats();
    setMode('menu');
  };

  // Menu View
  if (mode === 'menu') {
    return (
      <div className="p-12 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 p-3 rounded-2xl">
              <Brain size={32} className="text-white" />
            </div>
            <h2 className="text-5xl font-black text-white">Flashcards</h2>
          </div>
          <button
            onClick={resetProgress}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-slate-300 text-sm transition-colors"
          >
            <RotateCcw size={16} />
            Reset Progress
          </button>
        </div>

        {stats && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-900 border-2 border-blue-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={20} className="text-blue-400" />
                  <p className="text-slate-400 text-sm font-bold uppercase">New</p>
                </div>
                <p className="text-4xl font-black text-white">{stats.newCards}</p>
              </div>

              <div className="bg-slate-900 border-2 border-orange-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={20} className="text-orange-400" />
                  <p className="text-slate-400 text-sm font-bold uppercase">Learning</p>
                </div>
                <p className="text-4xl font-black text-white">{stats.learning}</p>
              </div>

              <div className="bg-slate-900 border-2 border-emerald-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={20} className="text-emerald-400" />
                  <p className="text-slate-400 text-sm font-bold uppercase">Review</p>
                </div>
                <p className="text-4xl font-black text-white">{stats.review}</p>
              </div>

              <div className="bg-slate-900 border-2 border-purple-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={20} className="text-purple-400" />
                  <p className="text-slate-400 text-sm font-bold uppercase">Due Today</p>
                </div>
                <p className="text-4xl font-black text-white">{stats.dueToday}</p>
              </div>
            </div>

            {/* Start Session Button */}
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-12 text-center">
              {stats.dueToday > 0 ? (
                <>
                  <h3 className="text-3xl font-black text-white mb-4">
                    {stats.dueToday} {stats.dueToday === 1 ? 'card' : 'cards'} ready to review
                  </h3>
                  <p className="text-slate-400 mb-8">
                    Practice makes perfect! Review your vocabulary using spaced repetition.
                  </p>
                  <button
                    onClick={startSession}
                    className="inline-flex items-center gap-4 px-12 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-2xl font-bold text-xl text-white transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
                  >
                    <Brain size={28} />
                    Start Review Session
                  </button>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/20 rounded-full mb-4">
                    <CheckCircle size={40} className="text-emerald-400" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-4">All Caught Up!</h3>
                  <p className="text-slate-400">
                    No cards due for review right now. Come back later to continue learning.
                  </p>
                </>
              )}
            </div>

            {/* Info Box */}
            <div className="mt-8 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-6">
              <h4 className="text-lg font-bold text-indigo-300 mb-2">About Spaced Repetition</h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                This flashcard system uses the SM-2 algorithm (the same as Anki) to optimize your learning. 
                Cards are shown at increasing intervals based on how well you know them. The more you practice, 
                the better you'll remember!
              </p>
            </div>
          </>
        )}
      </div>
    );
  }

  // Session View
  if (mode === 'session') {
    if (sessionComplete) {
      return (
        <div className="p-12 max-w-3xl mx-auto">
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-500 rounded-full mb-6">
              <CheckCircle size={48} className="text-white" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4">Session Complete!</h2>
            <p className="text-slate-400 text-lg mb-8">
              Great job! You've reviewed {dueCards.length} {dueCards.length === 1 ? 'card' : 'cards'}.
            </p>
            <button
              onClick={() => setMode('menu')}
              className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 rounded-2xl font-bold text-lg transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>
      );
    }

    const currentCard = dueCards[currentCardIndex];
    const progress = ((currentCardIndex + 1) / dueCards.length) * 100;

    return (
      <div className="p-12 max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-bold">
              Card {currentCardIndex + 1} of {dueCards.length}
            </span>
            <span className="text-emerald-400 font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-12 min-h-[400px] flex flex-col items-center justify-center mb-8">
          {!showAnswer ? (
            <>
              <h3 className="text-5xl font-black text-white mb-8 capitalize text-center">
                {currentCard.word.word}
              </h3>
              
              {((settings.apiSource === 'free-dictionary' && currentCard.word.phonetics?.length > 0) ||
                (settings.apiSource === 'merriam-webster' && currentCard.word.audioUrl)) && (
                <button
                  onClick={() => playAudio(currentCard.word)}
                  className="mb-8 flex items-center gap-3 px-6 py-3 bg-slate-800 hover:bg-indigo-500 rounded-xl transition-colors font-bold"
                >
                  <Volume2 size={24} />
                  Play Pronunciation
                </button>
              )}

              <button
                onClick={() => setShowAnswer(true)}
                className="flex items-center gap-3 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 rounded-2xl font-bold text-lg transition-colors"
              >
                <Eye size={24} />
                Show Answer
              </button>
            </>
          ) : (
            <>
              <h3 className="text-4xl font-black text-white mb-4 capitalize text-center">
                {currentCard.word.word}
              </h3>
              
              <div className="w-full max-w-2xl">
                <div className="mb-6">
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Definition</p>
                  <p className="text-slate-200 text-lg leading-relaxed">{currentCard.word.definition}</p>
                </div>

                {currentCard.word.example && (
                  <div className="mb-6">
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Example</p>
                    <p className="text-slate-300 italic">"{currentCard.word.example}"</p>
                  </div>
                )}
              </div>

              {/* Answer Buttons (Anki-style) */}
              <div className="mt-8 grid grid-cols-4 gap-3 w-full max-w-2xl">
                <button
                  onClick={() => handleAnswer(0)}
                  className="px-4 py-6 bg-red-500/20 hover:bg-red-500 border-2 border-red-500/30 hover:border-red-500 rounded-xl font-bold transition-all"
                >
                  <div className="text-2xl mb-1">❌</div>
                  <div className="text-sm">Again</div>
                  <div className="text-xs text-slate-400 mt-1">&lt;1m</div>
                </button>

                <button
                  onClick={() => handleAnswer(1)}
                  className="px-4 py-6 bg-orange-500/20 hover:bg-orange-500 border-2 border-orange-500/30 hover:border-orange-500 rounded-xl font-bold transition-all"
                >
                  <div className="text-2xl mb-1">😕</div>
                  <div className="text-sm">Hard</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {currentCard.review.interval < 1 ? '1d' : `${Math.round(currentCard.review.interval * 1.2)}d`}
                  </div>
                </button>

                <button
                  onClick={() => handleAnswer(2)}
                  className="px-4 py-6 bg-emerald-500/20 hover:bg-emerald-500 border-2 border-emerald-500/30 hover:border-emerald-500 rounded-xl font-bold transition-all"
                >
                  <div className="text-2xl mb-1">✓</div>
                  <div className="text-sm">Good</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {currentCard.review.repetitions === 0 ? '1d' : currentCard.review.repetitions === 1 ? '6d' : `${Math.round(currentCard.review.interval * currentCard.review.easeFactor)}d`}
                  </div>
                </button>

                <button
                  onClick={() => handleAnswer(3)}
                  className="px-4 py-6 bg-blue-500/20 hover:bg-blue-500 border-2 border-blue-500/30 hover:border-blue-500 rounded-xl font-bold transition-all"
                >
                  <div className="text-2xl mb-1">😊</div>
                  <div className="text-sm">Easy</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {currentCard.review.repetitions === 0 ? '4d' : `${Math.round(currentCard.review.interval * currentCard.review.easeFactor * 1.3)}d`}
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
}
