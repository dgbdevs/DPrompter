import React, { useState, useEffect } from 'react';
import { ScriptsTab } from './ScriptsTab';
import { ShortcutsTab } from './ShortcutsTab';
import { FileText, Keyboard } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

type Tab = 'scripts' | 'shortcuts';

export const SettingsWindow: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('scripts');

  // Intercept close → hide instead of destroy, and keep on top
  useEffect(() => {
    const win = getCurrentWindow();
    win.setAlwaysOnTop(true);
    const unlisten = win.onCloseRequested(async (event) => {
      event.preventDefault();
      await win.hide();
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'scripts', label: 'Scripts', icon: <FileText size={18} /> },
    { id: 'shortcuts', label: 'Accesos directos', icon: <Keyboard size={18} /> },
  ];

  return (
    <div className="h-screen w-screen bg-[#0a0a0f] text-white flex overflow-hidden font-['Inter']">
      {/* Sidebar Navigation */}
      <nav className="w-56 bg-black/40 border-r border-white/5 flex flex-col py-6 shrink-0">
        <div className="px-6 mb-8">
          <h1 className="text-xs font-black uppercase tracking-[0.25em] text-white/30">Settings</h1>
        </div>
        <div className="flex-1 px-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === tab.id
                  ? 'bg-white/10 text-white shadow-lg'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="px-6 mt-auto">
          <p className="text-[10px] text-white/15 font-mono">DPrompter v0.1.1</p>
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'scripts' && <ScriptsTab />}
        {activeTab === 'shortcuts' && <ShortcutsTab />}
      </main>
    </div>
  );
};
