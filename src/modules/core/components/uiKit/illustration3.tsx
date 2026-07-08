"use client";

import { motion } from "motion/react";

export default function App() {
  const paths = [
    { d: "M -100 120 C 250 120, 450 300, 650 300 L 800 300", delay: 0 },
    { d: "M -100 230 C 250 230, 450 300, 650 300 L 800 300", delay: 1.8 },
    { d: "M -100 370 C 250 370, 450 300, 650 300 L 800 300", delay: 0.9 },
    { d: "M -100 480 C 250 480, 450 300, 650 300 L 800 300", delay: 2.7 },
  ];

  return (
    <svg viewBox="0 0 1000 600" className="h-full w-[70%]">
      <defs>
        <filter
          id="node-shadow"
          filterUnits="userSpaceOnUse"
          x="-200"
          y="-200"
          width="1400"
          height="1000"
        >
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.06" />
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.03" />
        </filter>

        <filter id="left-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="12" dy="0" stdDeviation="16" floodOpacity="0.06" />
        </filter>
      </defs>

      {paths.map((p, i) => (
        <path
          key={`line-${i}`}
          d={p.d}
          stroke="var(--border)"
          strokeWidth="2"
          fill="none"
          strokeLinejoin="round"
        />
      ))}

      {paths.map((p, i) => (
        <motion.path
          key={`shape-${i}`}
          d={p.d}
          stroke="var(--primary)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#node-shadow)"
          strokeDasharray="96 3000"
          initial={{ strokeDashoffset: 100 }}
          animate={{ strokeDashoffset: -1400 }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay,
          }}
        />
      ))}

      <g transform="translate(755, 255)">
        <rect
          width="90"
          height="90"
          rx="10"
          fill="var(--primary)"
          filter="url(#node-shadow)"
        />
        <image href="/logo.svg" x="22.5" y="22.5" width="45" height="45" />
      </g>
    </svg>
  );
}
