import { X } from 'lucide-react';

export default function SettingsPanel({ settings, updateSettings, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black text-white">Settings</h2>
          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
            <X size={24} className="text-white" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-slate-400 text-sm font-bold uppercase tracking-wider mb-3">Dictionary API Source</label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-750 transition-colors">
                <input
                  type="radio"
                  name="apiSource"
                  checked={settings.apiSource === 'free-dictionary'}
                  onChange={() => updateSettings({ ...settings, apiSource: 'free-dictionary' })}
                  className="w-5 h-5"
                />
                <div>
                  <div className="text-white font-bold">Free Dictionary API</div>
                  <div className="text-slate-400 text-sm">Unlimited calls, includes examples</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-750 transition-colors">
                <input
                  type="radio"
                  name="apiSource"
                  checked={settings.apiSource === 'merriam-webster'}
                  onChange={() => updateSettings({ ...settings, apiSource: 'merriam-webster' })}
                  className="w-5 h-5"
                />
                <div>
                  <div className="text-white font-bold">Merriam-Webster API</div>
                  <div className="text-slate-400 text-sm">Premium definitions (requires setup)</div>
                </div>
              </label>
            </div>
          </div>

          {settings.apiSource === 'free-dictionary' && (
            <div>
              <label className="block text-slate-400 text-sm font-bold uppercase tracking-wider mb-3">Pronunciation Accent</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'us', label: 'American' },
                  { value: 'uk', label: 'British' },
                  { value: 'au', label: 'Australian' }
                ].map(accent => (
                  <button
                    key={accent.value}
                    onClick={() => updateSettings({ ...settings, accent: accent.value })}
                    className={`p-4 rounded-xl font-bold transition-colors ${
                      settings.accent === accent.value
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {accent.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="flex items-center justify-between p-4 bg-slate-800 rounded-xl cursor-pointer">
              <div>
                <div className="text-white font-bold">Auto-save words in reader</div>
                <div className="text-slate-400 text-sm">Automatically add words to library when clicked</div>
              </div>
              <div className={`w-14 h-8 rounded-full transition-colors ${settings.autoSave ? 'bg-indigo-500' : 'bg-slate-700'} relative`}>
                <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${settings.autoSave ? 'translate-x-7' : 'translate-x-1'}`}></div>
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={settings.autoSave}
                onChange={(e) => updateSettings({ ...settings, autoSave: e.target.checked })}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
