import { Upload, List, FileText, Settings, Menu, X, Brain, Volume2 } from 'lucide-react';

export default function Sidebar({ view, setView, sidebarOpen, setSidebarOpen, onSettingsClick }) {
  const LOGO_URL = "https://raw.githubusercontent.com/ObieHam/FileIcons/main/Untitled-1.png";

  return (
    <div className={`fixed top-0 left-0 h-full bg-slate-950 border-r-2 border-slate-800 transition-all duration-300 z-50 ${sidebarOpen ? 'w-72' : 'w-20'}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-12">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 p-1 rounded-xl overflow-hidden">
                <img src={LOGO_URL} alt="Logo" className="w-8 h-8 object-cover" />
              </div>
              <span className="text-xl font-black">LEXIBUILD</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="space-y-3">
          <button
            onClick={() => setView('home')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${view === 'home' ? 'bg-indigo-500 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
             <img src={LOGO_URL} className="w-5 h-5 rounded-sm invert grayscale brightness-200" />
            {sidebarOpen && <span className="font-bold">Home</span>}
          </button>
          <button
            onClick={() => setView('browse')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${view === 'browse' ? 'bg-indigo-500 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <List size={20} />
            {sidebarOpen && <span className="font-bold">Words & Stats</span>}
          </button>
          <button
            onClick={() => setView('parse')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${view === 'parse' ? 'bg-indigo-500 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Upload size={20} />
            {sidebarOpen && <span className="font-bold">Parse PDF</span>}
          </button>
          <button
            onClick={() => setView('reader')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${view === 'reader' ? 'bg-indigo-500 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <FileText size={20} />
            {sidebarOpen && <span className="font-bold">Reader</span>}
          </button>
          <button
            onClick={() => setView('flashcards')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${view === 'flashcards' ? 'bg-indigo-500 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Brain size={20} />
            {sidebarOpen && <span className="font-bold">Flashcards</span>}
          </button>
          <button
            onClick={() => setView('spelling')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${view === 'spelling' ? 'bg-indigo-500 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Volume2 size={20} />
            {sidebarOpen && <span className="font-bold">Spelling</span>}
          </button>
          <button
            onClick={onSettingsClick}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <Settings size={20} />
            {sidebarOpen && <span className="font-bold">Settings</span>}
          </button>
        </nav>
      </div>
    </div>
  );
}
