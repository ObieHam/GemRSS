// components/ReaderView.js
import { useState, useEffect, useRef } from 'react';
import { Upload, Loader2, X, Volume2, Plus, ZoomIn, ZoomOut, LogOut, FileText } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../lib/storage';
import { fetchDefinition } from '../lib/apiService';
import { isValidWord } from '../lib/utils';
import { COMMON_WORDS } from '../lib/constants';

/**
 * REWRITTEN PDF ENGINE
 * Uses High-DPI Canvas and Official Text Layer for sharp text and perfect highlights.
 */
function PDFPage({ pdfDoc, pageNum, scale, onWordClick, highlightedWords, settings }) {
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);

  useEffect(() => {
    let renderTask = null;
    
    const render = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        // 1. Setup Canvas with High DPI Support (Fixes Blur)
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { alpha: false });
        const dpr = window.devicePixelRatio || 1;
        const outputScale = Math.max(2, dpr); // Ensure high clarity on all screens

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + "px";
        canvas.style.height = Math.floor(viewport.height) + "px";

        const transform = [outputScale, 0, 0, outputScale, 0, 0];
        
        if (renderTask) renderTask.cancel();
        renderTask = page.render({ 
          canvasContext: context, 
          viewport: viewport,
          transform: transform 
        });
        await renderTask.promise;

        // 2. Setup Official Text Layer (Fixes Inconsistent Highlighting)
        const textLayer = textLayerRef.current;
        textLayer.innerHTML = '';
        textLayer.style.width = canvas.style.width;
        textLayer.style.height = canvas.style.height;

        const textContent = await page.getTextContent();
        
        await pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textLayer,
          viewport: viewport,
          enhanceTextSelection: true,
        }).promise;

        // 3. Post-Process for Word-Level Interaction
        const textDivs = textLayer.querySelectorAll('span, div');
        textDivs.forEach(div => {
          const rawText = div.textContent;
          if (!rawText || rawText.trim().length < 2) return;

          // Split content into words while preserving the layout
          const wordsInDiv = rawText.split(/(\s+)/);
          div.innerHTML = '';
          
          wordsInDiv.forEach(token => {
            const span = document.createElement('span');
            span.textContent = token;
            
            const lower = token.toLowerCase().trim().replace(/[^a-z]/g, '');
            const isWord = /^[a-zA-Z]{3,}$/.test(token);
            const isSaved = highlightedWords.some(w => w.toLowerCase().trim() === lower);
            const isNewWord = settings.highlightNewWords && isWord && !isSaved && !COMMON_WORDS.has(lower) && isValidWord(lower);

            if (isWord) {
              span.style.cursor = 'pointer';
              span.className = 'pdf-word-wrapper';
              
              if (isSaved) {
                span.classList.add('word-highlight-saved');
              } else if (isNewWord) {
                span.classList.add('word-highlight-new');
              }

              span.onclick = (e) => {
                e.stopPropagation();
                onWordClick(token);
              };
            }
            div.appendChild(span);
          });
        });

      } catch (error) {
        if (error.name !== 'RenderingCancelledException') console.error(error);
      }
    };

    render();
    return () => { if (renderTask) renderTask.cancel(); };
  }, [pdfDoc, pageNum, scale, highlightedWords, onWordClick, settings]);

  return (
    <div className="relative bg-white shadow-2xl mb-10 mx-auto" style={{ width: 'fit-content' }}>
      <canvas ref={canvasRef} className="block" />
      <div 
        ref={textLayerRef} 
        className="textLayer absolute inset-0 overflow-hidden"
        style={{ pointerEvents: 'auto' }}
      />
    </div>
  );
}

