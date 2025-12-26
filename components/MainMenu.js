import { Upload, FileText, Settings, Brain, Volume2 } from 'lucide-react';

export default function MainMenu({ setView, onSettingsClick }) {
  const LOGO_URL = "https://raw.githubusercontent.com/ObieHam/FileIcons/main/Untitled-1.png";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="bg-indigo-500 p-1 rounded-2xl shadow-2xl shadow-indigo-500/30 overflow-hidden">
              <img src={LOGO_URL} alt="LexiBuild Logo" className="w-16 h-16 object-cover" />
            </div>
          </div>
          <h1 className="text-7xl font-black tracking-tighter mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            LEXIBUILD
          </h1>
          <p className="text-slate-400 text-xl font-medium">Smart Vocabulary Builder</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setView('browse')}
            className="group bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-purple-500 p-8 rounded-3xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 md:col-span-2"
          >
            <div className="flex items-center gap-4 mb-4">
               <img src={LOGO_URL} className="w-10 h-10 rounded-lg group-hover:scale-110 transition-transform" />
               <h3 className="text-2xl font-bold text-white">Words and Stats</h3>
            </div>
            <p className="text-slate-400 text-sm">View library and monitor your learning progress</p>
          </button>

          <button
            onClick={() => setView('parse')}
            className="group bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-indigo-500 p-8 rounded-3xl transition-all duration-300 hover:scale-105"
          >
            <Upload size={40} className="text-indigo-400 mb-4" />
            <h3 className="text-2xl font-bold mb-2 text-white">Parse PDF</h3>
            <p className="text-slate-400 text-sm">Extract vocabulary from document</p>
          </button>

          <button
            onClick={() => setView('reader')}
            className="group bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-pink-500 p-8 rounded-3xl transition-all duration-300 hover:scale-105"
          >
            <FileText size={40} className="text-pink-400 mb-4" />
            <h3 className="text-2xl font-bold mb-2 text-white">PDF Reader</h3>
            <p className="text-slate-400 text-sm">Read and learn interactively</p>
          </button>

          <button
            onClick={() => setView('flashcards')}
            className="group bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-emerald-500 p-8 rounded-3xl transition-all duration-300 hover:scale-105"
          >
            <Brain size={40} className="text-emerald-400 mb-4" />
            <h3 className="text-2xl font-bold mb-2 text-white">Flashcards</h3>
            <p className="text-slate-400 text-sm">Practice with spaced repetition</p>
          </button>

          <button
            onClick={() => setView('spelling')}
            className="group bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-blue-500 p-8 rounded-3xl transition-all duration-300 hover:scale-105"
          >
            <Volume2 size={40} className="text-blue-400 mb-4" />
            <h3 className="text-2xl font-bold mb-2 text-white">Spelling Practice</h3>
            <p className="text-slate-400 text-sm">Master vocabulary through typing</p>
          </button>
        </div>

        <div className="mt-12">
          <button
            onClick={onSettingsClick}
            className="w-full p-6 bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-indigo-500 rounded-3xl transition-all flex items-center justify-center gap-3"
          >
            <Settings size={32} className="text-slate-400" />
            <span className="text-xl font-bold text-slate-400">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
