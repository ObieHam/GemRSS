// components/ReaderView.js
import { useState, useEffect, useRef } from 'react';
import { Upload, Loader2, X, Volume2, Plus, ZoomIn, ZoomOut, LogOut } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../lib/storage';
import { fetchDefinition } from '../lib/apiService';
import { isValidWord } from '../lib/utils';
import { COMMON_WORDS } from '../lib/constants';

function PDFPage({ pdfDoc, pageNum, scale, onWordClick, highlightedWords, onFirstNewWord }) {
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);

  useEffect(() => {
    let renderTask = null;
    
    const render = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        const dpr = window.devicePixelRatio || 1;
        canvas.height = viewport.height * dpr;
        canvas.width = viewport.width * dpr;
        canvas.style.height = viewport.height + 'px';
        canvas.style.width = viewport.width + 'px';
        context.scale(dpr, dpr);

        if (renderTask) renderTask.cancel();

        renderTask = page.render({ canvasContext: context, viewport: viewport });
        await renderTask.promise;

        const textContent = await page.getTextContent();
        const textLayer = textLayerRef.current;
        textLayer.innerHTML = '';
        
        textContent.items.forEach((item) => {
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const style = textContent.styles[item.fontName];
          
          const div = document.createElement('div');
          div.style.position = 'absolute';
          div.style.left = tx[4] + 'px';
          
          // Fix vertical positioning with baseline adjustment (shifts highlight to word center)
          const fontHeight = Math.abs(tx[3]);
          const baselineAdjustment = fontHeight * 0.15; 
          div.style.top = (tx[5] - fontHeight + baselineAdjustment) + 'px';
          div.style.height = fontHeight + 'px';
          div.style.fontSize = fontHeight + 'px';
          div.style.fontFamily = style ? style.fontFamily : 'sans-serif';
          div.style.color = 'transparent';
          div.style.lineHeight = '0.9';
          div.style.whiteSpace = 'pre';
          
          const text = item.str;
          const tokens = text.split(/(\s+)/);
          
          tokens.forEach(token => {
            const span = document.createElement('span');
            span.textContent = token;
            span.style.display = 'inline-block';
            
            const lower = token.toLowerCase().replace(/[^a-z]/g, '');
            const isWord = /^[a-zA-Z]{3,}$/.test(token);
            const isSaved = highlightedWords.includes(lower);
            const isNewWord = isWord && !isSaved && !COMMON_WORDS.has(lower) && isValidWord(lower);
            
            if (isWord) {
              span.style.cursor = 'pointer';
              span.style.transition = 'all 0.2s ease';
              span.style.borderRadius = '2px';
              
              if (isSaved) {
                span.style.backgroundColor = 'rgba(251, 191, 36, 0.4)';
                span.style.borderBottom = '3px solid rgba(245, 158, 11, 0.8)';
              } else if (isNewWord) {
                // Golden highlight for new words
                span.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';
                span.style.borderBottom = '2px solid rgba(212, 175, 55, 0.6)';
              }
              
              span.addEventListener('mouseenter', () => {
                if (!isSaved) span.style.backgroundColor = 'rgba(212, 175, 55, 0.3)';
              });
              span.addEventListener('mouseleave', () => {
                if (!isSaved) span.style.backgroundColor = isNewWord ? 'rgba(212, 175, 55, 0.15)' : 'transparent';
              });
              span.addEventListener('click', () => onWordClick(token));
            }
            div.appendChild(span);
          });
          textLayer.appendChild(div);
        });
      } catch (error) {
        if (error.name !== 'RenderingCancelledException') console.error('Error rendering page:', error);
      }
    };

    render();
    return () => { if (renderTask) renderTask.cancel(); };
  }, [pdfDoc, pageNum, scale, highlightedWords, onWordClick]);

  return (
    <div className="relative bg-white shadow-2xl mb-6 mx-auto" style={{ width: 'fit-content' }}>
      <canvas ref={canvasRef} className="block" />
      <div ref={textLayerRef} className="absolute inset-0 select-none" />
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
    
    // Pronounce automatically on click
    if (!info.error) playAudio(info);

    if (settings.autoSave && !info.error) {
      const exists = await db.vocabulary.where('word').equals(info.word).first();
      if (!exists) { await db.vocabulary.add(info); await loadWords(); }
    }
  };

  const adjustScale = (delta) => setScale(prev => Math.max(0.5, Math.min(2.5, prev + delta)));

  return (
    <div className="flex h-full w-full bg-[#0f172a] overflow-hidden relative">
      <div 
        ref={containerRef} 
        className="h-full overflow-auto p-10 pb-24 transition-all duration-300"
        style={{ marginRight: '400px', width: 'calc(100% - 400px)' }}
      >
        {!pdfDoc ? (
          <div className="h-full flex flex-col items-center justify-center">
            <h2 className="text-4xl font-black mb-6 text-white text-center">Interactive Reader</h2>
            <button 
              onClick={() => fileInputRef.current.click()} 
              className="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 text-white"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Upload />} Open PDF
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf" />
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {Array.from({ length: numPages }, (_, i) => (
              <PDFPage key={i} pdfDoc={pdfDoc} pageNum={i + 1} scale={scale} onWordClick={handleWordClick} highlightedWords={words.map(w => w.word)} />
            ))}
          </div>
        )}
      </div>

      {pdfDoc && (
        <div className="fixed bottom-10 left-[calc(50%-200px)] -translate-x-1/2 flex items-center gap-4 bg-slate-900/95 backdrop-blur-xl p-3 px-6 rounded-full border-2 border-slate-700 z-50 shadow-2xl">
           <button onClick={() => adjustScale(-0.2)} className="text-white hover:bg-slate-800 p-2 rounded-full"><ZoomOut size={20}/></button>
           <span className="text-sm font-black w-16 text-center text-slate-300">{Math.round(scale * 100)}%</span>
           <button onClick={() => adjustScale(0.2)} className="text-white hover:bg-slate-800 p-2 rounded-full"><ZoomIn size={20}/></button>
           <button onClick={onExit} className="text-red-400 hover:bg-red-500/10 p-2 rounded-full ml-2"><LogOut size={20}/></button>
        </div>
      )}

      <div className="fixed right-0 top-0 w-[400px] h-full bg-slate-950 border-l-2 border-slate-800 flex flex-col z-40">
        <div className="p-8 border-b-2 border-slate-800 flex justify-between items-center">
          <h3 className="text-2xl font-black capitalize text-white truncate pr-4">{definitionPanel?.word || 'Word Definition'}</h3>
          {definitionPanel && <button onClick={() => setDefinitionPanel(null)} className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg"><X size={20} /></button>}
        </div>
        <div className="flex-1 overflow-y-auto p-8">
           {definitionPanel?.loading ? <Loader2 className="animate-spin text-indigo-500 mx-auto mt-10" size={40} /> : definitionPanel ? (
             <div className="space-y-6">
                <div><p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Definition</p><p className="text-slate-200 text-lg">{definitionPanel.definition}</p></div>
                {definitionPanel.example && <div><p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Example</p><blockquote className="text-slate-400 italic border-l-2 border-slate-700 pl-4">"{definitionPanel.example}"</blockquote></div>}
             </div>
           ) : <p className="text-center text-slate-500 mt-20">Click any word in the PDF</p>}
        </div>
        {definitionPanel && !definitionPanel.loading && (
          <div className="p-6 border-t-2 border-slate-800 space-y-3">
             <button onClick={() => playAudio(definitionPanel)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white flex justify-center gap-2"><Volume2 size={18}/> Audio</button>
             <button onClick={() => db.vocabulary.add(definitionPanel).then(loadWords)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black text-white flex justify-center gap-2"><Plus size={18}/> Add to Library</button>
          </div>
        )}
      </div>
    </div>
  );
}
