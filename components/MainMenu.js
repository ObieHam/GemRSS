import { Upload, FileText, Brain, Volume2, List, Settings } from 'lucide-react';

export default function MainMenu({ setView, onSettingsClick }) {
  return (
    <div className="p-12 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col items-center mb-16 text-center">
        <div className="bg-indigo-600 p-4 rounded-3xl mb-6 shadow-2xl shadow-indigo-500/20 ring-4 ring-indigo-500/10">
          <Brain size={48} className="text-white" />
        </div>
        <h1 className="text-7xl font-black text-white mb-4 tracking-tighter">Welcome back!</h1>
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
          className="group bg-[#1e293b] hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/30 p-8 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex items-center gap-6 text-left"
        >
          <div className="bg-slate-800 p-4 rounded-2xl group-hover:bg-indigo-500/10 transition-colors">
            <List className="text-indigo-400" size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">Library</h3>
            <p className="text-slate-500 text-sm">Browse your saved words and track progress</p>
          </div>
        </button>

        <button
          onClick={onSettingsClick}
          className="group bg-[#1e293b] hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/30 p-8 rounded-3xl transition-all duration-300 hover:scale-[1.01] shadow-xl flex items-center gap-6 text-left"
        >
          <div className="bg-slate-800 p-4 rounded-2xl group-hover:bg-indigo-500/10 transition-colors">
            <Settings className="text-indigo-400" size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">Settings</h3>
            <p className="text-slate-500 text-sm">Configure your learning preferences</p>
          </div>
        </button>
      </div>
    </div>
  );
}
