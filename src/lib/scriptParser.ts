// Font size type lives here to avoid circular deps between store and parser
export type FontSize = 'lg' | 'xl' | '2xl' | '3xl';
export type DisplayMode = 'vertical' | 'horizontal';

// Characters per line estimate based on font size and ~750px display width
const CHARS_PER_LINE: Record<FontSize, number> = {
  'lg':  55,
  'xl':  40,
  '2xl': 30,
  '3xl': 22,
};

/**
 * Splits raw content into display lines.
 * 1. Splits by newlines first
 * 2. For each resulting line, wraps by word to fit maxChars
 * 3. Never cuts words in half
 */
export const getDisplayLines = (content: string, fontSize: FontSize = 'xl'): string[] => {
  if (!content || !content.trim()) return [];
  
  const maxChars = CHARS_PER_LINE[fontSize] || 40;
  const rawLines = content.split('\n');
  const result: string[] = [];

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (trimmed.length === 0) continue;

    if (trimmed.length <= maxChars) {
      result.push(trimmed);
      continue;
    }

    // Word-wrap long lines
    const words = trimmed.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      if (!currentLine) {
        currentLine = word;
      } else if ((currentLine + ' ' + word).length <= maxChars) {
        currentLine += ' ' + word;
      } else {
        result.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      result.push(currentLine);
    }
  }

  return result;
};
