import { useState, useEffect, useRef } from 'react';
import { Upload, Loader2, X, ChevronLeft, ChevronRight, Volume2, Plus, Info } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../lib/storage';
import { COMMON_WORDS } from '../lib/constants';
import { isValidWord } from '../lib/utils';
import { fetchDefinition } from '../lib/apiService';

export default function ReaderView({ settings, loadWords, words }) {
  const [pdfPages, setPdfPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [highlightedWords, setHighlightedWords] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [definitionPanel, setDefinitionPanel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          pages.push(pageText);
        }

        setPdfPages(pages);
        setTotalPages(pages.length);
        setCurrentPage(1);
        analyzePageWords(pages[0]);
      } else {
        const text = await file.text();
        const pages = text.split('\n\n\n');
        setPdfPages(pages);
        setTotalPages(pages.length);
        setCurrentPage(1);
        analyzePageWords(pages[0]);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const analyzePageWords = async (pageText) => {
    const tokens = pageText.match(/\b[a-zA-Z]{4,}\b/g) || [];
    const newWords = [];
    const allWords = await db.vocabulary.toArray();

    for (const token of tokens) {
      const lowerToken = token.toLowerCase();
      if (COMMON_WORDS.has(lowerToken)) continue;
      
      if (isValidWord(lowerToken) || token === token.toUpperCase()) {
        const exists = allWords.find(w => w.word === lowerToken);
        if (!exists && !newWords.includes(token)) {
          newWords.push(token);
        }
      }
    }

    setHighlightedWords(newWords);
  };

  useEffect(() => {
    if (pdfPages.length > 0 && currentPage > 0) {
      analyzePageWords(pdfPages[currentPage - 1]);
    }
  }, [currentPage, pdfPages, words]);

  const playAudio = (audioData) => {
    if (settings.apiSource === 'free-dictionary' && audioData.phonetics) {
      const accentMap = { us: '-us', uk: '-uk', au: '-au' };
      const preferredAudio = audioData.phonetics.find(p =>
        p.audio && p.audio.includes(accentMap[settings.accent])
      );
      const audioUrl = preferredAudio?.audio || audioData.phonetics.find(p => p.audio)?.audio;

      if (audioUrl) {
        new Audio(audioUrl).play().catch(e => console.error("Audio play failed", e));
      }
    } else if (audioData.audioUrl) {
      new Audio(audioData.audioUrl).play().catch(e => console.error("Audio play failed", e));
    }
  };

  const handleWordClick = async (word, isRightClick = false) => {
    const lowerWord = word.toLowerCase();
    
    setSelectedWord(lowerWord);
    setDefinitionPanel({ loading: true, word: lowerWord });
    
    try {
      const info = await fetchDefinition(lowerWord, settings);
      
      if (info.error) {
        setDefinitionPanel({ error: info.error, word: lowerWord });
        return;
      }
      
      setDefinitionPanel(info);

      // Auto-play audio
      playAudio(info);

      // Auto-save if enabled and not right-click (right-click is for looking up existing words)
      if (settings.autoSave && !isRightClick) {
        const exists = await db.vocabulary.where('word').equals(info.word).first();
        if (!exists) {
          await db.vocabulary.add(info);
          await loadWords();
          setHighlightedWords(prev => prev.filter(w => w.toLowerCase() !== info.word));
        }
      }
    } catch (error) {
      console.error('Error fetching definition:', error);
      setDefinitionPanel({ error: 'Failed to load definition', word: lowerWord });
    }
  };

  const addToLibrary = async () => {
    if (definitionPanel && !definitionPanel.loading && !definitionPanel.error) {
      const exists = await db.vocabulary.where('word').equals(definitionPanel.word).first();
      if (!exists) {
        await db.vocabulary.add(definitionPanel);
        await loadWords();
        setHighlightedWords(prev => prev.filter(w => w.toLowerCase() !== definitionPanel.word));
      }
      // Panel stays open showing the same word
    }
  };

  const handleContextMenu = (e, word) => {
    e.preventDefault();
    handleWordClick(word, true);
  };

  const renderText = () => {
    if (pdfPages.length === 0) return null;
    const currentText = pdfPages[currentPage - 1] || '';
    const parts = currentText.split(/(\s+|[.,!?;:()"])/);
    
    return (
      <div className="text-slate-200 leading-relaxed text-lg">
        {parts.map((part, idx) => {
          const cleanPart = part.trim();
          if (cleanPart && /^[a-zA-Z]+$/.test(cleanPart)) {
            const isHighlighted = highlightedWords.includes(part);
            return (
              <span
                key={idx}
                className={`${isHighlighted ? 'bg-gradient-to-r from-amber-400/30 to-yellow-400/30 px-1 rounded-md border-b-2 border-amber-500/50 cursor-pointer hover:from-amber-400/50 hover:to-yellow-400/50 transition-all' : 'cursor-pointer hover:bg-slate-700/30 px-0.5 rounded'}`}
                onClick={() => handleWordClick(part)}
                onContextMenu={(e) => handleContextMenu(e, part)}
              >
                {part}
              </span>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="flex h-screen">
      <div className="flex-grow p-12 overflow-y-auto">
        {pdfPages.length === 0 ? (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-black mb-8 text-white">PDF Reader</h2>
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-12 text-center">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.txt"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="inline-flex items-center gap-4 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 rounded-2xl font-bold text-lg transition-colors"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                {loading ? 'Processing...' : 'Upload PDF'}
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-black text-white">Reading Mode</h2>
                {showHint && (
                  <div className="flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl px-4 py-2 text-sm">
                    <Info size={16} className="text-indigo-400" />
                    <span className="text-indigo-300">Right-click any word to look it up</span>
                    <button onClick={() => setShowHint(false)} className="text-indigo-400 hover:text-indigo-300 ml-2">
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-slate-400 font-bold min-w-[120px] text-center">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-12 min-h-[600px]">
              {renderText()}
            </div>
          </div>
        )}
      </div>

      {definitionPanel && (
        <div className="w-96 bg-slate-950 border-l-2 border-slate-800 p-8 overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-white capitalize">
              {definitionPanel.loading ? 'Loading...' : definitionPanel.word || selectedWord}
            </h3>
            <button onClick={() => setDefinitionPanel(null)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          {definitionPanel.loading ? (
            <div className="flex-grow flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-400" size={32} />
            </div>
          ) : definitionPanel.error ? (
            <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-6 text-center">
              <p className="text-red-400 font-bold mb-2">Word Not Found</p>
              <p className="text-slate-400 text-sm">{definitionPanel.error}</p>
            </div>
          ) : (
            <div className="space-y-6 flex-grow flex flex-col">
              <div>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Definition</p>
                <p className="text-white leading-relaxed">{definitionPanel.definition}</p>
              </div>

              {definitionPanel.example && (
                <div>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Example</p>
                  <p className="text-slate-300 italic leading-relaxed">"{definitionPanel.example}"</p>
                </div>
              )}

              <div className="flex-grow"></div>

              <div className="space-y-3">
                {((settings.apiSource === 'free-dictionary' && definitionPanel.phonetics?.some(p => p.audio)) ||
                  (settings.apiSource === 'merriam-webster' && definitionPanel.audioUrl)) && (
                  <button
                    onClick={() => playAudio(definitionPanel)}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors font-bold"
                  >
                    <Volume2 size={20} />
                    Play Pronunciation
                  </button>
                )}

                {!settings.autoSave && (
                  <button
                    onClick={addToLibrary}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-colors font-bold text-lg"
                  >
                    <Plus size={20} />
                    Add to Library
                  </button>
                )}

                {settings.autoSave && (
                  <div className="bg-green-500/10 border-2 border-green-500/30 rounded-2xl p-4 text-center">
                    <p className="text-green-400 text-sm font-bold">✓ Auto-saved to library</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