export default function ReaderView({ settings, loadWords, words, onExit }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [definitionPanel, setDefinitionPanel] = useState(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  const hasAudio = (info) => !!(info?.phonetics?.some(p => p.audio) || info?.audioUrl);
  const playAudio = (info) => {
    const audioUrl = info.phonetics?.find(p => p.audio)?.audio || info.audioUrl;
    if (audioUrl) new Audio(audioUrl).play().catch(() => {});
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const availableWidth = window.innerWidth - 450 - 280; 
      setScale(Math.min(availableWidth / viewport.width, 1.8));
      
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
    
    if (!info.error && hasAudio(info)) playAudio(info);
    
    if (settings.autoSave && !info.error) {
      const exists = await db.vocabulary.where('word').equals(info.word).first();
      if (!exists) { 
        await db.vocabulary.add(info); 
        await loadWords(); 
      }
    }
  };

  const adjustScale = (delta) => setScale(prev => Math.max(0.5, Math.min(2.5, prev + delta)));

  return (
    <div className="flex h-full w-full bg-[#0f172a] overflow-hidden relative">
      {/* Reader Area */}
      <div ref={containerRef} className="h-full overflow-auto p-10 pb-24" style={{ marginRight: '400px', width: 'calc(100% - 400px)' }}>
        {!pdfDoc ? (
          <div className="p-12 max-w-4xl mx-auto flex flex-col items-center text-center animate-in fade-in duration-500 mt-20">
            <h2 className="text-6xl font-black text-white tracking-tighter mb-6">Interactive Reader</h2>
            <p className="text-slate-400 text-xl mb-12 max-w-xl">Read documents with instant word definitions and pronunciation.</p>
            <div className="w-full bg-[#1e293b] border border-slate-700/50 rounded-3xl p-16 flex flex-col items-center justify-center shadow-2xl">
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf" />
              <button 
                onClick={() => fileInputRef.current.click()} 
                className="inline-flex items-center gap-4 px-12 py-6 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-2xl text-white transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" size={32} /> : <FileText size={32} />} 
                Open PDF
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {Array.from({ length: numPages }, (_, i) => (
              <PDFPage 
                key={i} 
                pdfDoc={pdfDoc} 
                pageNum={i + 1} 
                scale={scale} 
                onWordClick={handleWordClick} 
                highlightedWords={words.map(w => w.word)} 
                settings={settings} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Controls */}
      {pdfDoc && (
        <div className="fixed bottom-10 left-[calc(50%-200px)] -translate-x-1/2 flex items-center gap-4 bg-slate-900/95 backdrop-blur-xl p-3 px-6 rounded-full border-2 border-slate-700 z-50 shadow-2xl">
           <button onClick={() => adjustScale(-0.2)} className="text-white hover:bg-slate-800 p-2 rounded-full transition-colors"><ZoomOut size={20}/></button>
           <span className="text-sm font-black w-16 text-center text-slate-300">{Math.round(scale * 100)}%</span>
           <button onClick={() => adjustScale(0.2)} className="text-white hover:bg-slate-800 p-2 rounded-full transition-colors"><ZoomIn size={20}/></button>
           <button onClick={onExit} className="text-red-400 hover:bg-red-500/10 p-2 rounded-full ml-2 transition-colors"><LogOut size={20}/></button>
        </div>
      )}

      {/* Definition Sidebar */}
      <div className="fixed right-0 top-0 w-[400px] h-full bg-slate-950 border-l-2 border-slate-800 flex flex-col z-40">
        <div className="p-8 border-b-2 border-slate-800 flex justify-between items-center">
          <h3 className="text-2xl font-black capitalize text-white truncate pr-4">{definitionPanel?.word || 'Word Definition'}</h3>
          {definitionPanel && <button onClick={() => setDefinitionPanel(null)} className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"><X size={20} /></button>}
        </div>
        
        <div className="flex-1 overflow-y-auto p-8">
           {definitionPanel?.loading ? (
             <Loader2 className="animate-spin text-indigo-500 mx-auto mt-10" size={40} />
           ) : definitionPanel ? (
             <div className="space-y-6">
                <div>
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Definition</p>
                  <p className="text-slate-200 text-lg">{definitionPanel.definition}</p>
                </div>
                {definitionPanel.example && (
                  <div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Example</p>
                    <blockquote className="text-slate-400 italic border-l-2 border-slate-700 pl-4">"{definitionPanel.example}"</blockquote>
                  </div>
                )}
             </div>
           ) : (
             <p className="text-center text-slate-500 mt-20">Click any word in the PDF</p>
           )}
        </div>

        {definitionPanel && !definitionPanel.loading && (
          <div className="p-6 border-t-2 border-slate-800 space-y-3">
             {hasAudio(definitionPanel) && (
               <button onClick={() => playAudio(definitionPanel)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white flex justify-center gap-2 transition-colors">
                 <Volume2 size={18}/> Play Audio
               </button>
             )}
             <button onClick={() => db.vocabulary.add(definitionPanel).then(loadWords)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black text-white flex justify-center gap-2 transition-colors">
               <Plus size={18}/> Add to Library
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
