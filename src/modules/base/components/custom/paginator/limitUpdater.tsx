import { useState, useRef, useEffect, KeyboardEvent } from "react";

function parseRange(input: string): { start: number; end: number } | null {
  const trimmed = input.trim().replace(/\s+/g, "");
  const match = trimmed.match(/^(\d+)-(\d+)$/);
  if (!match) return null;
  const start = parseInt(match[1], 10);
  const end = parseInt(match[2], 10);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return { start, end };
}

export default function LimitUpdater({
  start,
  end,
  total,
  onRangeChange,
}: {
  start: number;
  end: number;
  total: number;
  onRangeChange: (start: number, end: number) => void;
}) {
  const displayText = `${start}-${end}`;
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(displayText);
  const [inputWidth, setInputWidth] = useState(30);
  const inputRef = useRef<HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLSpanElement>(null);
  // Escape sets `isEditing` false, which unmounts the input; removing a focused node makes the
  // browser fire a native blur, so `onBlur` still runs with the stale (pre-reset) `inputValue`
  // unless this flag tells it to skip the commit.
  const suppressNextBlurCommit = useRef(false);
  const placeholder = `1-${total}`;

  useEffect(() => {
    if (!isEditing || !mirrorRef.current) return;
    const w = mirrorRef.current.getBoundingClientRect().width;
    setInputWidth(Math.max(w, 1));
  }, [isEditing, inputValue, placeholder]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitRange = (raw: string) => {
    const currentParsed = parseRange(displayText) ?? { start, end };
    const parsed = parseRange(raw);
    if (parsed) {
      let { start: s, end: e } = parsed;
      // Clamp `e` to `total` BEFORE validating `s` against it — validating first let a fully
      // out-of-range end (e.g. "60-70" while total=50) survive the clamp as `s=60, e=50`,
      // an inverted range that produced a negative limit downstream.
      if( e > total ){
        e = total;
      }
      if( e < 1 ){
        e = currentParsed.end;
      }
      if( s < 1 || s > e ){
          s = currentParsed.start;
      }
      if( s > e ){
        // Still inverted (e.g. the fallback start no longer fits under the clamped end) — discard the edit.
        setInputValue(displayText);
        setIsEditing(false);
        return;
      }
      onRangeChange(s, e);
      setInputValue(`${s}-${e}`);
    }
    else {
      setInputValue(displayText);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <span className="inline-block align-baseline">
        <span
          ref={mirrorRef}
          aria-hidden
          className="invisible absolute text-base"
        >
          {inputValue || placeholder}
        </span>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={() => {
            if (suppressNextBlurCommit.current) {
              suppressNextBlurCommit.current = false;
              return;
            }
            commitRange(inputValue);
          }}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
            if (e.key === "Escape") {
              suppressNextBlurCommit.current = true;
              setInputValue(displayText);
              setIsEditing(false);
              inputRef.current?.blur();
            }
          }}
          placeholder={placeholder}
          style={{ width: inputWidth }}
          className="min-w-8 rounded text-center text-inherit focus:border-b focus:border-primary-500 focus:outline-none focus:ring-0 bg-transparent p-0 text-lg"
          aria-label="Edit range"
        />
      </span>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onDoubleClick={() => {
        setInputValue(displayText);
        setIsEditing(true);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setInputValue(displayText);
          setIsEditing(true);
        }
      }}
      className="cursor-pointer select-none rounded px-1 py-0.5 focus:outline-none focus:ring-0 focus:ring-primary-500"
      aria-label="Double-click to edit range"
    >
      {displayText}
    </span>
  );
}
