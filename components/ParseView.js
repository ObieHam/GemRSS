// components/ParseView.js
import { useRef, useState } from 'react';
import { Upload, CheckCircle2, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../lib/storage';
import { COMMON_WORDS } from '../lib/constants';
import { isValidWord } from '../lib/utils';
import { fetchDefinition } from '../lib/apiService';

export default function ParseView({ loadWords, settings }) {
  const [status, setStatus] = useState({ loading: false, msg: '', progress: 0, total: 0 });
  const [addedWords, setAddedWords] = useState([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const fileInputRef = useRef(null);

  const processContent = async (text) => {
    // ... (processContent logic remains the same as before)
    const sentences = text.replace(/\n/g, " ").match(/[^.!?]+[.!?]+/g) || [text];
    const allTokens = [];
    const existingWords = await db.vocabulary.toArray();
    const successfulWords = [];

    for (const sentence of sentences) {
      const tokens = sentence.toLowerCase().match(/\b[a-z]{4,}\b/g);
      if (!tokens) continue;
      for (const token of tokens) {
        if (COMMON_WORDS.has(token) || !isValidWord(token)) continue;
        const exists = existingWords.find(w => w.word === token);
        if (!exists && !allTokens.find(t => t.word === token)) {
          allTokens.push({ word: token, context: sentence.trim() });
        }
      }
    }

    const total = allTokens.length;
    setStatus({ loading: true, msg: `Initializing...`, progress: 0, total });

    const batchSize = 2;
    for (let i = 0; i < allTokens.length; i += batchSize) {
      const currentCount = Math.min(i + batchSize, total);
      setStatus(prev => ({ ...prev, msg: `Processing word ${currentCount} of ${total}`, progress: i, total }));

      const batch = allTokens.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async ({ word, context }) => {
          const info = await fetchDefinition(word, settings);
          return { word, context, info };
        })
      );

      if (batchResults.some(r => r.info?.rateLimit)) {
        setIsRateLimited(true);
        setStatus(prev => ({ ...prev, msg: 'Rate limit hit. Waiting 5s...' }));
        await new Promise(resolve => setTimeout(resolve, 5000));
        setIsRateLimited(false);
        i -= batchSize;
        continue;
      }

      await new Promise(resolve => setTimeout(resolve, 800));

      for (const { word, context, info } of batchResults) {
        if (!info.error) {
          const baseExists = existingWords.find(w => w.word === info.word);
          if (!baseExists) {
            await db.vocabulary.add({ ...info, context });
            existingWords.push({ word: info.word });
            successfulWords.push(info.word);
          }
        }
      }
    }

    await loadWords();
    setAddedWords(successfulWords);
    setStatus({ loading: false, msg: 'Complete!', progress: total, total });
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAddedWords([]);
    setStatus({ loading: true, msg: 'Reading file...', progress: 0, total: 0 });
    try {
      let text = "";
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(" ") + " ";
        }
      } else { text = await file.text(); }
      await processContent(text);
    } catch (err) { 
        alert("Error processing file"); 
        setStatus({ loading: false, msg: '', progress: 0, total: 0 }); 
    }
  };

  return (
    <div className="p-12 max-w-4xl mx-auto flex flex-col items-center text-center animate-in fade-in duration-500">
      <h2 className="text-6xl font-black text-white tracking-tighter mb-6">Parse PDF</h2>
      <p className="text-slate-400 text-xl mb-12 max-w-xl">
        Extract and save all unknown vocabulary from your documents automatically.
      </p>

      <div className="w-full bg-[#1e293b] border border-slate-700/50 rounded-3xl p-16 flex flex-col items-center justify-center shadow-2xl">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} accept=".pdf,.txt" />
        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={status.loading} 
          className="inline-flex items-center gap-4 px-12 py-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 rounded-2xl font-black text-2xl text-white transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
        >
          {status.loading ? <Loader2 className="animate-spin" size={32} /> : <Upload size={32} />} 
          {status.loading ? 'Processing...' : 'Select File'}
        </button>
      </div>

      {status.loading && (
        <div className={`w-full mt-8 bg-[#0f172a] border ${isRateLimited ? 'border-amber-500' : 'border-indigo-500/30'} rounded-3xl p-8 shadow-xl`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-black uppercase text-sm tracking-widest">{status.msg}</span>
            <span className="text-indigo-400 font-black text-lg">{status.total > 0 ? Math.round((status.progress / status.total) * 100) : 0}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
            <div className={`h-full transition-all duration-300 ${isRateLimited ? 'bg-amber-500' : 'bg-indigo-600'}`} style={{ width: `${status.total > 0 ? (status.progress / status.total) * 100 : 0}%` }}></div>
          </div>
        </div>
      )}

      {!status.loading && status.msg === 'Complete!' && (
        <div className="w-full mt-8 animate-in zoom-in-95 duration-500">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-10 text-center">
            <CheckCircle2 className="mx-auto text-emerald-400 mb-4" size={64} />
            <p className="text-emerald-400 font-black text-3xl tracking-tight mb-2">Processing Complete!</p>
            <p className="text-slate-400 text-xl font-medium">{addedWords.length} new words added to library</p>
          </div>
        </div>
      )}
    </div>
  );
}
