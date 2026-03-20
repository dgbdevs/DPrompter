import React, { useState, useEffect } from 'react';
import { useStore, Script, FontSize } from '../../store/useStore';
import { Plus, Trash2, FileText, Save, Check, ChevronDown } from 'lucide-react';

const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
  { value: 'lg',  label: 'Large' },
  { value: 'xl',  label: 'XL' },
  { value: '2xl', label: '2XL' },
  { value: '3xl', label: '3XL' },
];

export const ScriptsTab: React.FC = () => {
  const { scripts, activeScriptId, updateScript, addScript, deleteScript, setActiveScriptId } = useStore();
  const activeScript = scripts.find((s) => s.id === activeScriptId);
  const activeIndex = scripts.findIndex((s) => s.id === activeScriptId);

  // Local editing state
  const [localTitle, setLocalTitle] = useState('');
  const [localContent, setLocalContent] = useState('');
  const [localSpeed, setLocalSpeed] = useState(1.0);
  const [localFontSize, setLocalFontSize] = useState<FontSize>('xl');
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Sync local state when active script changes
  useEffect(() => {
    if (activeScript) {
      setLocalTitle(activeScript.title);
      setLocalContent(activeScript.content);
      setLocalSpeed(activeScript.speedMultiplier);
      setLocalFontSize(activeScript.fontSize || 'xl');
      setDirty(false);
      setSaved(false);
    }
  }, [activeScriptId]); // intentionally only on id change

  const handleCreate = () => {
    const newScript: Script = {
      id: crypto.randomUUID(),
      title: 'Sin título',
      content: '',
      speedMultiplier: 1.0,
      fontSize: 'xl',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addScript(newScript);
    setActiveScriptId(newScript.id);
  };

  const handleSave = () => {
    if (!activeScript) return;
    const trimmedTitle = localTitle.slice(0, 12) || 'Sin título';
    updateScript(activeScript.id, {
      title: trimmedTitle,
      content: localContent,
      speedMultiplier: localSpeed,
      fontSize: localFontSize,
    });
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const markDirty = () => {
    setDirty(true);
    setSaved(false);
  };

  return (
    <div className="h-full flex">
      {/* Script List */}
      <div className="w-72 border-r border-white/5 flex flex-col shrink-0">
        <div className="p-5 pb-3 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">Librería</h2>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-bold transition-all active:scale-95"
          >
            <Plus size={14} />
            Nuevo
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 settings-scrollbar">
          {scripts.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveScriptId(s.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center gap-3 group ${
                s.id === activeScriptId
                  ? 'bg-white/10 text-white shadow-md'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <FileText size={14} className="shrink-0 opacity-50" />
              <div className="min-w-0 flex-1">
                <p className="font-bold truncate">Script {idx + 1}: {s.title}</p>
                <p className="text-[10px] text-white/20 mt-0.5">{s.speedMultiplier.toFixed(1)}x · {(s.fontSize || 'xl').toUpperCase()} · {s.content.split('\n').filter(l => l.trim()).length} líneas</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Script Editor */}
      {activeScript ? (
        <div className="flex-1 flex flex-col p-6 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 mb-2">
                Script {activeIndex + 1}
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  maxLength={12}
                  value={localTitle}
                  onChange={(e) => { setLocalTitle(e.target.value.slice(0, 12)); markDirty(); }}
                  className="bg-transparent text-2xl font-black tracking-tight focus:outline-none placeholder:text-white/10 border-b border-transparent focus:border-white/20 transition-all pb-1 w-full max-w-xs"
                  placeholder="Título (max 12)"
                />
                <span className="text-[10px] text-white/20 font-mono shrink-0">{localTitle.length}/12</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSave}
                disabled={!dirty}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  saved
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : dirty
                      ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                      : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                }`}
              >
                {saved ? <Check size={14} /> : <Save size={14} />}
                {saved ? 'Guardado' : 'Guardar'}
              </button>
              <button
                onClick={() => deleteScript(activeScript.id)}
                className="p-2.5 text-red-400/40 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all active:scale-90"
                title="Eliminar script"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Speed + Font Size row */}
          <div className="flex items-center gap-6 mb-4 px-1">
            {/* Speed */}
            <div className="flex items-center gap-3 flex-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/25">Velocidad</span>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={localSpeed}
                onChange={(e) => { setLocalSpeed(parseFloat(e.target.value)); markDirty(); }}
                className="flex-1 accent-white h-1 max-w-[200px]"
              />
              <span className="text-xs font-bold text-white/50 tabular-nums w-10 text-right">{localSpeed.toFixed(1)}x</span>
            </div>

            {/* Font Size */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/25">Fuente</span>
              <div className="relative group">
                <select
                  value={localFontSize}
                  onChange={(e) => { setLocalFontSize(e.target.value as FontSize); markDirty(); }}
                  className="appearance-none bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[10px] font-black uppercase pl-3 pr-8 py-2 rounded-lg border border-white/5 hover:border-white/10 transition-all cursor-pointer outline-none w-28"
                >
                  {FONT_SIZE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#1a1a1a] text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-white/40 transition-colors" />
              </div>
            </div>
          </div>

          {/* Content Textarea */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/25">Contenido del script</span>
              <span className="text-[10px] text-white/20 font-mono">
                {localContent.split('\n').filter(l => l.trim()).length} líneas
              </span>
            </div>
            <textarea
              value={localContent}
              onChange={(e) => { setLocalContent(e.target.value); markDirty(); }}
              className="flex-1 bg-white/[0.03] rounded-2xl p-5 focus:outline-none focus:ring-1 focus:ring-white/10 resize-none font-['Inter'] font-normal text-sm leading-relaxed text-white/80 placeholder:text-white/10 border border-white/5 settings-scrollbar"
              placeholder="Pega o escribe tu guion aquí...&#10;Cada línea es una línea del teleprompter."
              spellCheck={false}
            />
          </div>

          {dirty && (
            <p className="text-[10px] text-amber-400/60 mt-2 font-bold">● Cambios sin guardar</p>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-white/10 gap-4">
          <FileText size={64} strokeWidth={1} />
          <p className="font-bold text-sm uppercase tracking-widest">Selecciona un script</p>
        </div>
      )}
    </div>
  );
};
