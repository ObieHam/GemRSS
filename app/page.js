"use client";
import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Upload, Download, Search, BookOpen, Loader2 } from 'lucide-react';

// --- PDF.js Setup ---
// We import the main library and configure the worker needed for parsing off the main thread.
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
// Setting up the worker via CDN ensures compatibility in Vercel's environment without complex webpack config.
// Make sure the version number matches exactly what is in your package.json
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;


// Define stop words outside component to avoid re-creating on every render
const STOP_WORDS = new Set(["the", "and", "was", "for", "that", "with", "this", "are", "have", "from", "but", "not", "you", "all", "any", "can", "had", "her", "him", "his", "its", "one", "our", "out", "she", "there", "their", "they", "will", "would"]);

export default function VocabApp() {
  const [words, setWords] = useState([]);
  // Loading state is now an object to show specific status messages
  const [loadingStatus, setLoadingStatus] = useState({ isLoading: false, message: '' });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    const allWords = await db.vocabulary.toArray();
    // Sort by date added, newest first
    setWords(allWords.sort((a, b) => b.dateAdded - a.dateAdded));
  };


  // --- Helper func: Extracts text from PDF file ---
  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      setLoadingStatus({ isLoading: true, message: `Reading PDF page ${i} of ${pdf.numPages}...` });
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      // Join text items with spaces
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += pageText + " \n";
    }
    return fullText;
  };


  // --- Core Logic: Process raw text, filter, fetch APIs, save to DB ---
  const processTextContent = async (rawText) => {
    setLoadingStatus({ isLoading: true, message: 'Analyzing text and splitting sentences...' });
    
    // Basic sentence splitting (imperfect, but functional for this use case)
    // Cleans up newlines and splits by punctuation
    const cleanText = rawText.replace(/\n/g, " ");
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];

    let processedCount = 0;
    const totalSentences = sentences.length;

    for (const sentence of sentences) {
      // Find words using Regex, convert to lowercase
      const cleanWords = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g);
      if (!cleanWords) continue;

      for (const word of cleanWords) {
        if (STOP_WORDS.has(word)) continue;

        // Check IndexedDB first to avoid unnecessary API calls
        const exists = await db.vocabulary.where('word').equals(word).first();
        
        if (!exists) {
           setLoadingStatus({ isLoading: true, message: `Fetching definition for: "${word}"...` });
          try {
            // Call our internal Next.js API route
            const res = await fetch(`/api/define?word=${word}`);
            if(res.ok) {
                 const info = await res.json();
                 // Only add if definition exists and wasn't an error
                 if (!info.error && info.definition !== "Definition not found") {
                   await db.vocabulary.add({
                     word,
                     definition: info.definition,
                     pronunciation: info.pronunciation,
                     context: sentence.trim(),
                     dateAdded: new Date().getTime() // Store as timestamp for easier sorting
                   });
                 }
            }
          } catch (e) { console.error(`Error fetching ${word}:`, e); }
        }
      }
      processedCount++;
      // Optional: update status every X sentences to avoid too many re-renders
      if(processedCount % 5 === 0 || processedCount === totalSentences) {
         setLoadingStatus({ isLoading: true, message: `Processing vocabulary (${Math.round((processedCount / totalSentences) * 100)}%)...` });
      }
    }
  };


  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoadingStatus({ isLoading: true, message: 'Starting upload...' });
    let textContent = "";

    try {
      if (file.type === "application/pdf") {
        textContent = await extractTextFromPDF(file);
      } else if (file.type === "text/plain") {
        textContent = await file.text();
      } else {
        alert("Unsupported file type. Please upload .txt or .pdf");
        setLoadingStatus({ isLoading: false, message: '' });
        return;
      }

      // If text was extracted successfully, process it
      if (textContent) {
        await processTextContent(textContent);
      }

    } catch (err) {
      console.error("Error during file processing:", err);
      alert("An error occurred while processing the file. See console.");
    } finally {
      await loadWords();
      setLoadingStatus({ isLoading: false, message: '' });
      e.target.value = null; // Reset input so same file can be uploaded again if needed
    }
  };

  const exportCSV = () => {
    // Ensure context doesn't break CSV with commas or quotes by wrapping in quotes and escaping internal quotes
    const escapeCSV = (str) => `"${(str || "").replace(/"/g, '""')}"`;

    const headers = ["Word", "Pronunciation", "Definition", "Context Example"];
    const rows = words.map(w => [
        escapeCSV(w.word),
        escapeCSV(w.pronunciation),
        escapeCSV(w.definition),
        escapeCSV(w.context)
    ].join(","));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    
    // Create a temporary link to trigger download
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "my_vocabulary.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
            <h1 className="text-3xl font-extrabold text-indigo-700 flex items-center gap-3">
            <BookOpen className="stroke-[3px]" /> LexiBuild
            </h1>
            <p className="text-gray-500 text-sm mt-1">Build vocabulary from your reading inputs</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          {/* File Input Label serves as the button */}
          <label className={`flex-1 md:flex-none bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold cursor-pointer hover:bg-indigo-700 flex justify-center items-center gap-2 transition shadow-sm ${loadingStatus.isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            {loadingStatus.isLoading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
            Upload PDF/TXT
            {/* Accept both .txt and .pdf */}
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,application/pdf" disabled={loadingStatus.isLoading}/>
          </label>
          <button onClick={exportCSV} className="flex-1 md:flex-none bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 flex justify-center items-center gap-2 transition shadow-sm" disabled={words.length === 0}>
            <Download size={20} /> Export CSV
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder={`Search through ${words.length} words...`}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition shadow-sm"
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          />
        </div>

        {/* Detailed Loading State Indicator */}
        {loadingStatus.isLoading && (
          <div className="mb-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center animate-pulse">
             <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
             <p className="text-indigo-800 font-medium text-lg">{loadingStatus.message}</p>
             <p className="text-indigo-600 text-sm mt-2">Large files may take a minute. Please don't close the tab.</p>
          </div>
        )}

        {/* Empty State */}
        {!loadingStatus.isLoading && words.length === 0 && (
            <div className="text-center py-20 text-gray-400 flex flex-col items-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <Upload size={48} className="mb-4 text-gray-300" />
                <p className="text-lg">No words yet. Upload a PDF or TXT file to get started!</p>
            </div>
        )}

        {/* Vocabulary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {words.filter(w => w.word.includes(searchTerm)).map((item) => (
            <div key={item.id} className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all group">
              <div className="flex justify-between items-end mb-3">
                <h2 className="text-2xl font-bold text-gray-800 capitalize group-hover:text-indigo-700 transition">{item.word}</h2>
                {item.pronunciation && <span className="text-sm text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded-md">/{item.pronunciation}/</span>}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">{item.definition}</p>
              <div className="bg-slate-50 p-4 rounded-xl text-sm text-gray-600 italic border-l-4 border-indigo-300 relative">
                <span className="absolute -top-2 -left-1 text-3xl text-indigo-200 leading-none">“</span>
                <p className="relative z-10 ml-2 line-clamp-3">{item.context}”</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}