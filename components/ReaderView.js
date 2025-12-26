import { useState, useEffect, useRef } from 'react';
import { Upload, Loader2, X, ChevronLeft, ChevronRight, Volume2, Plus, Info } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../lib/storage';
import { COMMON_WORDS } from '../lib/constants';
import { isValidWord } from '../lib/utils';
import { fetchDefinition } from '../lib/apiService';

export default function ReaderView({ settings, loadWords, words }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [textItems, setTextItems] = useState([]);
  const [viewport, setViewport] = useState(null);
  const [highlightedWords, setHighlightedWords] = useState([]);
  const [definitionPanel, setDefinitionPanel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') return;
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      alert('Error loading PDF');
    } finally {
      setLoading(false);
    }
  };

  const renderPage = async (pageNum) => {
    if (!pdfDoc) return;
    setLoading(true);
    try {
      const page = await pdfDoc.getPage(pageNum);
      
      // Calculate responsive scale to fit side-by-side view
      const containerWidth = containerRef.current.clientWidth - 64;
      const containerHeight = containerRef.current.clientHeight - 64;
      const unscaledViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(containerWidth / unscaledViewport.width, containerHeight / unscaledViewport.height);
      
      // FIX: Use devicePixelRatio for crisp text on scientific papers
      const outputScale = window.devicePixelRatio || 1;
      const vp = page.getViewport({ scale: scale });
      setViewport(vp);

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = Math.floor(vp.width * outputScale);
      canvas.height = Math.floor(vp.height * outputScale);
      canvas.style.width = Math.floor(vp.width) + "px";
      canvas.style.height = Math.floor(vp.height) + "px";

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
      await page.render({ canvasContext: context, viewport: vp, transform }).promise;

      // Extract Text and match alignment
      const textContent = await page.getTextContent();
      setTextItems(textContent.items);
      
      const pageText = textContent.items.map(item => item.str).join(' ');
      const tokens = pageText.match(/\b[a-zA-Z]{4,}\b/g) || [];
      const newWords = [];
      const allWordsInLib = await db.vocabulary.toArray();

      for (const token of tokens) {
        const lower = token.toLowerCase();
        if (COMMON_WORDS.has(lower)) continue;
        if (isValidWord(lower) && !allWordsInLib.find(w => w.word === lower)) {
            newWords.push(lower);
        }
      }
      setHighlightedWords([...new Set(newWords)]);
    } catch (err) {
      console.error('Render error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pdfDoc) renderPage(currentPage);
  }, [pdfDoc, currentPage]);

  const playAudio = (info) => {
    if (settings.apiSource === 'free-dictionary' && info.phonetics) {
      const accentMap = { us: '-us', uk: '-uk', au: '-au' };
      const preferredAudio = info.phonetics.find(p => p.audio && p.audio.includes(accentMap[settings.accent]));
      const audioUrl = preferredAudio?.audio || info.phonetics.find(p => p.audio)?.audio;
      if (audioUrl) new Audio(audioUrl).play().catch(() => {});
    } else if (info.audioUrl) {
      new Audio(info.audioUrl).play().catch(() => {});
    }
  };

  const handleWordClick = async (word, isRightClick = false) => {
    const cleanWord = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
    if (!cleanWord || cleanWord.length < 3) return;

    setDefinitionPanel({ loading: true, word: cleanWord });
    try {
      const info = await fetchDefinition(cleanWord, settings);
      if (info.error) {
        setDefinitionPanel({ error: info.error, word: cleanWord });
        return;
      }
      setDefinitionPanel(info);
      
      // RESTORED: Automatic pronunciation
      playAudio(info);

      if (settings.autoSave && !isRightClick) {
        const exists = await db.vocabulary.where('word').equals(info.word).first();
        if (!exists) {
          await db.vocabulary.add(info);
          await loadWords();
        }
      }
    } catch (e) {
      setDefinitionPanel({ error: 'Definition error', word: cleanWord });
    }
  };

  const addToLibrary = async () => {
    if (definitionPanel && !definitionPanel.loading && !definitionPanel.error) {
      const exists = await db.vocabulary.where('word').equals(definitionPanel.word).first();
      if (!exists) {
        await db.vocabulary.add(definitionPanel);
        await loadWords();
        setHighlightedWords(prev => prev.filter(w => w !== definitionPanel.word));
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f172a]">
      <div ref={containerRef} className="flex-grow p-6 flex flex-col items-center overflow-y-auto scrollbar-hide">
        {!pdfDoc ? (
          <div className="w-full max-w-4xl mt-20 text-center">
            <h2 className="text-5xl font-black mb-8 text-white">Interactive PDF Reader</h2>
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-12">
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf" />
              <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="inline-flex items-center gap-4 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 rounded-2xl font-bold text-lg text-white transition-all">
                {loading ? <Loader2 className="animate-spin" /> : <Upload />} Select Scientific Paper
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Header Controls */}
            <div className="sticky top-0 z-10 flex items-center justify-between mb-6 bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-slate-700 w-full shadow-xl">
              <div className="flex items-center gap-4">
                <span className="text-white font-black uppercase tracking-widest text-[10px]">Page {currentPage} / {totalPages}</span>
                {showHint && (
                  <div className="flex items-center gap-2 bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-xl border border-indigo-500/30 text-[10px] font-black uppercase">
                    Right-click for no-save lookup <X size={12} className="cursor-pointer ml-1" onClick={() => setShowHint(false)} />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"><ChevronLeft size={18} /></button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"><ChevronRight size={18} /></button>
              </div>
            </div>

            {/* Render Area */}
            <div className="relative shadow-2xl bg-white mx-auto overflow-hidden rounded-sm" style={{ width: viewport?.width, height: viewport?.height }}>
              <canvas ref={canvasRef} className="block" />
              
              {/* Interactive Layer with Precise Alignment */}
              <div className="absolute inset-0 select-none">
                {viewport && textItems.map((item, idx) => {
                  const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
                  const fontSize = Math.sqrt(item.transform[0]**2 + item.transform[1]**2) * viewport.scale;
                  
                  return (
                    <div 
                      key={idx}
                      className="absolute whitespace-pre leading-none flex"
                      style={{ left: tx[4], top: tx[5] - fontSize, fontSize: `${fontSize}px`, height: fontSize, color: 'transparent' }}
                    >
                      {item.str.split(/(\s+)/).map((token, tIdx) => {
                        const isWord = /^[a-zA-Z]{3,}$/.test(token);
                        const isHigh = highlightedWords.includes(token.toLowerCase());
                        return (
                          <span 
                            key={tIdx} 
                            onClick={() => isWord && handleWordClick(token)}
                            onContextMenu={(e) => { e.preventDefault(); if(isWord) handleWordClick(token, true); }}
                            className={`cursor-pointer transition-colors ${isHigh ? 'bg-amber-400/25 border-b-2 border-amber-500/50 rounded-sm' : 'hover:bg-indigo-500/20'}`}
                          >
                            {token}
                          </span>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RESTORED: Definition Sidebar with full features */}
      {definitionPanel && (
        <div className="w-96 bg-slate-950 border-l border-slate-800 p-8 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-white capitalize">{definitionPanel.word}</h3>
            <button onClick={() => setDefinitionPanel(null)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400"><X /></button>
          </div>
          
          {definitionPanel.loading ? (
            <div className="flex-grow flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
            </div>
          ) : (
            <div className="space-y-10 flex-grow flex flex-col">
              <div className="space-y-6 flex-grow">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Definition</p>
                  <p className="text-slate-200 text-lg leading-relaxed">{definitionPanel.definition}</p>
                </div>
                {definitionPanel.example && (
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">In Context</p>
                    <p className="text-slate-400 italic">"{definitionPanel.example}"</p>
                  </div>
                )}
              </div>

              {/* RESTORED: Add Word and Pronunciation Actions */}
              <div className="space-y-4 pt-8 border-t border-slate-800/50">
                <button 
                  onClick={() => playAudio(definitionPanel)}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold text-white transition-all border border-slate-700"
                >
                  <Volume2 size={20} />
                  Play Pronunciation
                </button>
                
                {!settings.autoSave && (
                  <button 
                    onClick={addToLibrary}
                    className="w-full flex items-center justify-center gap-3 py-5 bg-indigo-500 hover:bg-indigo-600 rounded-2xl font-black text-white transition-all shadow-xl shadow-indigo-500/10"
                  >
                    <Plus size={20} />
                    Add to Library
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
