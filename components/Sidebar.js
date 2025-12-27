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
    <div className={`fixed top-0 left-0 h-full bg-[#1e293b] border-r border-slate-700/50 transition-all duration-300 z-50 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center mb-8 h-8">
          <div className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-full opacity-100' : 'w-0 opacity-0'}`}>
            <span className="text-xl font-black text-white ml-2">LexiBuild</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-all flex-shrink-0"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <ChevronLeft size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
          </button>
        </div>
        
        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center p-3 rounded-xl transition-all group ${
                view === item.id ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'hover:bg-slate-700/30 text-slate-400'
              }`}
            >
              {/* Keep icon size consistent at 20 to prevent jumping */}
              <item.icon size={20} className="flex-shrink-0" />
              
              {/* Animate text label with opacity and width instead of conditional rendering */}
              <span className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 overflow-hidden ${
                sidebarOpen ? 'ml-3 opacity-100 w-auto' : 'ml-0 opacity-0 w-0'
              }`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
