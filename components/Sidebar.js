import { LayoutDashboard, Upload, FileText, Brain, Volume2, List, BarChart3, Settings, ChevronLeft, ChevronRight, Activity } from 'lucide-react';

export default function Sidebar({ view, setView, sidebarOpen, setSidebarOpen, onSettingsClick, isFlashing }) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'parse', label: 'Parse PDF', icon: Upload },
    { id: 'reader', label: 'PDF Reader', icon: FileText },
    { id: 'flashcards', label: 'Flashcards', icon: Brain },
    { id: 'flashcard-stats', label: 'Flashcard Stats', icon: BarChart3 },
    { id: 'spelling', label: 'Spelling Practice', icon: Volume2 },
    { id: 'shadowing', label: 'Shadowing', icon: Activity },
    { id: 'spelling-stats', label: 'Spelling Stats', icon: BarChart3 },
    { id: 'browse', label: 'Library', icon: List },
  ];

  return (
    <div className={`fixed top-0 left-0 h-full transition-all duration-300 z-50 border-r border-slate-700/50 
      ${sidebarOpen ? 'w-64' : 'w-16'} 
      ${isFlashing ? 'bg-emerald-500/20 shadow-[inset_-10px_0_20px_rgba(16,185,129,0.1)]' : 'bg-[#1e293b]'}`}>
      
      <div className="p-3 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          {sidebarOpen && <div className="text-xl font-black text-white ml-2 animate-in fade-in duration-300">LexiBuild</div>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-all ml-auto text-slate-400"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
        
        <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center transition-all ${
                sidebarOpen ? 'gap-3 p-2.5' : 'justify-center p-2.5'
              } rounded-lg ${
                view === item.id 
                  ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' 
                  : isFlashing ? 'text-emerald-400' : 'hover:bg-slate-700/30 text-slate-400'
              }`}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-semibold truncate animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-slate-700/50">
          <button
            onClick={onSettingsClick}
            className={`w-full flex items-center transition-all ${
              sidebarOpen ? 'gap-3 p-2.5' : 'justify-center p-2.5'
            } rounded-lg hover:bg-slate-700/30 text-slate-400`}
          >
            <Settings size={20} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-semibold animate-in fade-in slide-in-from-left-2 duration-300">Settings</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
