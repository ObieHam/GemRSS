import { LayoutDashboard, Upload, FileText, Brain, Volume2, List, Settings, Menu, X } from 'lucide-react';

export default function Sidebar({ view, setView, sidebarOpen, setSidebarOpen, onSettingsClick }) {
  const LOGO_URL = "https://raw.githubusercontent.com/ObieHam/FileIcons/main/Untitled-1.png";

  const menuItems = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'parse', label: 'Parse New PDF', icon: Upload },
    { id: 'reader', label: 'PDF Reader', icon: FileText },
    { id: 'flashcards', label: 'Flashcards', icon: Brain },
    { id: 'spelling', label: 'Spelling Practice', icon: Volume2 },
    { id: 'browse', label: 'Words and Stats', icon: List },
  ];

  return (
    <div className={`fixed top-0 left-0 h-full bg-[#1e293b] border-r border-slate-700/50 transition-all duration-300 z-50 ${sidebarOpen ? 'w-72' : 'w-20'}`}>
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-10">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Logo" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-black tracking-tight text-white">LEXIBUILD</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                view === item.id 
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                : 'hover:bg-slate-700/30 text-slate-400'
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-semibold">{item.label}</span>}
            </button>
          ))}
        </nav>

        <button
          onClick={onSettingsClick}
          className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-700/30 text-slate-400 transition-all"
        >
          <Settings size={20} />
          {sidebarOpen && <span className="font-semibold">Settings</span>}
        </button>
      </div>
    </div>
  );
}
