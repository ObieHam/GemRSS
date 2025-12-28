import { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Pause, RotateCcw, ChevronRight, Layout, CheckCircle, XCircle, Loader2, Dice5, SkipForward } from 'lucide-react';

// Curated library of shadowing content with transcripts
// You can expand this list with more video IDs and their transcripts
const SHADOWING_LIBRARY = [
  {
    id: '7v4S-6vR3YI',
    title: 'The Art of Purpose',
    segments: [
      { start: 12, end: 18, text: "Success is not the key to happiness." },
      { start: 19, end: 25, text: "Happiness is the key to success." },
      { start: 26, end: 32, text: "If you love what you are doing, you will be successful." }
    ]
  },
  {
    id: 'GfR97_P-zL0',
    title: 'Daily Habits',
    segments: [
      { start: 45, end: 52, text: "The secret of your future is hidden in your daily routine." },
      { start: 55, end: 63, text: "Small improvements every day lead to exceptional results." },
      { start: 70, end: 78, text: "Consistency is more important than intensity." }
    ]
  },
  {
    id: 'w77zPAtVTuI',
    title: 'Tech and Innovation',
    segments: [
      { start: 10, end: 18, text: "The best way to predict the future is to create it." },
      { start: 20, end: 28, text: "Innovation distinguishes between a leader and a follower." },
      { start: 35, end: 43, text: "Stay hungry, stay foolish." }
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
  const [speed, setSpeed] = useState(1);
  const [isApiReady, setIsApiReady] = useState(false);

  const successAudio = useRef(null);
  const failureAudio = useRef(null);
  const inputRef = useRef(null);
  const checkInterval = useRef(null);

  useEffect(() => {
    successAudio.current = new Audio('/success.mp3');
    failureAudio.current = new Audio('/failure.mp3');

    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => setIsApiReady(true);
    } else {
      setIsApiReady(true);
    }

    return () => clearInterval(checkInterval.current);
  }, []);

  useEffect(() => {
    if (isApiReady && !player) {
      const newPlayer = new window.YT.Player('yt-player', {
        height: '100%',
        width: '100%',
        videoId: currentVideo.id,
        playerVars: {
          controls: 0, // Hide YouTube controls for a cleaner shadowing look
          disablekb: 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          'onReady': (event) => setPlayer(event.target),
          'onStateChange': (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              startSegmentMonitor();
            } else {
              clearInterval(checkInterval.current);
            }
          }
        }
      });
    }
  }, [isApiReady, player, currentVideo]);

  const startSegmentMonitor = () => {
    clearInterval(checkInterval.current);
    const segment = currentVideo.segments[currentSegIdx];
    
    checkInterval.current = setInterval(() => {
      if (!player) return;
      const currentTime = player.getCurrentTime();
      if (currentTime >= segment.end) {
        player.pauseVideo();
        setIsInputMode(true);
        clearInterval(checkInterval.current);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }, 100);
  };

  const playCurrentSegment = () => {
    if (!player) return;
    const segment = currentVideo.segments[currentSegIdx];
    setFeedback(null);
    setIsInputMode(false);
    setUserInput("");
    player.seekTo(segment.start);
    player.playVideo();
  };

  const pickRandomVideo = () => {
    const others = SHADOWING_LIBRARY.filter(v => v.id !== currentVideo.id);
    const random = others[Math.floor(Math.random() * others.length)];
    setCurrentVideo(random);
    setCurrentSegIdx(0);
    setFeedback(null);
    setIsInputMode(false);
    setUserInput("");
    if (player) {
      player.loadVideoById(random.id);
    }
  };

  const checkAnswer = () => {
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
      pickRandomVideo(); // If finished segments, pick new video
    }
  };

  const renderComparison = () => {
    const correctText = currentVideo.segments[currentSegIdx].text;
    const correctWords = correctText.split(/\s+/);
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
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Layout className="text-indigo-400" /> Shadowing View
          </h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Currently Playing: {currentVideo.title}</p>
        </div>
        <div className="flex gap-2">
          {[0.5, 0.75, 1, 1.25].map(r => (
            <button 
              key={r}
              onClick={() => { player?.setPlaybackRate(r); setSpeed(r); }}
              className={`px-3 py-1 rounded-lg text-[10px] font-black border transition-all ${speed === r ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
              {r}x
            </button>
          ))}
        </div>
      </header>

      <div className="flex gap-3">
        <button 
          onClick={playCurrentSegment} 
          className="flex-1 bg-indigo-600 py-4 rounded-2xl font-black text-white hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
        >
          <Play size={20} fill="currentColor" /> Start Practice
        </button>
        <button 
          onClick={pickRandomVideo} 
          className="bg-slate-800 border-2 border-slate-700 px-8 rounded-2xl font-bold text-white hover:bg-slate-700 transition-all flex items-center gap-2"
        >
          <Dice5 size={20} /> Random Video
        </button>
      </div>

      <div className="bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl relative aspect-video group">
        <div id="yt-player" className="pointer-events-none"></div>
        
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
                  placeholder="..."
                />
                <div className="flex gap-4">
                  <button onClick={playCurrentSegment} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black flex items-center justify-center gap-2">
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
                  <button onClick={playCurrentSegment} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-bold">Retry</button>
                  <button onClick={nextSegment} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2">
                    {currentSegIdx + 1 < currentVideo.segments.length ? 'Next Segment' : 'Next Video'} <ChevronRight size={18}/>
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
