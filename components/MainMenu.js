import { Upload, FileText, Settings, Brain, Volume2, BookOpen } from 'lucide-react';

export default function MainMenu({ setView, onSettingsClick }) {
  const LOGO_URL = "https://raw.githubusercontent.com/ObieHam/FileIcons/main/Untitled-1.png";

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center p-8">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1 rounded-2xl shadow-2xl shadow-indigo-500/30 overflow-hidden">
              <img src={LOGO_URL} alt="LexiBuild Logo" className="w-16 h-16 object-cover" />
            </div>
          </div>
          <h1 className="text-7xl font-black tracking-tighter mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Welcome back!
          </h1>
          <p className="text-slate-400 text-xl font-medium">Ready to expand your vocabulary today?</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => setView('parse')}
            className="group bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-105 shadow-2xl shadow-indigo-500/20 aspect-square"
          >
            <Upload size={48} className="text-white mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white leading-tight">Parse New PDF</h3>
            <p className="text-white/70 text-sm mt-2">Extract vocabulary</p>
          </button>

          <button
            onClick={() => setView('reader')}
            className="group bg-gradient-to-br from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-105 shadow-2xl shadow-pink-500/20 aspect-square"
          >
            <FileText size={48} className="text-white mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white leading-tight">PDF Reader</h3>
            <p className="text-white/70 text-sm mt-2">Read interactively</p>
          </button>

          <button
            onClick={() => setView('flashcards')}
            className="group bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-105 shadow-2xl shadow-emerald-500/20 aspect-square"
          >
            <Brain size={48} className="text-white mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white leading-tight">Flashcard Session</h3>
            <p className="text-white/70 text-sm mt-2">Review due cards</p>
          </button>

          <button
            onClick={() => setView('spelling')}
            className="group bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-105 shadow-2xl shadow-blue-500/20 aspect-square"
          >
            <Volume2 size={48} className="text-white mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white leading-tight">Spelling Practice</h3>
            <p className="text-white/70 text-sm mt-2">Master typing</p>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <button
            onClick={() => setView('browse')}
            className="group bg-[#1e293b] hover:bg-slate-800 border-2 border-slate-700/50 hover:border-purple-500/50 p-8 rounded-[2.5rem] transition-all duration-300 hover:scale-[1.02] shadow-xl"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-purple-500/20 p-3 rounded-xl">
                <BookOpen size={32} className="text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Library</h3>
            </div>
            <p className="text-slate-400 text-sm text-left">Browse your saved words and track progress</p>
          </button>

          <button
            onClick={onSettingsClick}
            className="group bg-[#1e293b] hover:bg-slate-800 border-2 border-slate-700/50 hover:border-indigo-500/50 p-8 rounded-[2.5rem] transition-all duration-300 hover:scale-[1.02] shadow-xl"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-indigo-500/20 p-3 rounded-xl">
                <Settings size={32} className="text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Settings</h3>
            </div>
            <p className="text-slate-400 text-sm text-left">Configure your learning preferences</p>
          </button>
        </div>
      </div>
    </div>
  );
}
