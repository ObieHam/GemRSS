"use client";
import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../lib/storage';
import { getSettings, saveSettings } from '../lib/utils';
import MainMenu from '../components/MainMenu';
import Sidebar from '../components/Sidebar';
import SettingsPanel from '../components/SettingsPanel';
import ParseView from '../components/ParseView';
import BrowseView from '../components/BrowseView';
import ReaderView from '../components/ReaderView';
import FlashcardView from '../components/FlashcardView';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
}

export default function LexiBuildApp() {
  const [view, setView] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [words, setWords] = useState([]);
  const [settings, setSettings] = useState(getSettings());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    const all = await db.vocabulary.toArray();
    setWords(all.sort((a, b) => b.dateAdded - a.dateAdded));
  };

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  if (view === 'home') {
    return (
      <>
        <MainMenu 
          setView={setView} 
          onSettingsClick={() => setShowSettings(true)}
        />
        {showSettings && (
          <SettingsPanel 
            settings={settings} 
            updateSettings={updateSettings} 
            onClose={() => setShowSettings(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
        <Sidebar 
          view={view} 
          setView={setView} 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen}
          onSettingsClick={() => setShowSettings(true)}
        />
        <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
          {view === 'parse' && <ParseView loadWords={loadWords} settings={settings} />}
          {view === 'browse' && <BrowseView words={words} loadWords={loadWords} settings={settings} />}
          {view === 'reader' && <ReaderView settings={settings} loadWords={loadWords} words={words} />}
          {view === 'flashcards' && <FlashcardView words={words} settings={settings} />}
        </div>
      </div>
      {showSettings && (
        <SettingsPanel 
          settings={settings} 
          updateSettings={updateSettings} 
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
