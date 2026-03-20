import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { LazyStore } from '@tauri-apps/plugin-store';
import { getDisplayLines, FontSize, DisplayMode } from '../lib/scriptParser';

// Re-export FontSize and DisplayMode so other files can import from either place
export type { FontSize, DisplayMode };

// ── Tauri persistence adapter ──────────────────────────────────────────────────
const tauriStore = new LazyStore('teleprompter.bin');
const storage = {
  getItem: async (name: string) => {
    const value = await tauriStore.get(name);
    return value ? JSON.stringify(value) : null;
  },
  setItem: async (name: string, value: string) => {
    await tauriStore.set(name, JSON.parse(value));
    await tauriStore.save();
  },
  removeItem: async (name: string) => {
    await tauriStore.delete(name);
    await tauriStore.save();
  },
};

// ── Types ──────────────────────────────────────────────────────────────────────
export interface Script {
  id: string;
  title: string;
  content: string;
  speedMultiplier: number;
  fontSize: FontSize;
  displayMode: DisplayMode;
  createdAt: number;
  updatedAt: number;
}

export interface Shortcut {
  commandId: string;
  label: string;
  keys: string;
  displayValue: string;
}

export interface SearchState {
  isOpen: boolean;
  query: string;
  matches: number[];           // line indices (vertical) or char positions (horizontal)
  currentMatchIndex: number;
}

interface TeleprompterState {
  scripts: Script[];
  activeScriptId: string | null;
  shortcuts: Shortcut[];
  currentLineIndex: number;
  isPlaying: boolean;
  search: SearchState;
  marqueeSignal: { type: 'start' | 'end'; counter: number };

  addScript: (script: Script) => void;
  updateScript: (id: string, updates: Partial<Script>) => void;
  deleteScript: (id: string) => void;
  setActiveScriptId: (id: string) => void;
  setCurrentLineIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  advanceLine: () => void;
  prevLine: () => void;
  nextLineWithPause: () => void;
  goToStart: () => void;
  goToEnd: () => void;
  nextScript: () => void;
  prevScript: () => void;
  toggleDisplayMode: () => void;
  updateActiveScriptSpeed: (delta: number) => void;
  updateShortcut: (commandId: string, keys: string) => void;
  resetShortcuts: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
  searchNext: () => void;
  searchPrev: () => void;
}

// ── Helper to get lines for the active script ──────────────────────────────────
const getLinesForScript = (script: Script | undefined): string[] => {
  if (!script) return [];
  return getDisplayLines(script.content, script.fontSize || 'xl');
};

// ── Default data ───────────────────────────────────────────────────────────────
const DEFAULT_SHORTCUTS: Shortcut[] = [
  { commandId: 'togglePlay',    label: 'Play / Pause',            keys: 'Space',          displayValue: 'Space' },
  { commandId: 'prevLine',      label: 'Línea anterior',          keys: 'Alt+Q',          displayValue: 'Alt + Q' },
  { commandId: 'nextLine',      label: 'Línea siguiente',         keys: 'Alt+W',          displayValue: 'Alt + W' },
  { commandId: 'goToStart',     label: 'Ir al inicio',            keys: 'Alt+A',          displayValue: 'Alt + A' },
  { commandId: 'goToEnd',       label: 'Ir al final',             keys: 'Alt+Z',          displayValue: 'Alt + Z' },
  { commandId: 'prevScript',    label: 'Script anterior',         keys: 'Alt+ArrowLeft',  displayValue: 'Alt + ←' },
  { commandId: 'nextScriptKey', label: 'Script siguiente',        keys: 'Alt+ArrowRight', displayValue: 'Alt + →' },
  { commandId: 'speedUp',       label: 'Subir velocidad',         keys: 'Alt+ArrowUp',    displayValue: 'Alt + ↑' },
  { commandId: 'speedDown',     label: 'Bajar velocidad',         keys: 'Alt+ArrowDown',  displayValue: 'Alt + ↓' },
  { commandId: 'search',        label: 'Buscar en script',        keys: 'Ctrl+F',         displayValue: 'Ctrl + F' },
  { commandId: 'toggleSettings',label: 'Abrir/cerrar settings',   keys: 'Ctrl+E',         displayValue: 'Ctrl + E' },
  { commandId: 'toggleMode',    label: 'Cambiar modo (V/H)',      keys: 'Alt+M',          displayValue: 'Alt + M' },
];

