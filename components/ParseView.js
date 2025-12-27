// components/ParseView.js
import { useRef, useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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

    const batchSize = 2; // Small batch size ensures stability and UI responsiveness
    for (let i = 0; i < allTokens.length; i += batchSize) {
      const currentCount = Math.min(i + batchSize, total);
      setStatus(prev => ({ 
        ...prev, 
        msg: `Processing word ${currentCount} of ${total}`, 
        progress: i, 
        total 
      }));

      const batch = allTokens.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async ({ word, context }) => {
          const info = await fetchDefinition(word, settings);
          return { word, context, info };
        })
      );

      // Detect Rate Limit in batch
      if (batchResults.some(r => r.info?.rateLimit)) {
        setIsRateLimited(true);
        setStatus(prev => ({ ...prev, msg: 'Rate limit hit. Waiting 5 seconds...' }));
        await new Promise(resolve => setTimeout(resolve, 5000));
        setIsRateLimited(false);
        i -= batchSize; // Retry this batch
        continue;
      }

      // Stability delay to allow UI to update and prevent skipping
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
      } else {
        text = await file.text();
      }
      await processContent(text);
    } catch (err) {
      console.error(err);
      alert("Error processing file");
      setStatus({ loading: false, msg: '', progress: 0, total: 0 });
    }
  };

  return (
    <div className="p-12 max-w-4xl mx-auto">
      <h2 className="text-5xl font-black mb-8 text-white">Parse PDF</h2>
      <p className="text-slate-400 text-lg mb-12">Extract and save all vocabulary from your document</p>

      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-12 text-center">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} accept=".pdf,.txt" />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={status.loading}
          className="inline-flex items-center gap-4 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 rounded-2xl font-bold text-lg transition-colors text-white"
        >
          {status.loading ? <Loader2 className="animate-spin" /> : <Upload size={24} />}
          {status.loading ? 'Processing...' : 'Select File'}
        </button>
      </div>

      {status.loading && (
        <div className={`mt-8 bg-slate-900 border-2 ${isRateLimited ? 'border-amber-500' : 'border-indigo-500/30'} rounded-3xl p-8`}>
          <div className="flex items-center justify-between mb-4">
            <span className="flex items-center gap-2 text-white font-bold">
              {isRateLimited && <AlertCircle className="text-amber-500 animate-pulse" />}
              {status.msg}
            </span>
            <span className="text-indigo-400 font-bold">{status.total > 0 ? Math.round((status.progress / status.total) * 100) : 0}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${isRateLimited ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
              style={{ width: `${status.total > 0 ? (status.progress / status.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      )}

      {!status.loading && status.msg === 'Complete!' && (
        <div className="mt-8 space-y-6">
          <div className="bg-green-500/10 border-2 border-green-500/30 rounded-3xl p-8 text-center">
            <CheckCircle2 className="mx-auto text-green-400 mb-4" size={48} />
            <p className="text-green-400 font-bold text-2xl">Processing Complete!</p>
            <p className="text-slate-400 mt-2">{addedWords.length} new words added to library</p>
          </div>
        </div>
      )}
    </div>
  );
}
