"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";

type Token = { text: string; color?: string };
type Line = Token[];

const LINES: Line[] = [
  [
    { text: "import ", color: "text-rose-500" },
    { text: "{ useState }", color: "text-purple-400" },
    { text: " from ", color: "text-rose-500" },
    { text: "'react'", color: "text-emerald-400" },
  ],
  [
    { text: "import ", color: "text-rose-500" },
    { text: "{ motion }", color: "text-purple-400" },
    { text: " from ", color: "text-rose-500" },
    { text: "'motion/react'", color: "text-emerald-400" },
  ],
  [],
  [
    { text: "interface ", color: "text-rose-500" },
    { text: "CardProps", color: "text-sky-400" },
    { text: " {" },
  ],
  [
    { text: "  title", color: "text-blue-400" },
    { text: ": " },
    { text: "string", color: "text-sky-400" },
  ],
  [
    { text: "  children", color: "text-blue-400" },
    { text: ": " },
    { text: "React.ReactNode", color: "text-sky-400" },
  ],
  [{ text: "}" }],
  [],
  [
    { text: "export default function ", color: "text-rose-500" },
    { text: "Card", color: "text-yellow-400" },
    { text: "(" },
    { text: "props", color: "text-blue-400" },
    { text: ": " },
    { text: "CardProps", color: "text-sky-400" },
    { text: ") {" },
  ],
  [
    { text: "  const ", color: "text-rose-500" },
    { text: "[open, setOpen]", color: "text-blue-400" },
    { text: " = useState(" },
    { text: "false", color: "text-orange-400" },
    { text: ")" },
  ],
];

function lineToString(line: Line) {
  return line.map((t) => t.text).join("");
}

export default function CodeTyper() {
  const [cursor, setCursor] = useState({ line: 0, char: 0 });
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => {
        setCursor({ line: 0, char: 0 });
        setDone(false);
      }, 2200);
      return () => clearTimeout(t);
    }

    const { line, char } = cursor;
    const str = lineToString(LINES[line]);

    if (char < str.length) {
      const t = setTimeout(() => setCursor({ line, char: char + 1 }), 52);
      return () => clearTimeout(t);
    }

    if (line < LINES.length - 1) {
      const delay = LINES[line].length === 0 ? 60 : 120;
      const t = setTimeout(() => setCursor({ line: line + 1, char: 0 }), delay);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => setDone(true), 500);
    return () => clearTimeout(t);
  }, [cursor, done]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-lg overflow-hidden rounded-lg border p-6"
    >
      <div className="flex font-mono text-xs">
        <div className="flex flex-col items-end pr-4 select-none">
          {LINES.map((_, i) => {
            const isVisible = i <= cursor.line || done;
            return (
              <div
                key={i}
                className={`flex h-6 items-center transition-opacity duration-150 ${
                  isVisible ? "opacity-40" : "opacity-0"
                } text-muted-foreground`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {LINES.map((line, lineIdx) => {
            const str = lineToString(line);
            const isCurrentLine = cursor.line === lineIdx && !done;
            const isRevealedLine = lineIdx < cursor.line || done;
            const revealedChars = isCurrentLine
              ? cursor.char
              : isRevealedLine
                ? str.length
                : 0;

            if (revealedChars === 0 && !isCurrentLine) {
              return <div key={lineIdx} className="h-6" />;
            }

            let remaining = revealedChars;
            const visibleTokens: Token[] = [];
            for (const token of line) {
              if (remaining <= 0) break;
              visibleTokens.push({
                text: token.text.slice(0, remaining),
                color: token.color,
              });
              remaining -= token.text.length;
            }

            return (
              <div
                key={lineIdx}
                className="flex h-6 items-center whitespace-pre overflow-hidden"
              >
                {visibleTokens.map((token, ti) => (
                  <span key={ti} className={token.color ?? "text-foreground"}>
                    {token.text}
                  </span>
                ))}
                {isCurrentLine && (
                  <motion.div
                    animate={{ opacity: [1, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.85,
                      ease: "linear",
                    }}
                    className="ml-px inline-block h-[14px] w-[2px] shrink-0 bg-foreground/80"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
