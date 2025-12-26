import { BookOpen, Upload, List, FileText, Settings, Menu, X, Brain, Volume2 } from 'lucide-react';

export default function Sidebar({ view, setView, sidebarOpen, setSidebarOpen, onSettingsClick }) {
  const iconSize = 24; // Increased from 20 for better visibility

  return (
    <div className={`fixed top-0 left-0 h-full bg-slate-950 border-r-2 border-slate-800 transition-all duration-300 z-50 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-8">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="bg-indigo-500 p-1.5 rounded-lg">
                <BookOpen size={20} className="text-white" />
              </div>
              <span className="text-lg font-black tracking-tight">LEXIBUILD</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors mx-auto">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="space-y-1">
          {[
            { id: 'home', label: 'Home', icon: BookOpen },
            { id: 'parse', label: 'Parse', icon: Upload },
            { id: 'browse', label: 'Library', icon: List },
            { id: 'reader', label: 'Reader', icon: FileText },
            { id: 'flashcards', label: 'Flashcards', icon: Brain },
            { id: 'spelling', label: 'Spelling', icon: Volume2 },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center ${sidebarOpen ? 'gap-3 p-3' : 'justify-center p-3'} rounded-xl transition-colors ${view === item.id ? 'bg-indigo-500 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
              title={!sidebarOpen ? item.label : ''}
            >
              <item.icon size={iconSize} />
              {sidebarOpen && <span className="font-bold text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
