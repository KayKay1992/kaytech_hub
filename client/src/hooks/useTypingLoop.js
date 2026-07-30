import { useEffect, useState } from 'react';

const TYPE_SPEED_MS = 38;
const PAUSE_AFTER_LINE_MS = 1400;
const GAP_BEFORE_NEXT_MS = 300;
const REDUCED_MOTION_LINE_MS = 2600;

// Types each line in `lines` out character-by-character, pauses, clears,
// then moves to the next line — looping forever. Falls back to a plain
// crossfade between full lines when `reducedMotion` is true.
export default function useTypingLoop(lines, reducedMotion = false) {
  const [lineIndex, setLineIndex] = useState(0);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!lines || lines.length === 0) return undefined;

    if (reducedMotion) {
      setText(lines[lineIndex]);
      const timer = setTimeout(() => {
        setLineIndex((i) => (i + 1) % lines.length);
      }, REDUCED_MOTION_LINE_MS);
      return () => clearTimeout(timer);
    }

    let charIndex = 0;
    let timeoutId;
    const currentLine = lines[lineIndex];

    const typeNextChar = () => {
      charIndex += 1;
      setText(currentLine.slice(0, charIndex));

      if (charIndex < currentLine.length) {
        timeoutId = setTimeout(typeNextChar, TYPE_SPEED_MS);
      } else {
        timeoutId = setTimeout(() => {
          setText('');
          timeoutId = setTimeout(() => {
            setLineIndex((i) => (i + 1) % lines.length);
          }, GAP_BEFORE_NEXT_MS);
        }, PAUSE_AFTER_LINE_MS);
      }
    };

    timeoutId = setTimeout(typeNextChar, TYPE_SPEED_MS);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineIndex, reducedMotion]);

  return text;
}
