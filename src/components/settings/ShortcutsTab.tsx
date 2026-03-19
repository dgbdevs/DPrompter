import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export const ShortcutsTab: React.FC = () => {
  const { shortcuts, updateShortcut, resetShortcuts } = useStore();
  const [listeningId, setListeningId] = useState<string | null>(null);
  const [pendingKeys, setPendingKeys] = useState<string | null>(null);

  const formatKeyCombo = useCallback((e: KeyboardEvent): string => {
    const parts: string[] = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');

    const key = e.key;
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      if (key === ' ') parts.push('Space');
      else if (key.length === 1) parts.push(key.toUpperCase());
      else parts.push(key);
    }

    return parts.join('+');
  }, []);

  useEffect(() => {
    if (!listeningId) return;

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Escape cancels
      if (e.key === 'Escape') {
        setListeningId(null);
        setPendingKeys(null);
        console.log(pendingKeys)
        return;
      }

      // Ignore bare modifier keys
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

      const combo = formatKeyCombo(e);
      if (!combo) return;

      setPendingKeys(combo);
      updateShortcut(listeningId, combo);
      setListeningId(null);
      setPendingKeys(null);
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [listeningId, formatKeyCombo, updateShortcut]);

  const getConflict = (commandId: string, keys: string): string | null => {
    const conflict = shortcuts.find((s) => s.commandId !== commandId && s.keys === keys);
    return conflict ? conflict.label : null;
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black tracking-tight">Accesos directos</h2>
          <p className="text-xs text-white/30 mt-1">Haz click en "Editar" y presiona la combinación de teclas deseada.</p>
        </div>
        <button
          onClick={resetShortcuts}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all active:scale-95"
        >
          <RotateCcw size={14} />
          Restaurar defaults
        </button>
      </div>

      {/* Shortcuts Table */}
      <div className="flex-1 overflow-y-auto settings-scrollbar">
        <div className="space-y-1">
          {/* Header Row */}
          <div className="grid grid-cols-[1fr_180px_100px] gap-4 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/20">
            <span>Comando</span>
            <span>Atajo actual</span>
            <span></span>
          </div>

          {shortcuts.map((shortcut) => {
            const conflict = getConflict(shortcut.commandId, shortcut.keys);
            const isListening = listeningId === shortcut.commandId;

            return (
              <div
                key={shortcut.commandId}
                className={`grid grid-cols-[1fr_180px_100px] gap-4 px-4 py-3 rounded-xl transition-all ${isListening ? 'bg-blue-500/10 ring-1 ring-blue-500/30' : 'hover:bg-white/[0.03]'
                  }`}
              >
                {/* Command name */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{shortcut.label}</span>
                  {conflict && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400/80 font-bold">
                      <AlertTriangle size={10} />
                      Conflicto con "{conflict}"
                    </span>
                  )}
                </div>

                {/* Current shortcut */}
                <div className="flex items-center">
                  {isListening ? (
                    <span className="px-3 py-1 bg-blue-500/20 rounded-lg text-xs font-bold text-blue-300 animate-pulse">
                      Presiona una tecla...
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      {shortcut.keys.split('+').map((key, i) => (
                        <span key={i}>
                          {i > 0 && <span className="text-white/20 mx-0.5">+</span>}
                          <kbd className="px-2 py-1 bg-white/10 rounded-md text-xs font-mono font-bold text-white/70 border border-white/10 shadow-sm">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Edit button */}
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => {
                      if (isListening) {
                        setListeningId(null);
                      } else {
                        setListeningId(shortcut.commandId);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${isListening
                      ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    {isListening ? 'Cancelar' : 'Editar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
