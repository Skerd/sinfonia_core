"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@coreModule/components/lib/utils.ts";

const TICK_MS = 1000;

function formatSeconds(seconds: number, asTime: boolean): string {
  if (!asTime) return String(seconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export type CountdownProps = {
  /** Initial count in seconds */
  seconds: number;
  className?: string;
  /** Called when countdown reaches 0 */
  onComplete?: () => void;
  /** If true, show as MM:SS (or HH:MM:SS when ≥ 1 hour); otherwise show raw seconds */
  formatAsTime?: boolean;
  /** Accessible label for the countdown (e.g. "Time remaining") */
  ariaLabel?: string;
};

export function Countdown({
  seconds: initialSeconds,
  className,
  onComplete,
  formatAsTime = true,
  ariaLabel = "Time remaining",
}: CountdownProps) {
  const initial = Math.max(0, Math.floor(initialSeconds));
  const [remaining, setRemaining] = useState(initial);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const value = Math.max(0, Math.floor(initialSeconds));
    setRemaining(value);
    if (value <= 0) {
      onCompleteRef.current?.();
      return;
    }
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [initialSeconds]);

  const display = formatSeconds(remaining, formatAsTime);

  return (
    <p
      className={cn("tabular-nums font-semibold", className)}
      role="timer"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      {display}
    </p>
  );
}
