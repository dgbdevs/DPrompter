import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { FontSize } from '../lib/scriptParser';
import { Player } from './Player';
import { SearchOverlay } from './SearchOverlay';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAutoplay } from '../hooks/useAutoplay';
import { Settings, ChevronDown, GripHorizontal } from 'lucide-react';
import { getAllWebviewWindows } from '@tauri-apps/api/webviewWindow';

const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
  { value: 'lg',  label: 'LG' },
  { value: 'xl',  label: 'XL' },
  { value: '2xl', label: '2XL' },
  { value: '3xl', label: '3XL' },
];

export const TeleprompterShell: React.FC = () => {
  const { activeScriptId, scripts, isPlaying, setActiveScriptId, updateScript } = useStore();
  const [scriptDropdownOpen, setScriptDropdownOpen] = useState(false);
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fontDropdownRef = useRef<HTMLDivElement>(null);

  useKeyboardShortcuts();
  useAutoplay();

  const activeScript = scripts.find((s) => s.id === activeScriptId);
  const activeIndex = scripts.findIndex((s) => s.id === activeScriptId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setScriptDropdownOpen(false);
      }
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target as Node)) {
        setFontDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openSettings = async () => {
    try {
      const windows = await getAllWebviewWindows();
      const editor = windows.find(w => w.label === 'editor');
      if (editor) {
        await editor.show();
        await editor.setFocus();
      }
    } catch (err) {
      console.error('Failed to open settings:', err);
    }
  };

  const setFontSize = (value: FontSize) => {
    if (!activeScript) return;
    updateScript(activeScript.id, { fontSize: value });
    setFontDropdownOpen(false);
  };

  return (
    <main className="h-screen w-screen flex flex-col items-center overflow-hidden bg-[#0a0a0f] select-none">
      {/* Drag handle - this is the grabbable area to move the window */}
      <div
        data-tauri-drag-region
        className="w-full h-6 shrink-0 flex items-center justify-center cursor-move"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <GripHorizontal size={14} className="text-white/10 pointer-events-none" />
      </div>

      {/* Player area */}
      <div className="w-full flex-1 relative overflow-hidden rounded-xl bg-black/90 mx-2">
        <Player />
        <SearchOverlay />
      </div>

      {/* Controls bar — BELOW the player, never overlapping text */}
      <div className="w-full shrink-0 flex items-center justify-end gap-1.5 px-4 py-1.5 bg-[#0a0a0f]">
        {/* Script Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setScriptDropdownOpen(!scriptDropdownOpen)}
            className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-3 py-1 hover:bg-white/10 transition-all"
          >
            <span className="text-white/50 font-bold text-[8px] uppercase tracking-tight whitespace-nowrap max-w-[100px] truncate">
              {activeScript ? `S${activeIndex + 1}: ${activeScript.title}` : 'No Script'}
            </span>
            <ChevronDown size={10} className={`text-white/30 transition-transform ${scriptDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {scriptDropdownOpen && (
            <div className="absolute bottom-full mb-1 right-0 bg-[#111] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[160px] z-[80]">
              {scripts.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => { setActiveScriptId(s.id); setScriptDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-[11px] font-semibold transition-all ${
                    s.id === activeScriptId
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Script {idx + 1}: {s.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Speed Badge */}
        <div className="bg-white/5 border border-white/10 rounded-full h-6 flex items-center px-2.5">
          <span className="text-white/50 font-bold text-[9px] tabular-nums">
            {activeScript?.speedMultiplier.toFixed(1) ?? '1.0'}x
          </span>
        </div>

        {/* Font Size Dropdown */}
        <div className="relative" ref={fontDropdownRef}>
          <button
            onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
            className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2.5 h-6 hover:bg-white/10 transition-all"
          >
            <span className="text-white/50 font-bold text-[8px] uppercase tracking-tight">
              {(activeScript?.fontSize || 'xl').toUpperCase()}
            </span>
            <ChevronDown size={8} className={`text-white/30 transition-transform ${fontDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {fontDropdownOpen && (
            <div className="absolute bottom-full mb-1 right-0 bg-[#111] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[60px] z-[80]">
              {FONT_SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFontSize(opt.value)}
                  className={`w-full text-left px-3 py-1.5 text-[11px] font-bold transition-all ${
                    activeScript?.fontSize === opt.value
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Playing indicator */}
        {isPlaying && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-full h-6 flex items-center px-2.5">
            <span className="text-green-400 font-bold text-[8px] uppercase tracking-wider animate-pulse">▶</span>
          </div>
        )}

        {/* Settings Gear */}
        <button
          onClick={openSettings}
          className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full h-6 w-6 flex items-center justify-center transition-all active:scale-95 group"
          title="Settings (Ctrl+E)"
        >
          <Settings size={11} className="text-white/70 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </div>
    </main>
  );
};
