import { LayoutDashboard, Upload, FileText, Brain, Volume2, List, BarChart3, Settings, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar({ view, setView, sidebarOpen, setSidebarOpen, onSettingsClick }) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'parse', label: 'Parse PDF', icon: Upload },
    { id: 'reader', label: 'PDF Reader', icon: FileText },
    { id: 'flashcards', label: 'Flashcards', icon: Brain },
    { id: 'flashcard-stats', label: 'Flashcard Stats', icon: BarChart3 },
    { id: 'spelling', label: 'Spelling Practice', icon: Volume2 },
    { id: 'spelling-stats', label: 'Spelling Stats', icon: BarChart3 },
    { id: 'browse', label: 'Library', icon: List },
  ];

  return (
    <div className={`fixed top-0 left-0 h-full bg-[#1e293b] border-r border-slate-700/50 transition-all duration-300 z-50 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
      <div className="p-3 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          {sidebarOpen && <div className="text-xl font-black text-white ml-2">LexiBuild</div>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-all ml-auto"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <ChevronLeft size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
          </button>
        </div>
        
        <nav className="space-y-1 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center ${sidebarOpen ? 'gap-3 p-2.5' : 'justify-center p-2.5'} rounded-lg transition-all ${
                view === item.id ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'hover:bg-slate-700/30 text-slate-400'
              }`}
            >
              <item.icon size={sidebarOpen ? 18 : 24} />
              {sidebarOpen && <span className="text-sm font-semibold">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
