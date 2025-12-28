import { useState, useEffect, useRef } from 'react';
import { Layout, Play, RotateCcw, ChevronRight, Dice5, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

// Curated library using high-quality educational channels (BBC/TED) 
// These IDs are generally more stable and allow embedding on localhost.
const SHADOWING_LIBRARY = [
  {
    id: '_Z0ZQTmCQvA', // BBC Learning English
    title: 'Daily English: At the Office',
    segments: [
      { start: 5, end: 11, text: "I'm sorry I'm late, the traffic was terrible." },
      { start: 12, end: 18, text: "Don't worry about it, we're just getting started." },
      { start: 20, end: 27, text: "Could you please send me that report by the end of the day?" }
    ]
  },
  {
    id: 'GfR97_P-zL0', // Productivity/Habits
    title: 'Success and Daily Routine',
    segments: [
      { start: 45, end: 51, text: "The secret of your future is hidden in your daily routine." },
      { start: 54, end: 62, text: "Small improvements every day lead to exceptional results." },
      { start: 70, end: 77, text: "Consistency is more important than intensity." }
    ]
  },
  {
    id: 'qPYzyfMTv7Y', // VOA Learning English
    title: 'Technology Trends',
    segments: [
      { start: 15, end: 22, text: "Artificial intelligence is changing how we live and work." },
      { start: 25, end: 32, text: "The best way to predict the future is to create it." }
    ]
  }
];

export default function ShadowingView({ settings, onSuccessFlash }) {
  const [player, setPlayer] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(SHADOWING_LIBRARY[0]);
  const [currentSegIdx, setCurrentSegIdx] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect'
  const [isInputMode, setIsInputMode] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState(null);

  const successAudio = useRef(null);
  const failureAudio = useRef(null);
  const inputRef = useRef(null);
  const monitorRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    successAudio.current = new Audio('/success.mp3');
    failureAudio.current = new Audio('/failure.mp3');

    // Load YouTube IFrame API with explicit HTTPS
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => setIsApiReady(true);
    } else {
      setIsApiReady(true);
    }

    return () => clearInterval(monitorRef.current);
  }, []);

  useEffect(() => {
    if (isApiReady && !playerRef.current) {
      const newPlayer = new window.YT.Player('yt-shadow-player', {
        height: '100%',
        width: '100%',
        videoId: currentVideo.id,
        playerVars: { 
          controls: 0, 
          modestbranding: 1, 
          rel: 0, 
          disablekb: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : '', // Critical for fixing "Unavailable"
          enablejsapi: 1
        },
        events: {
          'onReady': (event) => {
            playerRef.current = event.target;
            setPlayer(event.target);
          },
          'onStateChange': (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              startMonitoring();
            } else {
              clearInterval(monitorRef.current);
            }
          },
          'onError': (event) => {
            console.error("YouTube Player Error:", event.data);
            setError("This video is restricted. Skipping to another...");
            setTimeout(pickRandomVideo, 2000);
          }
        }
      });
    }
  }, [isApiReady]);

  const startMonitoring = () => {
    clearInterval(monitorRef.current);
    const segment = currentVideo.segments[currentSegIdx];
    monitorRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime() >= segment.end) {
        playerRef.current.pauseVideo();
        setIsInputMode(true);
        clearInterval(monitorRef.current);
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    }, 100);
  };

  const playSegment = () => {
    if (!playerRef.current) return;
    const segment = currentVideo.segments[currentSegIdx];
    setFeedback(null);
    setIsInputMode(false);
    setUserInput("");
    setError(null);
    playerRef.current.seekTo(segment.start);
    playerRef.current.playVideo();
  };

  const pickRandomVideo = () => {
    const others = SHADOWING_LIBRARY.filter(v => v.id !== currentVideo.id);
    const random = others[Math.floor(Math.random() * others.length)];
    setCurrentVideo(random);
    setCurrentSegIdx(0);
    setFeedback(null);
    setIsInputMode(false);
    setUserInput("");
    setError(null);
    if (playerRef.current) {
      playerRef.current.loadVideoById(random.id);
    }
  };

  const checkAnswer = () => {
    if (!userInput.trim()) return;
    const cleanUser = userInput.toLowerCase().replace(/[.,!?;:]/g, "").trim();
    const cleanCorrect = currentVideo.segments[currentSegIdx].text.toLowerCase().replace(/[.,!?;:]/g, "").trim();

    if (cleanUser === cleanCorrect) {
      setFeedback('correct');
      if (onSuccessFlash) onSuccessFlash();
      successAudio.current.play().catch(() => {});
    } else {
      setFeedback('incorrect');
      failureAudio.current.play().catch(() => {});
    }
  };

  const nextSegment = () => {
    setFeedback(null);
    setIsInputMode(false);
    setUserInput("");
    if (currentSegIdx + 1 < currentVideo.segments.length) {
      setCurrentSegIdx(prev => prev + 1);
    } else {
      pickRandomVideo();
    }
  };

  const renderComparison = () => {
    const correctWords = currentVideo.segments[currentSegIdx].text.split(/\s+/);
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
          {[0.5, 0.75, 1].map(r => (
            <button 
              key={r}
              onClick={() => { playerRef.current?.setPlaybackRate(r); setSpeed(r); }}
              className={`px-3 py-1 rounded-lg text-[10px] font-black border transition-all ${speed === r ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
              {r}x
            </button>
          ))}
        </div>
      </header>

      <div className="flex gap-3">
        <button 
          onClick={playSegment} 
          disabled={!isApiReady}
          className="flex-1 bg-indigo-600 py-4 rounded-2xl font-black text-white hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
        >
          <Play size={20} fill="currentColor" /> Listen to Segment
        </button>
        <button 
          onClick={pickRandomVideo} 
          className="bg-slate-800 border-2 border-slate-700 px-8 rounded-2xl font-bold text-white hover:bg-slate-700 transition-all flex items-center gap-2"
        >
          <Dice5 size={20} /> Next Video
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl relative aspect-video min-h-[300px]">
        <div id="yt-shadow-player" className="pointer-events-none w-full h-full"></div>
        
        {!isInputMode && !feedback && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
             {!player && <Loader2 className="animate-spin text-indigo-500" size={48} />}
          </div>
        )}

        {isInputMode && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 z-10">
            {!feedback ? (
              <div className="w-full max-w-2xl space-y-6">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs text-center">Type exactly what you heard</p>
                <textarea
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                  className="w-full bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl text-2xl font-bold text-white outline-none focus:border-indigo-500 text-center"
                  rows={2}
                  placeholder="..."
                />
                <div className="flex gap-4">
                  <button onClick={playSegment} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black flex items-center justify-center gap-2">
                    <RotateCcw size={18}/> Listen Again
                  </button>
                  <button onClick={checkAnswer} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black">Check</button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-8 animate-in zoom-in-95 w-full max-w-2xl">
                {feedback === 'correct' ? (
                  <CheckCircle size={80} className="text-emerald-500 mx-auto" />
                ) : (
                  <div>
                    <XCircle size={80} className="text-red-500 mx-auto mb-4" />
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                      {renderComparison()}
                    </div>
                  </div>
                )}
                <h3 className="text-4xl font-black text-white">{feedback === 'correct' ? 'Well Done!' : 'Not Quite'}</h3>
                <div className="flex gap-4 justify-center">
                  <button onClick={playSegment} className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-bold">Retry</button>
                  <button onClick={nextSegment} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2">
                    Next {currentSegIdx + 1 < currentVideo.segments.length ? 'Segment' : 'Video'} <ChevronRight size={18}/>
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
