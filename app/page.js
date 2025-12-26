// app/page.js
"use client";
import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../lib/storage';
import { getSettings, saveSettings } from '../lib/utils';
import Sidebar from '../components/Sidebar';
import MainMenu from '../components/MainMenu'; // Integrated your landing menu
import DashboardView from '../components/DashboardView';
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
  // Load initial states from localStorage to ensure "correct view" on startup
  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastView') || 'home';
    }
    return 'home';
  });

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

  // Persist view changes
  useEffect(() => {
    localStorage.setItem('lastView', view);
  }, [view]);

  // Persist sidebar state changes
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
      {/* Sidebar is now persistent and never unmounts */}
      <Sidebar 
        view={view} 
        setView={setView} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        onSettingsClick={() => setShowSettings(true)}
      />

      {/* Main content area shifts based on sidebar state */}
      <main className={`flex-1 transition-all duration-500 ease-in-out ${sidebarOpen ? 'ml-64' : 'ml-16'} h-screen overflow-hidden`}>
        <div className="h-full w-full">
          {/* Default 'home' now loads your high-quality MainMenu */}
          {view === 'home' && (
            <div className="h-full overflow-y-auto">
              <MainMenu setView={setView} onSettingsClick={() => setShowSettings(true)} />
            </div>
          )}

          {view === 'dashboard' && (
            <div className="p-8 h-full overflow-y-auto">
              <DashboardView words={words} setView={setView} />
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

          {/* All other views remain standard */}
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
