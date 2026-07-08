"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { PlusCircle } from "lucide-react";

const W = 400;
const H = 300;
const AVATAR_R = 36;
const AVATAR_CY = 72;
const BTN_CX = W / 2;
const BTN_CY = 248;
const BRANCH_Y = 172;

const AVATARS = [
  {
    id: 0,
    cx: 88,
    color: "#818cf8",
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
  },
  {
    id: 1,
    cx: W / 2,
    color: "#a78bfa",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
  },
  {
    id: 2,
    cx: 312,
    color: "#34d399",
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
  },
];

function guidePath(cx: number): string {
  const endY = AVATAR_CY + AVATAR_R + 2;
  if (cx === BTN_CX) {
    return `M ${BTN_CX} ${BTN_CY} L ${BTN_CX} ${endY}`;
  }
  return `M ${BTN_CX} ${BTN_CY} L ${BTN_CX} ${BRANCH_Y} L ${cx} ${BRANCH_Y} L ${cx} ${endY}`;
}

const TRACER_LEN = 0.15;
const TRACER_GAP = 1.5;

function Tracer({
  pathD,
  color,
  onArrive,
}: {
  pathD: string;
  color: string;
  onArrive: () => void;
}) {
  return (
    <motion.path
      d={pathD}
      pathLength={1}
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeDasharray={`${TRACER_LEN} ${TRACER_GAP}`}
      initial={{ strokeDashoffset: TRACER_LEN }}
      animate={{ strokeDashoffset: -(TRACER_GAP - TRACER_LEN) }}
      transition={{ duration: 1.3, ease: "easeIn" }}
      onAnimationComplete={onArrive}
      style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
    />
  );
}

export default function AutoJoin() {
  const [keys, setKeys] = useState([-1, -1, -1]);
  const [lit, setLit] = useState([false, false, false]);

  const startTracer = useCallback((idx: number) => {
    setKeys((prev) => {
      const next = [...prev];
      next[idx] = Math.max(next[idx], 0) + 1;
      return next;
    });
  }, []);

  const handleArrive = useCallback(
    (idx: number) => {
      setLit((prev) => {
        const n = [...prev];
        n[idx] = true;
        return n;
      });

      setTimeout(() => {
        setLit((prev) => {
          const n = [...prev];
          n[idx] = false;
          return n;
        });
        setTimeout(() => startTracer(idx), 400 + Math.random() * 600);
      }, 2000);
    },
    [startTracer],
  );

  useEffect(() => {
    const timers = AVATARS.map((_, i) =>
      setTimeout(() => startTracer(i), i * 550 + 200),
    );
    return () => timers.forEach(clearTimeout);
  }, [startTracer]);

  return (
    <div
      className="bg-background relative w-full max-w-sm overflow-hidden rounded-2xl border"
      style={{ aspectRatio: `${W}/${H}` }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full">
        {[65, 110, 158, 208].map((r) => (
          <circle
            key={r}
            cx={BTN_CX}
            cy={BTN_CY}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            className="text-muted-foreground/[0.08]"
          />
        ))}

        {AVATARS.map((a) => (
          <path
            key={a.id}
            d={guidePath(a.cx)}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="text-muted-foreground/20"
          />
        ))}

        {AVATARS.map((a, idx) =>
          keys[idx] >= 0 ? (
            <Tracer
              key={`${idx}-${keys[idx]}`}
              pathD={guidePath(a.cx)}
              color={a.color}
              onArrive={() => handleArrive(idx)}
            />
          ) : null,
        )}
      </svg>

      {AVATARS.map((a) => (
        <div
          key={a.id}
          className="absolute"
          style={{
            left: `${(a.cx / W) * 100}%`,
            top: `${(AVATAR_CY / H) * 100}%`,
            width: `${((AVATAR_R * 2) / W) * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <motion.div
            className="border-background overflow-hidden rounded-full border-2 shadow-sm"
            style={{ aspectRatio: "1" }}
            animate={{
              scale: lit[a.id] ? 1 : 0.85,
              opacity: lit[a.id] ? 1 : 0.22,
            }}
            transition={{ duration: 0.25 }}
          >
            <img src={a.img} alt="" className="h-full w-full object-cover" />
          </motion.div>
        </div>
      ))}

      <div
        className="bg-background absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm"
        style={{
          left: `${(BTN_CX / W) * 100}%`,
          top: `${(BTN_CY / H) * 100}%`,
        }}
      >
        <PlusCircle className="text-muted-foreground size-4" />
        Auto-join
      </div>
    </div>
  );
}
