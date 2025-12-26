// components/ReaderView.js
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
      
      // Calculate scale to fit container width
      const containerWidth = containerRef.current.clientWidth - 96;
      const unscaledViewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / unscaledViewport.width;
      const vp = page.getViewport({ scale });
      setViewport(vp);

      // Render Canvas
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.height = vp.height;
      canvas.width = vp.width;
      await page.render({ canvasContext: context, viewport: vp }).promise;

      // Extract Text for Interaction
      const textContent = await page.getTextContent();
      setTextItems(textContent.items);
      
      // Analyze words for highlighting
      const pageText = textContent.items.map(item => item.str).join(' ');
      const tokens = pageText.match(/\b[a-zA-Z]{4,}\b/g) || [];
      const newWords = [];
      const allWordsInLib = await db.vocabulary.toArray();

      for (const token of tokens) {
        const lower = token.toLowerCase();
        if (COMMON_WORDS.has(lower)) continue;
        if (isValidWord(lower)) {
          if (!allWordsInLib.find(w => w.word === lower)) newWords.push(lower);
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

      if (info.audioUrl || info.phonetics?.some(p => p.audio)) {
        const audio = new Audio(info.audioUrl || info.phonetics.find(p => p.audio).audio);
        audio.play().catch(() => {});
      }

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

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f172a]">
      <div ref={containerRef} className="flex-grow p-12 overflow-y-auto scrollbar-hide">
        {!pdfDoc ? (
          <div className="max-w-4xl mx-auto mt-20">
            <h2 className="text-5xl font-black mb-8 text-white">Advanced PDF Reader</h2>
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-12 text-center">
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf" />
              <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="inline-flex items-center gap-4 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 rounded-2xl font-bold text-lg">
                {loading ? <Loader2 className="animate-spin" /> : <Upload />} Select Scientific Paper
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-white">Page {currentPage} / {totalPages}</h2>
                {showHint && (
                  <div className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg border border-indigo-500/30">
                    Click any word to look up
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg"><ChevronLeft /></button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg"><ChevronRight /></button>
              </div>
            </div>

            <div className="relative shadow-2xl rounded-sm overflow-hidden bg-white mx-auto" style={{ width: viewport?.width, height: viewport?.height }}>
              <canvas ref={canvasRef} className="absolute inset-0" />
              
              {/* INTERACTIVE TEXT LAYER */}
              <div className="absolute inset-0 pointer-events-none">
                {viewport && textItems.map((item, idx) => {
                  const [a, b, c, d, tx, ty] = item.transform;
                  const [x, y] = viewport.convertToViewportPoint(tx, ty);
                  const fontSize = Math.sqrt(a * a + b * b) * viewport.scale;
                  
                  return (
                    <div 
                      key={idx}
                      className="absolute pointer-events-auto whitespace-pre leading-none flex"
                      style={{ left: x, top: y - fontSize, fontSize: `${fontSize}px`, height: fontSize, color: 'transparent' }}
                    >
                      {item.str.split(/(\s+)/).map((token, tIdx) => {
                        const isWord = /^[a-zA-Z]{3,}$/.test(token);
                        const isHigh = highlightedWords.includes(token.toLowerCase());
                        return (
                          <span 
                            key={tIdx} 
                            onClick={() => isWord && handleWordClick(token)}
                            className={`${isWord ? 'cursor-pointer hover:bg-indigo-500/30' : ''} ${isHigh ? 'bg-amber-400/20 border-b-2 border-amber-500/40' : ''}`}
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

      {definitionPanel && (
        <div className="w-96 bg-slate-950 border-l border-slate-800 p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-white capitalize">{definitionPanel.word}</h3>
            <button onClick={() => setDefinitionPanel(null)} className="p-2 hover:bg-slate-800 rounded-xl"><X /></button>
          </div>
          {definitionPanel.loading ? <Loader2 className="animate-spin mx-auto mt-20 text-indigo-500" /> : (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Definition</p>
                <p className="text-slate-200 leading-relaxed">{definitionPanel.definition}</p>
              </div>
              {definitionPanel.example && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Example</p>
                  <p className="text-slate-400 italic">"{definitionPanel.example}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
