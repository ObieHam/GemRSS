import { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Pause, RotateCcw, ChevronRight, Search, Layout, CheckCircle, XCircle, Loader2, Dice5, AlertCircle } from 'lucide-react';

const RANDOM_TOPICS = [
  "courage", "happiness", "technology", "nature", "science", 
  "travel", "cooking", "history", "space", "leadership", 
  "innovation", "education", "environment", "art"
];

// Valid accents for YouGlish English
const VALID_ACCENTS = ["us", "uk", "aus", "ca", "ie", "sco", "nz"];

export default function ShadowingView({ settings, onSuccessFlash }) {
  const [widget, setWidget] = useState(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [query, setQuery] = useState("");
  const [userInput, setUserInput] = useState("");
  const [currentCaption, setCurrentCaption] = useState("");
  const [feedback, setFeedback] = useState(null); 
  const [isInputMode, setIsInputMode] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const successAudio = useRef(null);
  const failureAudio = useRef(null);
  const inputRef = useRef(null);
  const widgetInstance = useRef(null);

  useEffect(() => {
    successAudio.current = new Audio('/success.mp3');
    failureAudio.current = new Audio('/failure.mp3');

    // Load API script
    const script = document.createElement('script');
    script.src = "https://youglish.com/public/emb/widget.js";
    script.async = true;
    document.body.appendChild(script);

    window.onYouglishAPIReady = () => {
      setIsApiReady(true);
    };

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      delete window.onYouglishAPIReady;
    };
  }, []);

  // Initialize Widget
  useEffect(() => {
    if (isApiReady && !widgetInstance.current) {
      try {
        const ygWidget = new YG.Widget("yg-shadow-widget", {
          width: "100%",
          components: 9, // Using 9 (Player + Captions) as it's most stable for data
          events: {
            'onCaptionChange': (event) => {
              const clean = event.caption.replace(/\[\[\[|\]\]\]/g, "").trim();
              const wordCount = clean.split(/\s+/).length;
              // Filter for manageable segments (shadowing)
              if (wordCount <= 10 && wordCount > 0) {
                setCurrentCaption(clean);
              }
            },
            'onCaptionConsumed': () => {
              if (currentCaption) {
                widgetInstance.current?.pause();
                setIsInputMode(true);
                setTimeout(() => inputRef.current?.focus(), 150);
              }
            },
            'onFetchDone': (event) => {
              setLoading(false);
              setError(null);
              if (event.totalResult === 0) {
                setError("No videos found for this topic.");
              }
            },
            'onError': (event) => {
              setLoading(false);
              console.error("YouGlish Error:", event);
              setError("Video load error. Skipping...");
              // Attempt to recover by picking another random video after a short delay
              setTimeout(() => fetchRandom(), 2000);
            }
          }
        });
        widgetInstance.current = ygWidget;
        setWidget(ygWidget);
      } catch (err) {
        console.error("Widget Init Error:", err);
      }
    }
  }, [isApiReady, currentCaption]);

  const handleSearch = (searchQuery) => {
    const target = searchQuery || query;
    if (!widgetInstance.current || !target.trim()) return;

    setLoading(true);
    setError(null);
    setFeedback(null);
    setIsInputMode(false);
    setUserInput("");

    // Ensure accent is valid or default to 'us'
    const accent = VALID_ACCENTS.includes(settings?.accent?.toLowerCase()) 
      ? settings.accent.toLowerCase() 
      : "us";

    widgetInstance.current.fetch(target, "english", accent);
  };

  const fetchRandom = () => {
    const randomTopic = RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
    setQuery(randomTopic);
    handleSearch(randomTopic);
  };

  const checkAnswer = () => {
    if (!userInput.trim()) return;
    
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
    widgetInstance.current?.next();
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
          <Layout className="text-indigo-400" /> Shadowing Practice
        </h2>
        <div className="flex gap-2">
          {[0.5, 0.75, 1, 1.25].map(r => (
            <button 
              key={r}
              onClick={() => { widgetInstance.current?.setSpeed(r); setSpeed(r); }}
              className={`px-3 py-1 rounded-lg text-[10px] font-black border transition-all ${speed === r ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
              {r}x
            </button>
          ))}
        </div>
      </header>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Type a word to shadow..." 
            className="w-full bg-slate-900 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-indigo-500 pl-12"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        </div>
        <button 
          onClick={() => handleSearch()} 
          disabled={loading || !isApiReady} 
          className="bg-indigo-600 px-6 rounded-2xl font-bold text-white hover:bg-indigo-500 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Search"}
        </button>
        <button 
          onClick={fetchRandom} 
          disabled={loading || !isApiReady} 
          className="bg-slate-800 border-2 border-slate-700 px-6 rounded-2xl font-bold text-white hover:bg-slate-700 transition-all flex items-center gap-2" 
          title="Random Video"
        >
          <Dice5 size={20} /> Random
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl relative aspect-video">
        <div id="yg-shadow-widget" className="w-full h-full"></div>
        
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
                  <button onClick={() => { widgetInstance.current?.replay(); setIsInputMode(false); }} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black flex items-center justify-center gap-2">
                    <RotateCcw size={18}/> Listen Again
                  </button>
                  <button onClick={checkAnswer} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black">
                    Check
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
                  <button onClick={() => { setFeedback(null); widgetInstance.current?.replay(); setIsInputMode(false); }} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-bold">Retry</button>
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
