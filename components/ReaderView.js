// components/ReaderView.js
import { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, Loader2, Volume2, Plus, X, ZoomIn, ZoomOut } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../lib/storage';
import { COMMON_WORDS } from '../lib/constants';
import { isValidWord } from '../lib/utils';
import { fetchDefinition } from '../lib/apiService';

// Sub-component for individual pages to manage their own rendering
function PDFPage({ pdfDoc, pageNum, scaleFactor, containerWidth, onWordClick, highlightedWords }) {
  const canvasRef = useRef(null);
  const [textItems, setTextItems] = useState([]);
  const [viewport, setViewport] = useState(null);

  useEffect(() => {
    const render = async () => {
      const page = await pdfDoc.getPage(pageNum);
      const unscaledViewport = page.getViewport({ scale: 1 });
      
      // Calculate responsive scale based on current container width
      const baseScale = (containerWidth - 60) / unscaledViewport.width;
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
      const textContent = await page.getTextContent();
      setTextItems(textContent.items);
    };
    if (containerWidth > 0) render();
  }, [pdfDoc, pageNum, scaleFactor, containerWidth]);

  return (
    <div className="relative shadow-2xl bg-white mb-8 mx-auto transition-all duration-500 ease-in-out" style={{ width: viewport?.width, height: viewport?.height }}>
      <canvas ref={canvasRef} className="block" />
      <div className="absolute inset-0 select-none pointer-events-none">
        {viewport && textItems.map((item, idx) => {
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const fontSize = Math.sqrt(item.transform[0]**2 + item.transform[1]**2) * viewport.scale;
          return (
            <div key={idx} className="absolute whitespace-pre pointer-events-auto" style={{ left: tx[4], top: tx[5] - fontSize, fontSize: `${fontSize}px`, color: 'transparent' }}>
              {item.str.split(/(\s+)/).map((token, tIdx) => {
                const isWord = /^[a-zA-Z]{3,}$/.test(token);
                const isHigh = highlightedWords.includes(token.toLowerCase());
                return (
                  <span key={tIdx} onClick={() => isWord && onWordClick(token)} className={`cursor-pointer ${isHigh ? 'bg-amber-400/20 border-b border-amber-500/50' : 'hover:bg-indigo-500/10'}`}>
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

export default function ReaderView({ settings, loadWords, words, sidebarOpen }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [highlightedWords, setHighlightedWords] = useState([]);
  const [definitionPanel, setDefinitionPanel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1.0);

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  // ResizeObserver to handle smooth transitions when sidebar or definition panel opens/closes
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
       await db.vocabulary.add(info);
       await loadWords();
    }
  };

  return (
    <div className="flex h-full w-full bg-[#0f172a] overflow-hidden">
      {/* PDF Scroll Area */}
      <div ref={containerRef} className="flex-1 h-full overflow-y-auto p-4 scroll-smooth transition-all duration-500 ease-in-out">
        {!pdfDoc ? (
          <div className="h-full flex flex-col items-center justify-center">
            <h2 className="text-4xl font-black mb-6">PDF Reader</h2>
            <button onClick={() => fileInputRef.current.click()} className="bg-indigo-600 px-8 py-4 rounded-xl font-bold">
              {loading ? <Loader2 className="animate-spin" /> : 'Open PDF'}
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/90 backdrop-blur p-2 px-4 rounded-full border border-slate-700 z-50">
           <button onClick={() => setScaleFactor(s => Math.max(0.5, s - 0.1))}><ZoomOut size={20}/></button>
           <span className="text-xs font-bold w-12 text-center">{Math.round(scaleFactor * 100)}%</span>
           <button onClick={() => setScaleFactor(s => Math.min(2.0, s + 0.1))}><ZoomIn size={20}/></button>
        </div>
      )}

      {/* Definition Sidebar (Sibling, not overlay) */}
      {definitionPanel && (
        <div className="w-80 h-full bg-slate-900 border-l border-slate-700 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-xl font-bold capitalize">{definitionPanel.word}</h3>
            <button onClick={() => setDefinitionPanel(null)}><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {definitionPanel.loading ? <Loader2 className="animate-spin" /> : (
              <p className="text-slate-300 leading-relaxed">{definitionPanel.definition}</p>
            )}
          </div>
          {definitionPanel.word && !definitionPanel.loading && (
             <div className="p-4 bg-slate-800">
                <button onClick={() => db.vocabulary.add(definitionPanel).then(loadWords)} className="w-full bg-indigo-600 py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                  <Plus size={18} /> Add to Library
                </button>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
