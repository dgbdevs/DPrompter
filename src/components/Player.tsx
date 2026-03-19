import React, { useRef, useEffect } from 'react';
import { useStore, FontSize } from '../store/useStore';
import { getDisplayLines } from '../lib/scriptParser';

const FONT_SIZE_MAP: Record<FontSize, { prev: number; current: number; lineHeight: number }> = {
  'lg':  { prev: 18, current: 26, lineHeight: 32 },
  'xl':  { prev: 22, current: 34, lineHeight: 42 },
  '2xl': { prev: 28, current: 44, lineHeight: 52 },
  '3xl': { prev: 34, current: 52, lineHeight: 62 },
};

export const Player: React.FC = () => {
  const { scripts, activeScriptId, currentLineIndex } = useStore();
  const prevIndexRef = useRef(currentLineIndex);
  const trackRef = useRef<HTMLDivElement>(null);

  const script = scripts.find((s) => s.id === activeScriptId);
  const fontSize: FontSize = script?.fontSize || 'xl';
  const lines = script ? getDisplayLines(script.content, fontSize) : [];
  const sizes = FONT_SIZE_MAP[fontSize];

  // Animate south → north on line change
  useEffect(() => {
    if (trackRef.current && prevIndexRef.current !== currentLineIndex) {
      const track = trackRef.current;
      track.style.transition = 'none';
      track.style.transform = 'translateY(30px)';
      track.style.opacity = '0.3';
      void track.offsetHeight;
      track.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease-out';
      track.style.transform = 'translateY(0px)';
      track.style.opacity = '1';
    }
    prevIndexRef.current = currentLineIndex;
  }, [currentLineIndex]);

  if (!script || lines.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white/15 text-base font-black uppercase tracking-[0.3em] prompter-text">
        No hay contenido
      </div>
    );
  }

  const prevLine = currentLineIndex > 0 ? lines[currentLineIndex - 1] : '';
  const currentLine = lines[currentLineIndex] ?? '';

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center overflow-hidden select-none prompter-text pointer-events-none">
      <div
        ref={trackRef}
        className="flex flex-col items-center justify-center text-center w-full px-8 gap-0"
      >
        {/* Line 1 — previous (grey) */}
        <div
          className="font-black leading-tight tracking-tight uppercase w-full"
          style={{
            fontSize: `${sizes.prev}px`,
            lineHeight: `${sizes.lineHeight}px`,
            color: '#888888',
            minHeight: `${sizes.lineHeight}px`,
          }}
        >
          {prevLine || '\u00A0'}
        </div>

        {/* Line 2 — current (white) */}
        <div
          className="font-black leading-tight tracking-tight uppercase w-full"
          style={{
            fontSize: `${sizes.current}px`,
            lineHeight: `${Math.round(sizes.lineHeight * 1.2)}px`,
            color: '#ffffff',
            minHeight: `${Math.round(sizes.lineHeight * 1.2)}px`,
          }}
        >
          {currentLine}
        </div>
      </div>

      {/* Progress */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
        <span className="text-[9px] font-mono text-white/15 tabular-nums">
          {currentLineIndex + 1} / {lines.length}
        </span>
      </div>
    </div>
  );
};