const DEFAULT_SCRIPT: Script = {
  id: 'default',
  title: 'Bienvenida',
  content: 'Bienvenido a tu Teleprompter.\nPresiona Space para avanzar.\nCtrl+E para abrir settings.\nAlt+Q y Alt+W para navegar línea a línea.\nAlt+A ir al inicio, Alt+Z ir al final.',
  speedMultiplier: 1.0,
  fontSize: 'xl',
  displayMode: 'vertical',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// ── Store ──────────────────────────────────────────────────────────────────────
export const useStore = create<TeleprompterState>()(
  persist(
    (set, get) => ({
      scripts: [DEFAULT_SCRIPT],
      activeScriptId: 'default',
      shortcuts: [...DEFAULT_SHORTCUTS],
      currentLineIndex: 0,
      isPlaying: false,
      search: { isOpen: false, query: '', matches: [], currentMatchIndex: -1 },
      marqueeSignal: { type: 'start', counter: 0 },

      addScript: (script) => set((s) => ({ scripts: [...s.scripts, script] })),

      updateScript: (id, updates) =>
        set((s) => ({
          scripts: s.scripts.map((sc) =>
            sc.id === id ? { ...sc, ...updates, updatedAt: Date.now() } : sc
          ),
        })),

      deleteScript: (id) =>
        set((s) => {
          const remaining = s.scripts.filter((sc) => sc.id !== id);
          if (remaining.length === 0) {
            return { scripts: [DEFAULT_SCRIPT], activeScriptId: DEFAULT_SCRIPT.id, currentLineIndex: 0, isPlaying: false };
          }
          const nextActive = s.activeScriptId === id ? remaining[0].id : s.activeScriptId;
          return { scripts: remaining, activeScriptId: nextActive, currentLineIndex: 0, isPlaying: false };
        }),

      setActiveScriptId: (id) => set({ activeScriptId: id, currentLineIndex: 0, isPlaying: false }),

      setCurrentLineIndex: (index) => set({ currentLineIndex: index }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

      advanceLine: () => {
        const { currentLineIndex, activeScriptId, scripts } = get();
        const script = scripts.find((sc) => sc.id === activeScriptId);
        const lines = getLinesForScript(script);
        if (currentLineIndex < lines.length - 1) {
          set({ currentLineIndex: currentLineIndex + 1 });
        } else {
          set({ isPlaying: false });
        }
      },

      prevLine: () => {
        const { currentLineIndex } = get();
        if (currentLineIndex > 0) set({ currentLineIndex: currentLineIndex - 1, isPlaying: false });
      },

      nextLineWithPause: () => {
        const { currentLineIndex, activeScriptId, scripts } = get();
        const script = scripts.find((sc) => sc.id === activeScriptId);
        const lines = getLinesForScript(script);
        if (currentLineIndex < lines.length - 1) {
          set({ currentLineIndex: currentLineIndex + 1, isPlaying: false });
        }
      },

      goToStart: () => {
        const { marqueeSignal } = get();
        set({ currentLineIndex: 0, isPlaying: false, marqueeSignal: { type: 'start', counter: marqueeSignal.counter + 1 } });
      },

      goToEnd: () => {
        const { activeScriptId, scripts, marqueeSignal } = get();
        const script = scripts.find((sc) => sc.id === activeScriptId);
        const lines = getLinesForScript(script);
        set({ currentLineIndex: Math.max(0, lines.length - 1), isPlaying: false, marqueeSignal: { type: 'end', counter: marqueeSignal.counter + 1 } });
      },

      nextScript: () => {
        const { scripts, activeScriptId } = get();
        const idx = scripts.findIndex((sc) => sc.id === activeScriptId);
        if (idx < scripts.length - 1) {
          set({ activeScriptId: scripts[idx + 1].id, currentLineIndex: 0, isPlaying: false });
        }
      },

      prevScript: () => {
        const { scripts, activeScriptId } = get();
        const idx = scripts.findIndex((sc) => sc.id === activeScriptId);
        if (idx > 0) {
          set({ activeScriptId: scripts[idx - 1].id, currentLineIndex: 0, isPlaying: false });
        }
      },

      toggleDisplayMode: () => {
        const { activeScriptId } = get();
        if (!activeScriptId) return;
        set((s) => ({
          scripts: s.scripts.map((sc) => {
            if (sc.id === activeScriptId) {
              return { ...sc, displayMode: sc.displayMode === 'horizontal' ? 'vertical' as const : 'horizontal' as const, updatedAt: Date.now() };
            }
            return sc;
          }),
          isPlaying: false,
        }));
      },

      updateActiveScriptSpeed: (delta) => {
        const { activeScriptId } = get();
        if (!activeScriptId) return;
        set((s) => ({
          scripts: s.scripts.map((sc) => {
            if (sc.id === activeScriptId) {
              const newSpeed = Math.round((sc.speedMultiplier + delta) * 10) / 10;
              return { ...sc, speedMultiplier: Math.max(0.1, Math.min(5.0, newSpeed)) };
            }
            return sc;
          }),
        }));
      },

      updateShortcut: (commandId, keys) =>
        set((s) => ({
          shortcuts: s.shortcuts.map((sh) =>
            sh.commandId === commandId ? { ...sh, keys, displayValue: keys } : sh
          ),
        })),

      resetShortcuts: () => set({ shortcuts: [...DEFAULT_SHORTCUTS] }),

      openSearch: () => set({ search: { isOpen: true, query: '', matches: [], currentMatchIndex: -1 }, isPlaying: false }),
      closeSearch: () => set({ search: { isOpen: false, query: '', matches: [], currentMatchIndex: -1 } }),

      setSearchQuery: (query) => {
        const { activeScriptId, scripts } = get();
        const script = scripts.find((sc) => sc.id === activeScriptId);
        if (!script || !query.trim()) {
          set({ search: { isOpen: true, query, matches: [], currentMatchIndex: -1 } });
          return;
        }

        const isHorizontal = (script.displayMode || 'vertical') === 'horizontal';

        if (isHorizontal) {
          // For horizontal: find character positions in the joined text
          const joined = script.content
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0)
            .join('   ◆   ');
          const lowerJoined = joined.toLowerCase();
          const lowerQuery = query.toLowerCase();
          const charPositions: number[] = [];
          let searchFrom = 0;
          let idx = lowerJoined.indexOf(lowerQuery, searchFrom);
          while (idx !== -1) {
            charPositions.push(idx);
            searchFrom = idx + 1;
            idx = lowerJoined.indexOf(lowerQuery, searchFrom);
          }
          const firstMatch = charPositions.length > 0 ? 0 : -1;
          set({
            search: { isOpen: true, query, matches: charPositions, currentMatchIndex: firstMatch },
            isPlaying: false,
          });
        } else {
          // For vertical: find line indices
          const lines = getLinesForScript(script);
          const lowerQuery = query.toLowerCase();
          const matches = lines.reduce<number[]>((acc, line, i) => {
            if (line.toLowerCase().includes(lowerQuery)) acc.push(i);
            return acc;
          }, []);
          const firstMatch = matches.length > 0 ? 0 : -1;
          set({
            search: { isOpen: true, query, matches, currentMatchIndex: firstMatch },
            ...(matches.length > 0 ? { currentLineIndex: matches[0] } : {}),
          });
        }
      },

      searchNext: () => {
        const { search, activeScriptId, scripts } = get();
        if (search.matches.length === 0) return;
        const next = (search.currentMatchIndex + 1) % search.matches.length;
        const script = scripts.find((sc) => sc.id === activeScriptId);
        const isHorizontal = (script?.displayMode || 'vertical') === 'horizontal';
        set({
          search: { ...search, currentMatchIndex: next },
          // Only set currentLineIndex in vertical mode
          ...(!isHorizontal ? { currentLineIndex: search.matches[next] } : {}),
        });
      },

      searchPrev: () => {
        const { search, activeScriptId, scripts } = get();
        if (search.matches.length === 0) return;
        const prev = (search.currentMatchIndex - 1 + search.matches.length) % search.matches.length;
        const script = scripts.find((sc) => sc.id === activeScriptId);
        const isHorizontal = (script?.displayMode || 'vertical') === 'horizontal';
        set({
          search: { ...search, currentMatchIndex: prev },
          ...(!isHorizontal ? { currentLineIndex: search.matches[prev] } : {}),
        });
      },
    }),
    {
      name: 'teleprompter-state',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        scripts: state.scripts,
        activeScriptId: state.activeScriptId,
        shortcuts: state.shortcuts,
      }),
    }
  )
);

// ── Cross-window sync ──────────────────────────────────────────────────────────
import { emit, listen } from '@tauri-apps/api/event';

let _isRemoteUpdate = false;

listen<{ scripts: Script[]; activeScriptId: string | null; shortcuts: Shortcut[] }>('state-sync', (event) => {
  _isRemoteUpdate = true;
  useStore.setState({
    scripts: event.payload.scripts,
    activeScriptId: event.payload.activeScriptId,
    shortcuts: event.payload.shortcuts,
  });
  _isRemoteUpdate = false;
});

useStore.subscribe((state, prevState) => {
  if (_isRemoteUpdate) return;
  const changed =
    state.scripts !== prevState.scripts ||
    state.activeScriptId !== prevState.activeScriptId ||
    state.shortcuts !== prevState.shortcuts;
  if (changed) {
    emit('state-sync', {
      scripts: state.scripts,
      activeScriptId: state.activeScriptId,
      shortcuts: state.shortcuts,
    });
  }
});
