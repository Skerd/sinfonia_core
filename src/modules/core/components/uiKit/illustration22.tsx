"use client";

import { motion } from "motion/react";
import { Hexagon, Box, FileText, Command, Cloud, Activity } from "lucide-react";

// Design space: 600×600, half = 300. xPct/yPct are % of half-container (50%).
const STATIC_ICONS = [
  { Icon: Hexagon, r: 80, a: 210 },
  { Icon: Box, r: 170, a: 330 },
  { Icon: FileText, r: 170, a: 120 },
  { Icon: Cloud, r: 260, a: 45 },
  { Icon: Activity, r: 260, a: 260 },
].map(({ Icon, r, a }) => ({
  Icon,
  xPct: Math.cos(a * (Math.PI / 180)) * (r / 300) * 50,
  yPct: Math.sin(a * (Math.PI / 180)) * (r / 300) * 50,
}));

export default function Illustration22() {
  return (
    <div className="relative aspect-square w-full max-w-md overflow-hidden">
      <div className="absolute inset-0 opacity-60 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute h-[26.7%] w-[26.7%] rounded-full border border-neutral-200 dark:border-neutral-700" />
        <div className="absolute h-[56.7%] w-[56.7%] rounded-full border border-neutral-200 dark:border-neutral-700" />
        <div className="absolute h-[86.7%] w-[86.7%] rounded-full border border-neutral-200 dark:border-neutral-700" />

        {STATIC_ICONS.map(({ Icon, xPct, yPct }, idx) => (
          <div
            key={idx}
            className="absolute z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm backdrop-blur-md dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
            style={{
              left: `calc(50% + ${xPct}%)`,
              top: `calc(50% + ${yPct}%)`,
            }}
          >
            <Icon size={18} strokeWidth={1.5} />
          </div>
        ))}

        <motion.div
          className="pointer-events-none absolute z-20"
          style={{
            width: "160%",
            height: "160%",
            top: "-30%",
            left: "-30%",
            background:
              "conic-gradient(from 0deg at 50% 50%, transparent 0%, transparent 40%, rgba(34,197,94,0.02) 55%, rgba(34,197,94,0.08) 75%, rgba(34,197,94,0.22) 100%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
        />

        <div className="absolute z-30 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-[0_0_30px_rgba(34,197,94,0.15)] backdrop-blur-xl dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:shadow-[0_0_30px_rgba(34,197,94,0.25)]">
          <Command size={24} strokeWidth={2} />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
