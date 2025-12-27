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
            className="group bg-gradient-to-br from-indigo-600 to-indigo-500 hover:scale-105 p-8 rounded-3xl flex flex-col items-center justify-center text-center transition-all shadow-xl shadow-indigo-500/10 aspect-square border border-white/5"
          >
            <Upload size={42} className="text-white mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-white leading-tight">Parse PDF</h3>
            <p className="text-white/60 text-xs mt-2">Extract words</p>
          </button>

          <button
            onClick={() => setView('reader')}
            className="group bg-gradient-to-br from-indigo-600 to-indigo-500 hover:scale-105 p-8 rounded-3xl flex flex-col items-center justify-center text-center transition-all shadow-xl shadow-indigo-500/10 aspect-square border border-white/5"
          >
            <FileText size={42} className="text-white mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-white leading-tight">PDF Reader</h3>
            <p className="text-white/60 text-xs mt-2">Interactive read</p>
          </button>

          <button
            onClick={() => setView('flashcards')}
            className="group bg-gradient-to-br from-indigo-600 to-indigo-500 hover:scale-105 p-8 rounded-3xl flex flex-col items-center justify-center text-center transition-all shadow-xl shadow-indigo-500/10 aspect-square border border-white/5"
          >
            <Brain size={42} className="text-white mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-white leading-tight">Flashcards</h3>
            <p className="text-white/60 text-xs mt-2">Review cards</p>
          </button>

          <button
            onClick={() => setView('spelling')}
            className="group bg-gradient-to-br from-indigo-600 to-indigo-500 hover:scale-105 p-8 rounded-3xl flex flex-col items-center justify-center text-center transition-all shadow-xl shadow-indigo-500/10 aspect-square border border-white/5"
          >
            <Volume2 size={42} className="text-white mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-white leading-tight">Spelling</h3>
            <p className="text-white/60 text-xs mt-2">Type practice</p>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <button
            onClick={() => setView('browse')}
            className="group bg-[#1e293b] hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/30 p-8 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl"
          >
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
