import { useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { getAllWebviewWindows } from '@tauri-apps/api/webviewWindow';

export const useKeyboardShortcuts = () => {
  const {
    togglePlay,
    prevLine,
    nextLineWithPause,
    goToStart,
    goToEnd,
    nextScript,
    prevScript,
    updateActiveScriptSpeed,
    openSearch,
    isPlaying,
    shortcuts,
    search,
  } = useStore();

  const toggleSettingsWindow = useCallback(async () => {
    try {
      const windows = await getAllWebviewWindows();
      const editor = windows.find(w => w.label === 'editor');
      if (editor) {
        const visible = await editor.isVisible();
        if (visible) {
          await editor.hide();
        } else {
          await editor.show();
          await editor.setFocus();
        }
      }
    } catch (err) {
      console.error('Failed to toggle settings window:', err);
    }
  }, []);

  const getKeysForCommand = useCallback((commandId: string): string => {
    const sc = shortcuts.find(s => s.commandId === commandId);
    return sc?.keys || '';
  }, [shortcuts]);

  const matchesShortcut = useCallback((e: KeyboardEvent, keys: string): boolean => {
    if (!keys) return false;
    const parts = keys.split('+');
    const needsCtrl = parts.includes('Ctrl');
    const needsAlt = parts.includes('Alt');
    const needsShift = parts.includes('Shift');
    const keyPart = parts.filter(p => !['Ctrl', 'Alt', 'Shift'].includes(p))[0];

    if (e.ctrlKey !== needsCtrl) return false;
    if (e.altKey !== needsAlt) return false;
    if (e.shiftKey !== needsShift) return false;

    if (!keyPart) return false;
    if (keyPart === 'Space') return e.code === 'Space';
    if (keyPart === 'ArrowLeft') return e.key === 'ArrowLeft';
    if (keyPart === 'ArrowRight') return e.key === 'ArrowRight';
    if (keyPart === 'ArrowUp') return e.key === 'ArrowUp';
    if (keyPart === 'ArrowDown') return e.key === 'ArrowDown';
    return e.key.toUpperCase() === keyPart.toUpperCase();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isInput && search.isOpen) return;
      if (isInput) return;

      // Configurable shortcuts
      if (matchesShortcut(e, getKeysForCommand('togglePlay'))) {
        e.preventDefault(); togglePlay(); return;
      }
      if (matchesShortcut(e, getKeysForCommand('prevLine'))) {
        e.preventDefault(); prevLine(); return;
      }
      if (matchesShortcut(e, getKeysForCommand('nextLine'))) {
        e.preventDefault(); nextLineWithPause(); return;
      }
      if (matchesShortcut(e, getKeysForCommand('goToStart'))) {
        e.preventDefault(); goToStart(); return;
      }
      if (matchesShortcut(e, getKeysForCommand('goToEnd'))) {
        e.preventDefault(); goToEnd(); return;
      }
      if (matchesShortcut(e, getKeysForCommand('search'))) {
        e.preventDefault(); openSearch(); return;
      }
      if (matchesShortcut(e, getKeysForCommand('toggleSettings'))) {
        e.preventDefault(); toggleSettingsWindow(); return;
      }
      if (matchesShortcut(e, getKeysForCommand('prevScript'))) {
        e.preventDefault(); prevScript(); return;
      }
      if (matchesShortcut(e, getKeysForCommand('nextScriptKey'))) {
        e.preventDefault(); nextScript(); return;
      }
      if (matchesShortcut(e, getKeysForCommand('speedUp'))) {
        e.preventDefault(); updateActiveScriptSpeed(0.1); return;
      }
      if (matchesShortcut(e, getKeysForCommand('speedDown'))) {
        e.preventDefault(); updateActiveScriptSpeed(-0.1); return;
      }

      // Escape: stop playback
      if (e.key === 'Escape') {
        if (isPlaying) togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay, prevLine, nextLineWithPause, goToStart, goToEnd,
    nextScript, prevScript, updateActiveScriptSpeed, openSearch,
    toggleSettingsWindow, isPlaying, matchesShortcut, getKeysForCommand, search.isOpen,
  ]);
};
