import { BookOpen, Upload, List, FileText, Settings } from 'lucide-react';

export default function MainMenu({ setView, onSettingsClick, wordCount }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="bg-indigo-500 p-4 rounded-2xl shadow-2xl shadow-indigo-500/30">
              <BookOpen size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-7xl font-black tracking-tighter mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            LEXIBUILD
          </h1>
          <p className="text-slate-400 text-xl font-medium">Smart Vocabulary Builder</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => setView('parse')}
            className="group bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-indigo-500 p-8 rounded-3xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20"
          >
            <Upload size={40} className="text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-2 text-white">Parse PDF</h3>
            <p className="text-slate-400 text-sm">Extract all vocabulary from document</p>
          </button>

          <button
            onClick={() => setView('browse')}
            className="group bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-purple-500 p-8 rounded-3xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
          >
            <List size={40} className="text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-2 text-white">Browse Library</h3>
            <p className="text-slate-400 text-sm">View your saved vocabulary</p>
          </button>

          <button
            onClick={() => setView('reader')}
            className="group bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-pink-500 p-8 rounded-3xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20"
          >
            <FileText size={40} className="text-pink-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-2 text-white">PDF Reader</h3>
            <p className="text-slate-400 text-sm">Read and learn interactively</p>
          </button>
        </div>

        <div className="mt-12 flex gap-6">
          <div className="flex-grow p-6 bg-slate-900 border-2 border-slate-700 rounded-3xl">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Library Stats</p>
            <p className="text-4xl font-black text-white">{wordCount} <span className="text-xl text-slate-500">words</span></p>
          </div>
          <button
            onClick={onSettingsClick}
            className="p-6 bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-indigo-500 rounded-3xl transition-all"
          >
            <Settings size={32} className="text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
