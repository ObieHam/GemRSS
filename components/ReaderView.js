import { useState, useEffect, useRef } from 'react';
import { Upload, Loader2, X, ChevronLeft, ChevronRight, Volume2, Plus, Minus, LogOut, ZoomIn, ZoomOut } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../lib/storage';
import { COMMON_WORDS } from '../lib/constants';
import { isValidWord } from '../lib/utils';
import { fetchDefinition } from '../lib/apiService';

export default function ReaderView({ settings, loadWords, onExit }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [textItems, setTextItems] = useState([]);
  const [viewport, setViewport] = useState(null);
  const [highlightedWords, setHighlightedWords] = useState([]);
  const [definitionPanel, setDefinitionPanel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1.0); // Zoom state

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Reset zoom when changing pages
  useEffect(() => {
      setScaleFactor(1.0);
  }, [currentPage]);

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
      setScaleFactor(1.0);
    } catch (err) {
      console.error(err);
      alert('Error loading PDF');
    } finally {
      setLoading(false);
    }
  };

  const renderPage = async (pageNum) => {
    if (!pdfDoc || !containerRef.current) return;
    setLoading(true);
    try {
      const page = await pdfDoc.getPage(pageNum);
      
      // FIX: Calculate scale based on width to maximize size, then apply zoom factor
      const containerWidth = containerRef.current.clientWidth - 40; // account for scrollbar/padding
      const unscaledViewport = page.getViewport({ scale: 1 });
      const baseScale = containerWidth / unscaledViewport.width;
      const finalScale = baseScale * scaleFactor;
      
      const outputScale = window.devicePixelRatio || 1;
      const vp = page.getViewport({ scale: finalScale });
      setViewport(vp);

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = Math.floor(vp.width * outputScale);
      canvas.height = Math.floor(vp.height * outputScale);
      canvas.style.width = Math.floor(vp.width) + "px";
      canvas.style.height = Math.floor(vp.height) + "px";

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
      await page.render({ canvasContext: context, viewport: vp, transform }).promise;

      // Extract Text
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, currentPage, scaleFactor]); // Re-render on zoom change

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

  const changeZoom = (delta) => {
      setScaleFactor(prev => Math.max(0.5, Math.min(3.0, prev + delta)));
  };

  return (
    <div className="flex h-screen w-full bg-[#0f172a] relative overflow-hidden">
      
      {/* Exit Button */}
      <button onClick={onExit} className="absolute top-6 left-6 z-50 p-3 bg-slate-900/80 backdrop-blur hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition-all">
        <LogOut size={20} />
      </button>

      {/* Main Reader Container - Maximized space */}
      <div ref={containerRef} className="flex-grow h-full overflow-auto scrollbar-hide relative flex flex-col items-center py-8">
        {!pdfDoc ? (
          <div className="w-full max-w-4xl mt-32 text-center px-4">
            <h2 className="text-5xl font-black mb-8 text-white">Immersive Reader</h2>
            <div className="bg-slate-900/50 border-2 border-slate-700/50 backdrop-blur-xl rounded-3xl p-12">
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf" />
              <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="inline-flex items-center gap-4 px-10 py-5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-xl text-white transition-all shadow-lg shadow-indigo-600/20">
                {loading ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />} Open PDF Document
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Render Area */}
            <div className="relative shadow-2xl bg-white mx-auto rounded-sm overflow-hidden my-auto" style={{ width: viewport?.width, height: viewport?.height }}>
              <canvas ref={canvasRef} className="block" />
              <div className="absolute inset-0 select-none">
                {viewport && textItems.map((item, idx) => {
                  const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
                  const fontSize = Math.sqrt(item.transform[0]**2 + item.transform[1]**2) * viewport.scale;
                  return (
                    <div key={idx} className="absolute whitespace-pre leading-none flex" style={{ left: tx[4], top: tx[5] - fontSize, fontSize: `${fontSize}px`, height: fontSize, color: 'transparent' }}>
                      {item.str.split(/(\s+)/).map((token, tIdx) => {
                        const isWord = /^[a-zA-Z]{3,}$/.test(token);
                        const isHigh = highlightedWords.includes(token.toLowerCase());
                        return (
                          <span key={tIdx} onClick={() => isWord && handleWordClick(token)} onContextMenu={(e) => { e.preventDefault(); if(isWord) handleWordClick(token, true); }}
                            className={`cursor-pointer transition-colors ${isHigh ? 'bg-amber-400/25 border-b-2 border-amber-500/50' : 'hover:bg-indigo-500/20'}`}>{token}</span>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Floating Bottom Controls Bar */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl p-2 rounded-full border border-slate-700/50 shadow-2xl">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-3 hover:bg-slate-800 text-slate-200 rounded-full disabled:opacity-50 transition-all"><ChevronLeft size={20} /></button>
              <span className="px-4 font-bold text-slate-200 min-w-[100px] text-center">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-3 hover:bg-slate-800 text-slate-200 rounded-full disabled:opacity-50 transition-all mr-4"><ChevronRight size={20} /></button>
              
              <div className="h-6 w-px bg-slate-700"></div>

              {/* Zoom Controls */}
              <button onClick={() => changeZoom(-0.25)} className="p-3 hover:bg-slate-800 text-slate-200 rounded-full transition-all ml-2"><ZoomOut size={20} /></button>
              <input 
                  type="range" 
                  min="0.5" 
                  max="3.0" 
                  step="0.25" 
                  value={scaleFactor} 
                  onChange={(e) => setScaleFactor(parseFloat(e.target.value))}
                  className="w-24 accent-indigo-500"
              />
              <button onClick={() => changeZoom(0.25)} className="p-3 hover:bg-slate-800 text-slate-200 rounded-full transition-all"><ZoomIn size={20} /></button>
            </div>
          </>
        )}
      </div>

      {/* Definition Sidebar - Fixed height container with internal scroll */}
      {definitionPanel && (
        <div className="h-full w-[400px] bg-slate-950/95 backdrop-blur border-l border-slate-800 flex flex-col shadow-2xl z-20 shrink-0">
          {/* Fixed Header */}
          <div className="flex justify-between items-start p-8 pb-4 border-b border-slate-800/50 bg-slate-950">
            <h3 className="text-3xl font-black text-white capitalize break-words max-w-[250px]">{definitionPanel.word}</h3>
            <button onClick={() => setDefinitionPanel(null)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"><X size={24} /></button>
          </div>
          
          {/* Scrollable Content Area */}
          <div className="flex-grow overflow-y-auto p-8 custom-scrollbar relative">
            {definitionPanel.loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="animate-spin text-indigo-500" size={40} />
              </div>
            ) : definitionPanel.error ? (
               <div className="text-red-400 text-center mt-10 font-medium">{definitionPanel.error}</div>
            ) : (
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Definition</p>
                  <p className="text-slate-200 text-lg leading-relaxed font-medium">{definitionPanel.definition}</p>
                </div>
                {definitionPanel.example && (
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Example Context</p>
                    <blockquote className="text-slate-400 italic border-l-2 border-slate-700 pl-4 py-2">"{definitionPanel.example}"</blockquote>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fixed Footer Actions */}
          {!definitionPanel.loading && !definitionPanel.error && (
             <div className="p-6 border-t border-slate-800/50 bg-slate-950 space-y-3">
                <button onClick={() => playAudio(definitionPanel)} className="w-full flex items-center justify-center gap-3 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white transition-all border border-slate-700">
                  <Volume2 size={20} /> Play Audio
                </button>
                
                {!settings.autoSave && (
                  <button onClick={addToLibrary} className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black text-white transition-all shadow-lg shadow-indigo-600/20">
                    <Plus size={20} /> Add to Library
                  </button>
                )}
              </div>
          )}
        </div>
      )}
    </div>
  );
}
