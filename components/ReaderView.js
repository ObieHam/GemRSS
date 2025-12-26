// components/ReaderView.js
import { useState, useEffect, useRef } from 'react';
import { Upload, Loader2, X, Volume2, Plus, ZoomIn, ZoomOut, LogOut } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../lib/storage';
import { fetchDefinition } from '../lib/apiService';
import { isValidWord } from '../lib/utils';
import { COMMON_WORDS } from '../lib/constants';

// Page component to handle individual canvas rendering for the scrollable list
function PDFPage({ pdfDoc, pageNum, scaleFactor, containerWidth, onWordClick, highlightedWords }) {
  const canvasRef = useRef(null);
  const [textItems, setTextItems] = useState([]);
  const [viewport, setViewport] = useState(null);

  useEffect(() => {
    const render = async () => {
      const page = await pdfDoc.getPage(pageNum);
      const unscaledViewport = page.getViewport({ scale: 1 });
      
      // Auto-calculate base scale to fill the available width
      const baseScale = (containerWidth - 80) / unscaledViewport.width;
      const finalScale = baseScale * scaleFactor;
      
      const vp = page.getViewport({ scale: finalScale });
      setViewport(vp);

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = vp.width * dpr;
      canvas.height = vp.height * dpr;
      canvas.style.width = `${vp.width}px`;
      canvas.style.height = `${vp.height}px`;
      context.scale(dpr, dpr);

      await page.render({ canvasContext: context, viewport: vp }).promise;
      const text = await page.getTextContent();
      setTextItems(text.items);
    };
    if (containerWidth > 0) render();
  }, [pdfDoc, pageNum, scaleFactor, containerWidth]);

  return (
    <div className="relative shadow-2xl bg-white mb-10 mx-auto transition-all duration-500 ease-in-out" style={{ width: viewport?.width, height: viewport?.height }}>
      <canvas ref={canvasRef} className="block" />
      <div className="absolute inset-0 select-none">
        {viewport && textItems.map((item, idx) => {
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const fontSize = Math.sqrt(item.transform[0]**2 + item.transform[1]**2);
          const scaledFontSize = fontSize * viewport.scale;
          
          return (
            <div key={idx} className="absolute whitespace-pre leading-none flex" 
                 style={{ 
                   left: `${tx[4]}px`, 
                   top: `${tx[5]}px`, 
                   fontSize: `${scaledFontSize}px`, 
                   height: `${scaledFontSize}px`, 
                   color: 'transparent',
                   transform: `scaleY(${item.transform[3] < 0 ? -1 : 1})`
                 }}>
              {item.str.split(/(\s+)/).map((token, tIdx) => {
                const lower = token.toLowerCase().replace(/[^a-z]/g, '');
                const isWord = /^[a-zA-Z]{3,}$/.test(token);
                const isSaved = highlightedWords.includes(lower);
                return (
                  <span key={tIdx} onClick={() => isWord && onWordClick(token)} 
                        className={`cursor-pointer transition-colors ${isSaved ? 'bg-amber-400/25 border-b-2 border-amber-500/50' : 'hover:bg-indigo-500/20'}`}>
                    {token}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ReaderView({ settings, loadWords, words, onExit }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scaleFactor, setScaleFactor] = useState(1.0);
  const [definitionPanel, setDefinitionPanel] = useState(null);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  // ResizeObserver detects when the definition sidebar opens/closes and resizes the PDF smoothly
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
    } catch (err) {
      alert('Error loading PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleWordClick = async (word) => {
    const cleanWord = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
    setDefinitionPanel({ loading: true, word: cleanWord });
    const info = await fetchDefinition(cleanWord, settings);
    setDefinitionPanel(info);
    if (settings.autoSave && !info.error) {
      const exists = await db.vocabulary.where('word').equals(info.word).first();
      if (!exists) { await db.vocabulary.add(info); await loadWords(); }
    }
  };

  const playAudio = (info) => {
    const audioUrl = info.phonetics?.find(p => p.audio)?.audio || info.audioUrl;
    if (audioUrl) new Audio(audioUrl).play().catch(() => {});
  };

  return (
    <div className="flex h-full w-full bg-[#0f172a] overflow-hidden">
      
      {/* PDF Scroll Area - Pages are vertically stacked */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-10 scroll-smooth custom-scrollbar relative">
        {!pdfDoc ? (
          <div className="h-full flex flex-col items-center justify-center">
            <h2 className="text-4xl font-black mb-6">Interactive Reader</h2>
            <button onClick={() => fileInputRef.current.click()} className="bg-indigo-600 px-8 py-4 rounded-xl font-bold flex items-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : <Upload />} Open PDF
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf" />
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {Array.from({ length: numPages }, (_, i) => (
              <PDFPage 
                key={i} 
                pdfDoc={pdfDoc} 
                pageNum={i + 1} 
                scaleFactor={scaleFactor} 
                containerWidth={containerWidth}
                onWordClick={handleWordClick}
                highlightedWords={words.map(w => w.word)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Controls */}
      {pdfDoc && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/90 backdrop-blur-xl p-3 px-6 rounded-full border border-slate-700 z-50 shadow-2xl">
           <button onClick={() => setScaleFactor(s => Math.max(0.5, s - 0.1))} className="hover:bg-slate-800 p-2 rounded-full"><ZoomOut size={20}/></button>
           <span className="text-xs font-black w-12 text-center text-slate-300">{Math.round(scaleFactor * 100)}%</span>
           <button onClick={() => setScaleFactor(s => Math.min(2.0, s + 0.1))} className="hover:bg-slate-800 p-2 rounded-full"><ZoomIn size={20}/></button>
           <div className="w-px h-6 bg-slate-700 mx-2"></div>
           <button onClick={onExit} className="text-red-400 hover:bg-red-500/10 p-2 rounded-full transition-colors"><LogOut size={20}/></button>
        </div>
      )}

      {/* Definition Sidebar - Acts as a sibling to the PDF area, pushing it to the left */}
      {definitionPanel && (
        <div className="w-[400px] h-full bg-slate-950 border-l border-slate-800 flex flex-col shrink-0 animate-in slide-in-from-right duration-500">
          <div className="p-8 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-2xl font-black capitalize text-white">{definitionPanel.word}</h3>
            <button onClick={() => setDefinitionPanel(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {definitionPanel.loading ? <Loader2 className="animate-spin text-indigo-500 mx-auto mt-10" /> : (
              <>
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Definition</p>
                  <p className="text-slate-200 text-lg leading-relaxed">{definitionPanel.definition}</p>
                </div>
                {definitionPanel.example && (
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Example</p>
                    <blockquote className="text-slate-400 italic border-l-2 border-slate-700 pl-4">"{definitionPanel.example}"</blockquote>
                  </div>
                )}
              </>
            )}
          </div>
          {!definitionPanel.loading && (
             <div className="p-6 border-t border-slate-800 space-y-3 bg-slate-950">
                <button onClick={() => playAudio(definitionPanel)} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 rounded-xl font-bold text-white">
                  <Volume2 size={18} /> Play Audio
                </button>
                <button onClick={() => db.vocabulary.add(definitionPanel).then(loadWords)} className="w-full py-3 bg-indigo-600 rounded-xl font-black text-white">
                  <Plus size={18} className="inline mr-2" /> Add to Library
                </button>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
