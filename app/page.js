"use client";
import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../lib/storage';
import { getSettings, saveSettings } from '../lib/utils';
import Sidebar from '../components/Sidebar';
import DashboardView from '../components/DashboardView';
import ParseView from '../components/ParseView';
import BrowseView from '../components/BrowseView';
import ReaderView from '../components/ReaderView';
import FlashcardView from '../components/FlashcardView';
import SpellingView from '../components/SpellingView';
import FlashcardStatsView from '../components/FlashcardStatsView';
import SpellingStatsView from '../components/SpellingStatsView';
import SettingsPanel from '../components/SettingsPanel';

// Fix for PDF Parser: Set the worker source from CDN to match the installed library version
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export default function LexiBuildApp() {
  const [view, setView] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [words, setWords] = useState([]);
  const [settings, setSettings] = useState(getSettings());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => { loadWords(); }, []);

  const loadWords = async () => {
    const all = await db.vocabulary.toArray();
    setWords(all.sort((a, b) => b.dateAdded - a.dateAdded));
  };

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-100 font-sans">
      <Sidebar 
        view={view} 
        setView={setView} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        onSettingsClick={() => setShowSettings(true)}
      />

      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'} p-8`}>
        {view === 'home' && <DashboardView words={words} setView={setView} />}
        {view === 'parse' && <ParseView loadWords={loadWords} settings={settings} />}
        {view === 'reader' && <ReaderView settings={settings} loadWords={loadWords} words={words} />}
        {view === 'flashcards' && <FlashcardView words={words} settings={settings} />}
        {view === 'flashcard-stats' && <FlashcardStatsView words={words} loadWords={loadWords} setView={setView} />}
        {view === 'spelling' && <SpellingView words={words} settings={settings} />}
        {view === 'spelling-stats' && <SpellingStatsView words={words} loadWords={loadWords} setView={setView} />}
        {view === 'browse' && <BrowseView words={words} loadWords={loadWords} settings={settings} setView={setView} />}
      </main>

      {showSettings && <SettingsPanel settings={settings} updateSettings={updateSettings} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
