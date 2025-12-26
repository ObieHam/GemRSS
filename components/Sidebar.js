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
    <div className={`fixed top-0 left-0 h-full bg-[#1e293b] border-r border-slate-700/50 transition-all duration-300 z-50 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
      <div className="p-3 h-full flex flex-col">
        <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} mb-6`}>
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="Logo" className="w-6 h-6 rounded" />
              <span className="text-base font-black tracking-tight text-white uppercase">LEXIBUILD</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400">
            {sidebarOpen ? <X size={18} /> : <Menu size={24} className="text-indigo-400" />}
          </button>
        </div>

        <nav className="space-y-1 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center ${sidebarOpen ? 'gap-3 p-2.5' : 'justify-center p-2.5'} rounded-lg transition-all ${
                view === item.id 
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' 
                : 'hover:bg-slate-700/30 text-slate-400'
              }`}
              title={!sidebarOpen ? item.label : ''}
            >
              <item.icon size={sidebarOpen ? 18 : 24} />
              {sidebarOpen && <span className="text-sm font-semibold">{item.label}</span>}
            </button>
          ))}
        </nav>

        <button
          onClick={onSettingsClick}
          className={`flex items-center ${sidebarOpen ? 'gap-3 p-2.5' : 'justify-center p-2.5'} rounded-lg hover:bg-slate-700/30 text-slate-400 transition-all`}
        >
          <Settings size={sidebarOpen ? 18 : 24} />
          {sidebarOpen && <span className="text-sm font-semibold">Settings</span>}
        </button>
      </div>
    </div>
  );
}
