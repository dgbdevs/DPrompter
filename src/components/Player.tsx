import React, { useRef, useEffect, useMemo } from 'react';
import { useStore, FontSize } from '../store/useStore';
import { getDisplayLines } from '../lib/scriptParser';

const FONT_SIZE_MAP: Record<FontSize, { prev: number; current: number; lineHeight: number }> = {
  'lg':  { prev: 18, current: 26, lineHeight: 32 },
  'xl':  { prev: 22, current: 34, lineHeight: 42 },
  '2xl': { prev: 28, current: 44, lineHeight: 52 },
  '3xl': { prev: 34, current: 52, lineHeight: 62 },
};

// ── Vertical Player (original, south → north) ──────────────────────────────────
const VerticalPlayer: React.FC<{ lines: string[]; currentLineIndex: number; fontSize: FontSize }> = ({
  lines, currentLineIndex, fontSize,
}) => {
  const prevIndexRef = useRef(currentLineIndex);
  const trackRef = useRef<HTMLDivElement>(null);
  const sizes = FONT_SIZE_MAP[fontSize];

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

// ── Helper: highlight search matches in text ────────────────────────────────────
const highlightText = (text: string, query: string): React.ReactNode => {
  if (!query || !query.trim()) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  let idx = lowerText.indexOf(lowerQuery, lastIndex);
  while (idx !== -1) {
    if (idx > lastIndex) {
      parts.push(text.slice(lastIndex, idx));
    }
    parts.push(
      <span key={idx} style={{ backgroundColor: 'rgba(255, 200, 0, 0.4)', color: '#fff', borderRadius: '2px', padding: '0 2px' }}>
        {text.slice(idx, idx + query.length)}
      </span>
    );
    lastIndex = idx + query.length;
    idx = lowerText.indexOf(lowerQuery, lastIndex);
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
};

// ── Horizontal Player (east → west marquee) ─────────────────────────────────────
interface HorizontalPlayerProps {
  content: string;
  fontSize: FontSize;
  speedMultiplier: number;
  isPlaying: boolean;
  marqueeSignal: { type: 'start' | 'end'; counter: number };
  searchQuery: string;
  searchCharPos: number; // char index of current match, -1 if none
}

const HorizontalPlayer: React.FC<HorizontalPlayerProps> = ({
  content, fontSize, speedMultiplier, isPlaying, marqueeSignal, searchQuery, searchCharPos,
}) => {
  const sizes = FONT_SIZE_MAP[fontSize];
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<number | null>(null); // current X position in px
  const rafRef = useRef<number>(0);
  const prevSignalRef = useRef(marqueeSignal.counter);

  // Join all lines into a single marquee string with separator
  const marqueeText = useMemo(() => {
    if (!content || !content.trim()) return '';
    return content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .join('   ◆   ');
  }, [content]);

  // Reset position when content or font changes
  useEffect(() => {
    posRef.current = null;
  }, [marqueeText, fontSize]);

  // Respond to goToStart / goToEnd signals
  useEffect(() => {
    if (marqueeSignal.counter === prevSignalRef.current) return;
    prevSignalRef.current = marqueeSignal.counter;

    if (!containerRef.current || !textRef.current) return;
    const containerW = containerRef.current.clientWidth;
    const textW = textRef.current.scrollWidth;

    if (marqueeSignal.type === 'start') {
      posRef.current = containerW; // right edge = beginning
    } else {
      posRef.current = -textW + containerW; // show end of text aligned to right edge
    }

    textRef.current.style.transform = `translateX(${posRef.current}px)`;
  }, [marqueeSignal.counter, marqueeSignal.type]);

  // Scroll to search match position
  useEffect(() => {
    if (searchCharPos < 0 || !marqueeText || !containerRef.current || !textRef.current) return;

    const containerW = containerRef.current.clientWidth;
    const textW = textRef.current.scrollWidth;
    // Estimate pixel offset proportionally
    const ratio = searchCharPos / marqueeText.length;
    const pixelOffset = ratio * textW;
    // Center the match in the viewport
    posRef.current = containerW / 2 - pixelOffset;
    // Clamp so we don't scroll past edges unnecessarily
    posRef.current = Math.min(posRef.current, containerW);
    posRef.current = Math.max(posRef.current, -textW + containerW / 2);
    textRef.current.style.transform = `translateX(${posRef.current}px)`;
  }, [searchCharPos, marqueeText]);

  // rAF scroll loop
  useEffect(() => {
    if (!isPlaying || !marqueeText) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    let lastTime: number | null = null;

    const tick = (now: number) => {
      if (!containerRef.current || !textRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const containerW = containerRef.current.clientWidth;
      const textW = textRef.current.scrollWidth;

      // Initialize position at right edge of container
      if (posRef.current === null) {
        posRef.current = containerW;
      }

      if (lastTime !== null) {
        const dt = (now - lastTime) / 1000; // seconds
        const pxPerSec = 100 * speedMultiplier;
        posRef.current -= pxPerSec * dt;

        // When fully scrolled off the left, reset to right edge
        if (posRef.current < -textW) {
          posRef.current = containerW;
        }
      }

      lastTime = now;
      textRef.current.style.transform = `translateX(${posRef.current}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, marqueeText, speedMultiplier]);

  // When paused, make sure text stays visible at current position (or at start)
  useEffect(() => {
    if (!isPlaying && textRef.current && containerRef.current) {
      if (posRef.current === null) {
        posRef.current = containerRef.current.clientWidth;
      }
      textRef.current.style.transform = `translateX(${posRef.current}px)`;
    }
  }, [isPlaying]);

  if (!marqueeText) {
    return (
      <div className="flex items-center justify-center h-full text-white/15 text-base font-black uppercase tracking-[0.3em] prompter-text">
        No hay contenido
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center overflow-hidden select-none prompter-text pointer-events-none"
    >
      {/* Marquee track */}
      <div
        ref={textRef}
        className="font-black tracking-tight uppercase whitespace-nowrap absolute top-1/2 left-0"
        style={{
          fontSize: `${sizes.current}px`,
          lineHeight: `${Math.round(sizes.lineHeight * 1.2)}px`,
          color: '#ffffff',
          marginTop: `${-Math.round(sizes.lineHeight * 1.2) / 2}px`,
          willChange: 'transform',
        }}
      >
        {highlightText(marqueeText, searchQuery)}
      </div>

      {/* Fade edges */}
      <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-black/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-black/90 to-transparent z-10 pointer-events-none" />

      {/* Mode label */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[9px] font-mono text-white/15 tabular-nums">
          {isPlaying ? '▶ MARQUEE' : '⏸ MARQUEE'}
        </span>
      </div>
    </div>
  );
};

// ── Main Player wrapper ─────────────────────────────────────────────────────────
export const Player: React.FC = () => {
  const { scripts, activeScriptId, currentLineIndex, isPlaying, marqueeSignal, search } = useStore();
  const script = scripts.find((s) => s.id === activeScriptId);
  const fontSize: FontSize = script?.fontSize || 'xl';
  const displayMode = script?.displayMode || 'vertical';
  const lines = script ? getDisplayLines(script.content, fontSize) : [];
  const searchQuery = search.isOpen ? search.query : '';

  if (!script || (!script.content.trim())) {
    return (
      <div className="flex items-center justify-center h-full text-white/15 text-base font-black uppercase tracking-[0.3em] prompter-text">
        No hay contenido
      </div>
    );
  }

  if (displayMode === 'horizontal') {
    return (
      <HorizontalPlayer
        content={script.content}
        fontSize={fontSize}
        speedMultiplier={script.speedMultiplier}
        isPlaying={isPlaying}
        marqueeSignal={marqueeSignal}
        searchQuery={searchQuery}
        searchCharPos={search.isOpen && search.currentMatchIndex >= 0 ? search.matches[search.currentMatchIndex] : -1}
      />
    );
  }

  return (
    <VerticalPlayer
      lines={lines}
      currentLineIndex={currentLineIndex}
      fontSize={fontSize}
    />
  );
};
