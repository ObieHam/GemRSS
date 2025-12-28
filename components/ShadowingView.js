import { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Pause, RotateCcw, ChevronRight, Search, Layout, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function ShadowingView({ settings, onSuccessFlash }) {
  const [widget, setWidget] = useState(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [query, setQuery] = useState("courage");
  const [userInput, setUserInput] = useState("");
  const [currentCaption, setCurrentCaption] = useState("");
  const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect'
  const [isInputMode, setIsInputMode] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(false);

  const successAudio = useRef(null);
  const failureAudio = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Load sounds from public folder
    successAudio.current = new Audio('/success.mp3');
    failureAudio.current = new Audio('/failure.mp3');

    // Load YouGlish API script
    const script = document.createElement('script');
    script.src = "https://youglish.com/public/emb/widget.js";
    script.async = true;
    document.body.appendChild(script);

    window.onYouglishAPIReady = () => setIsApiReady(true);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      delete window.onYouglishAPIReady;
    };
  }, []);

  useEffect(() => {
    if (isApiReady && !widget) {
      const ygWidget = new YG.Widget("yg-shadow-widget", {
        width: "100%",
        components: 1, // Only video component
        events: {
          'onCaptionChange': (event) => {
            // Clean markers and trim
            const clean = event.caption.replace(/\[\[\[|\]\]\]/g, "").trim();
            const wordCount = clean.split(/\s+/).length;
            
            // Only capture segments with 10 words or fewer for practice
            if (wordCount <= 10 && wordCount > 0) {
              setCurrentCaption(clean);
            }
          },
          'onCaptionConsumed': () => {
            if (currentCaption) {
              widget?.pause();
              setIsInputMode(true);
              setTimeout(() => inputRef.current?.focus(), 150);
            }
          },
          'onFetchDone': () => setLoading(false)
        }
      });
      setWidget(ygWidget);
    }
  }, [isApiReady, widget, currentCaption]);

  const handleSearch = () => {
    if (!widget || !query.trim()) return;
    setLoading(true);
    setFeedback(null);
    setIsInputMode(false);
    setUserInput("");
    widget.fetch(query, "english", settings.accent || "us");
  };

  const checkAnswer = () => {
    const cleanUser = userInput.toLowerCase().replace(/[.,!?;:]/g, "").trim();
    const cleanCorrect = currentCaption.toLowerCase().replace(/[.,!?;:]/g, "").trim();

    if (cleanUser === cleanCorrect) {
      setFeedback('correct');
      if (onSuccessFlash) onSuccessFlash();
      successAudio.current.play().catch(() => {});
    } else {
      setFeedback('incorrect');
      failureAudio.current.play().catch(() => {});
    }
  };

  const nextTrack = () => {
    setFeedback(null);
    setIsInputMode(false);
    setUserInput("");
    widget?.next();
  };

  const renderComparison = () => {
    const correctWords = currentCaption.split(/\s+/);
    const userWords = userInput.split(/\s+/);
    const max = Math.max(correctWords.length, userWords.length);

    return (
      <div className="flex flex-wrap gap-4 justify-center mt-6">
        {Array.from({ length: max }).map((_, i) => {
          const isMatch = userWords[i]?.toLowerCase().replace(/[.,!?;:]/g, "") === 
                          correctWords[i]?.toLowerCase().replace(/[.,!?;:]/g, "");
          return (
            <div key={i} className="flex flex-col items-center">
              <span className={`text-xl font-black ${isMatch ? 'text-emerald-400' : 'text-red-400 border-b-2 border-red-500'}`}>
                {userWords[i] || "___"}
              </span>
              <span className="text-slate-500 text-[10px] mt-1 uppercase font-bold tracking-wider">
                {correctWords[i] || ""}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <Layout className="text-indigo-400" /> Shadowing View
        </h2>
        <div className="flex gap-2">
          {[0.5, 0.75, 1, 1.25].map(r => (
            <button 
              key={r}
              onClick={() => { widget?.setSpeed(r); setSpeed(r); }}
              className={`px-3 py-1 rounded-lg text-[10px] font-black border transition-all ${speed === r ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
              {r}x
            </button>
          ))}
        </div>
      </header>

      <div className="flex gap-3">
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search for a word or phrase to shadow..." 
          className="flex-1 bg-slate-900 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-indigo-500"
        />
        <button onClick={handleSearch} disabled={loading} className="bg-indigo-600 px-8 rounded-2xl font-bold text-white hover:bg-indigo-500 transition-all flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />} Start
        </button>
      </div>

      <div className="bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl relative aspect-video">
        <div id="yg-shadow-widget"></div>
        
        {isInputMode && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center z-10">
            {!feedback ? (
              <div className="w-full max-w-2xl space-y-6">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Type what you just heard</p>
                <textarea
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                  className="w-full bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl text-2xl font-bold text-white outline-none focus:border-indigo-500 text-center"
                  rows={2}
                />
                <div className="flex gap-4">
                  <button onClick={() => { widget?.replay(); setIsInputMode(false); }} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black flex items-center justify-center gap-2">
                    <RotateCcw size={18}/> Replay
                  </button>
                  <button onClick={checkAnswer} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black">
                    Check Answer
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8 w-full max-w-3xl">
                {feedback === 'correct' ? (
                  <div className="flex flex-col items-center animate-bounce">
                    <CheckCircle size={64} className="text-emerald-500 mb-4" />
                    <h3 className="text-4xl font-black text-white">Well Done!</h3>
                  </div>
                ) : (
                  <div>
                    <XCircle size={64} className="text-red-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-black text-white mb-6">Comparison</h3>
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                      {renderComparison()}
                    </div>
                  </div>
                )}
                <div className="flex gap-4 max-w-md mx-auto">
                  <button onClick={() => { setFeedback(null); widget?.replay(); setIsInputMode(false); }} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-bold">Try Again</button>
                  <button onClick={nextTrack} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2">
                    Next <ChevronRight size={18}/>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
