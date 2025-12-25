import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../lib/storage';
import { COMMON_WORDS } from '../lib/constants';
import { isValidWord } from '../lib/utils';
import { fetchDefinition } from '../lib/apiService';

export default function ParseView({ loadWords, settings }) {
  const [status, setStatus] = useState({ loading: false, msg: '', progress: 0, total: 0 });
  const fileInputRef = useRef(null);

  const processContent = async (text) => {
    const sentences = text.replace(/\n/g, " ").match(/[^.!?]+[.!?]+/g) || [text];
    const allTokens = [];
    const existingWords = await db.vocabulary.toArray();

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
    setStatus({ loading: true, msg: 'Processing words...', progress: 0, total });

    const batchSize = 10;
    for (let i = 0; i < allTokens.length; i += batchSize) {
      const batch = allTokens.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async ({ word, context }) => {
          try {
            const info = await fetchDefinition(word, settings);
            if (!info.error) {
              const baseExists = existingWords.find(w => w.word === info.word);
              if (!baseExists) {
                await db.vocabulary.add({
                  ...info,
                  context: context
                });
                existingWords.push({ word: info.word });
              }
            }
          } catch (e) {
            console.error("Definition fetch error", e);
          }
        })
      );
      setStatus({ loading: true, msg: 'Processing words...', progress: Math.min(i + batchSize, total), total });
    }

    await loadWords();
    setStatus({ loading: false, msg: 'Complete!', progress: total, total });
    setTimeout(() => setStatus({ loading: false, msg: '', progress: 0, total: 0 }), 2000);
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
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
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFile}
          accept=".pdf,.txt"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={status.loading}
          className="inline-flex items-center gap-4 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 rounded-2xl font-bold text-lg transition-colors"
        >
          <Upload size={24} />
          {status.loading ? 'Processing...' : 'Select File'}
        </button>
      </div>

      {status.loading && status.total > 0 && (
        <div className="mt-8 bg-slate-900 border-2 border-indigo-500/30 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-bold">{status.msg}</span>
            <span className="text-indigo-400 font-bold">{Math.round((status.progress / status.total) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
              style={{ width: `${(status.progress / status.total) * 100}%` }}
            ></div>
          </div>
          <p className="text-slate-400 text-sm mt-4 text-center">
            {status.progress} of {status.total} words processed
          </p>
        </div>
      )}

      {!status.loading && status.msg === 'Complete!' && (
        <div className="mt-8 bg-green-500/10 border-2 border-green-500/30 rounded-3xl p-8 text-center">
          <p className="text-green-400 font-bold text-xl">✓ Processing Complete!</p>
        </div>
      )}
    </div>
  );
}
