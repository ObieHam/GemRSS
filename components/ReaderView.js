// components/ReaderView.js
import { useState, useEffect, useRef } from 'react';
import { Upload, Loader2, X, Volume2, Plus, ZoomIn, ZoomOut, LogOut } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../lib/storage';
import { fetchDefinition } from '../lib/apiService';
import { isValidWord } from '../lib/utils';
import { COMMON_WORDS } from '../lib/constants';

// Page component to handle individual canvas rendering for the scrollable list
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

        if (renderTask) {
          renderTask.cancel();
        }

        renderTask = page.render({
          canvasContext: context,
          viewport: viewport
        });

        await renderTask.promise;

        const textContent = await page.getTextContent();
        const textLayer = textLayerRef.current;
        textLayer.innerHTML = '';
        
        let firstNewWordFound = false;
        
        textContent.items.forEach((item) => {
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const style = textContent.styles[item.fontName];
          
          const div = document.createElement('div');
          div.style.position = 'absolute';
          div.style.left = tx[4] + 'px';
          const fontHeight = Math.abs(tx[3]);
          div.style.top = (tx[5] - fontHeight) + 'px';
          div.style.fontSize = fontHeight + 'px';
          div.style.fontFamily = style ? style.fontFamily : 'sans-serif';
          div.style.color = 'transparent';
          div.style.lineHeight = '1';
          div.style.whiteSpace = 'pre';
          
          const text = item.str;
          const tokens = text.split(/(\s+)/);
          
          tokens.forEach(token => {
            const span = document.createElement('span');
            span.textContent = token;
            
            const lower = token.toLowerCase().replace(/[^a-z]/g, '');
            const isWord = /^[a-zA-Z]{3,}$/.test(token);
            const isSaved = highlightedWords.includes(lower);
            
            // New word logic: valid word, not common, and not already saved
            const isNewWord = isWord && !isSaved && !COMMON_WORDS.has(lower) && isValidWord(lower);
            
            if (isWord) {
              span.style.cursor = 'pointer';
              span.style.transition = 'all 0.2s ease';
              span.style.borderRadius = '2px';
              
              if (isSaved) {
                // Existing yellow highlight for SAVED words
                span.style.backgroundColor = 'rgba(251, 191, 36, 0.4)';
                span.style.borderBottom = '3px solid rgba(245, 158, 11, 0.8)';
                span.style.paddingBottom = '1px';
              } else if (isNewWord) {
                // NEW: Golden highlight for potential new vocabulary
                span.style.backgroundColor = 'rgba(212, 175, 55, 0.15)'; // Soft gold glow
                span.style.borderBottom = '2px solid rgba(212, 175, 55, 0.6)'; // Defined golden underline
                span.style.padding = '0 1px 1px 1px';
              }
              
              if (!isSaved && !firstNewWordFound && pageNum === 1 && onFirstNewWord) {
                firstNewWordFound = true;
                setTimeout(() => onFirstNewWord(token), 100);
              }
              
              span.addEventListener('mouseenter', () => {
                if (!isSaved) {
                  // Interactive hover effect
                  span.style.backgroundColor = 'rgba(212, 175, 55, 0.3)';
                }
              });
              span.addEventListener('mouseleave', () => {
                if (!isSaved) {
                  span.style.backgroundColor = isNewWord ? 'rgba(212, 175, 55, 0.15)' : 'transparent';
                }
              });
              span.addEventListener('click', () => onWordClick(token));
            }
            
            div.appendChild(span);
          });
          
          textLayer.appendChild(div);
        });

      } catch (error) {
        if (error.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', error);
        }
      }
    };

    render();

    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageNum, scale, highlightedWords, onWordClick, onFirstNewWord]);

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
  const [scale, setScale] = useState(1.5);
  const [definitionPanel, setDefinitionPanel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [firstWordLoaded, setFirstWordLoaded] = useState(false);
  const containerRef = useRef(null);

  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setFirstWordLoaded(false);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const availableWidth = containerRef.current ? containerRef.current.clientWidth - 80 : window.innerWidth - 480; 
      const calculatedScale = availableWidth / viewport.width;
      
      setScale(Math.min(calculatedScale, 2.0));
      
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
    } catch (err) {
      console.error(err);
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

  const handleFirstNewWord = (word) => {
    if (!firstWordLoaded) {
      setFirstWordLoaded(true);
      handleWordClick(word);
    }
  };

  const playAudio = (info) => {
    const audioUrl = info.phonetics?.find(p => p.audio)?.audio || info.audioUrl;
    if (audioUrl) new Audio(audioUrl).play().catch(() => {});
  };

  const adjustScale = (delta) => {
    setScale(prev => {
      const newScale = prev + delta;
      return Math.max(0.5, Math.min(2.5, newScale));
    });
  };

  return (
    <div className="flex h-full w-full bg-[#0f172a] overflow-hidden">
      
      <div ref={containerRef} className="flex-1 overflow-y-auto p-10 pr-[420px] pb-24">
        {!pdfDoc ? (
          <div className="h-full flex flex-col items-center justify-center">
            <h2 className="text-4xl font-black mb-6 text-white">Interactive Reader</h2>
            <button 
              onClick={() => fileInputRef.current.click()} 
              className="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all text-white"
            >
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
                scale={scale}
                onWordClick={handleWordClick}
                onFirstNewWord={i === 0 ? handleFirstNewWord : null}
                highlightedWords={words.map(w => w.word)}
              />
            ))}
          </div>
        )}
      </div>

      {pdfDoc && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/95 backdrop-blur-xl p-3 px-6 rounded-full border-2 border-slate-700 z-50 shadow-2xl" style={{ marginLeft: '-200px' }}>
           <button onClick={() => adjustScale(-0.2)} className="hover:bg-slate-800 p-2 rounded-full transition-colors text-white">
             <ZoomOut size={20}/>
           </button>
           <span className="text-sm font-black w-16 text-center text-slate-300">{Math.round(scale * 100)}%</span>
           <button onClick={() => adjustScale(0.2)} className="hover:bg-slate-800 p-2 rounded-full transition-colors text-white">
             <ZoomIn size={20}/>
           </button>
           <div className="w-px h-6 bg-slate-700 mx-2"></div>
           <button onClick={onExit} className="text-red-400 hover:bg-red-500/10 p-2 rounded-full transition-colors">
             <LogOut size={20}/>
           </button>
        </div>
      )}

      <div className="fixed right-0 top-0 w-[400px] h-full bg-slate-950 border-l-2 border-slate-800 flex flex-col z-40">
        <div className="p-8 border-b-2 border-slate-800 flex justify-between items-center">
          <h3 className="text-2xl font-black capitalize text-white">
            {definitionPanel?.word || 'Word Definition'}
          </h3>
          {definitionPanel && (
            <button onClick={() => setDefinitionPanel(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
        
        {definitionPanel ? (
          <>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {definitionPanel.loading ? (
                <Loader2 className="animate-spin text-indigo-500 mx-auto mt-10" size={40} />
              ) : (
                <>
                  <div>
                    <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Definition</p>
                    <p className="text-slate-200 text-lg leading-relaxed">{definitionPanel.definition}</p>
                  </div>
                  {definitionPanel.example && (
                    <div>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Example</p>
                      <blockquote className="text-slate-400 italic border-l-2 border-slate-700 pl-4">
                        "{definitionPanel.example}"
                      </blockquote>
                    </div>
                  )}
                </>
              )}
            </div>
            {!definitionPanel.loading && (
               <div className="p-6 border-t-2 border-slate-800 space-y-3 bg-slate-950">
                  <button onClick={() => playAudio(definitionPanel)} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white transition-colors">
                    <Volume2 size={18} /> Play Audio
                  </button>
                  <button onClick={() => db.vocabulary.add(definitionPanel).then(loadWords)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black text-white transition-colors">
                    <Plus size={18} className="inline mr-2" /> Add to Library
                  </button>
               </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-slate-500">
              <p className="text-lg font-medium">Click on any word in the PDF</p>
              <p className="text-sm mt-2">to see its definition here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
