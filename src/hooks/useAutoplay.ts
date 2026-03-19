import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { getDisplayLines } from '../lib/scriptParser';

export const useAutoplay = () => {
  const isPlaying = useStore((s) => s.isPlaying);
  const activeScriptId = useStore((s) => s.activeScriptId);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isPlaying || !activeScriptId) return;

    const state = useStore.getState();
    const script = state.scripts.find((s) => s.id === activeScriptId);
    if (!script) return;

    const interval = 3000 / script.speedMultiplier;

    intervalRef.current = window.setInterval(() => {
      const s = useStore.getState();
      if (!s.isPlaying) {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        return;
      }

      const currentScript = s.scripts.find((sc) => sc.id === s.activeScriptId);
      if (!currentScript) return;

      const lines = getDisplayLines(currentScript.content, currentScript.fontSize || 'xl');
      const nextIndex = s.currentLineIndex + 1;

      if (nextIndex < lines.length) {
        useStore.setState({ currentLineIndex: nextIndex });
      } else {
        useStore.setState({ isPlaying: false });
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, activeScriptId]);
};
