import { BookOpen, Upload, FileText, Settings, Brain } from 'lucide-react';

export default function MainMenu({ setView, onSettingsClick }) {
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <BookOpen size={40} className="text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-2 text-white">Word Library</h3>
            <p className="text-slate-400 text-sm">View and manage your vocabulary</p>
          </button>

          <button
            onClick={() => setView('reader')}
            className="group bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-pink-500 p-8 rounded-3xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20"
          >
            <FileText size={40} className="text-pink-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-2 text-white">PDF Reader</h3>
            <p className="text-slate-400 text-sm">Read and learn interactively</p>
          </button>

          <button
            onClick={() => setView('flashcards')}
            className="group bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-emerald-500 p-8 rounded-3xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20"
          >
            <Brain size={40} className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-2 text-white">Flashcards</h3>
            <p className="text-slate-400 text-sm">Practice with spaced repetition</p>
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
