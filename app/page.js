// app/page.js
"use client";
import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../lib/storage';
import { getSettings, saveSettings } from '../lib/utils';
import Sidebar from '../components/Sidebar';
import MainMenu from '../components/MainMenu';
import ParseView from '../components/ParseView';
import BrowseView from '../components/BrowseView';
import ReaderView from '../components/ReaderView';
import FlashcardView from '../components/FlashcardView';
import SpellingView from '../components/SpellingView';
import FlashcardStatsView from '../components/FlashcardStatsView';
import SpellingStatsView from '../components/SpellingStatsView';
import SettingsPanel from '../components/SettingsPanel';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export default function LexiBuildApp() {
  // Always start with 'home' view - don't persist reader view
  const [view, setView] = useState('home');
  
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarState');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  const [words, setWords] = useState([]);
  const [settings, setSettings] = useState(getSettings());
  const [showSettings, setShowSettings] = useState(false);

  // Only persist non-reader views
  useEffect(() => {
    if (view !== 'reader') {
      localStorage.setItem('lastView', view);
    }
  }, [view]);

  useEffect(() => {
    localStorage.setItem('sidebarState', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

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
    <div className="flex min-h-screen bg-[#0f172a] text-slate-100 font-sans overflow-hidden">
      <Sidebar 
        view={view} 
        setView={setView} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        onSettingsClick={() => setShowSettings(true)}
      />

      <main className={`flex-1 transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-64' : 'ml-16'} h-screen overflow-hidden`}>
        <div className="h-full w-full">
          {view === 'home' && (
            <div className="h-full overflow-y-auto">
              <MainMenu setView={setView} onSettingsClick={() => setShowSettings(true)} />
            </div>
          )}

          {view === 'reader' && (
            <ReaderView 
              settings={settings} 
              loadWords={loadWords} 
              words={words} 
              onExit={() => setView('home')} 
            />
          )}

          {view === 'parse' && <div className="p-8 h-full overflow-y-auto"><ParseView loadWords={loadWords} settings={settings} /></div>}
          {view === 'flashcards' && <div className="p-8 h-full overflow-y-auto"><FlashcardView words={words} settings={settings} /></div>}
          {view === 'flashcard-stats' && <div className="p-8 h-full overflow-y-auto"><FlashcardStatsView words={words} loadWords={loadWords} setView={setView} /></div>}
          {view === 'spelling' && <div className="p-8 h-full overflow-y-auto"><SpellingView words={words} settings={settings} /></div>}
          {view === 'spelling-stats' && <div className="p-8 h-full overflow-y-auto"><SpellingStatsView words={words} loadWords={loadWords} setView={setView} /></div>}
          {view === 'browse' && <div className="p-8 h-full overflow-y-auto"><BrowseView words={words} loadWords={loadWords} settings={settings} setView={setView} /></div>}
        </div>
      </main>

      {showSettings && <SettingsPanel settings={settings} updateSettings={updateSettings} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
