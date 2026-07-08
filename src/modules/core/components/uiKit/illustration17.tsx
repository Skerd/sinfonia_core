"use client";

import { useMemo } from "react";
import { motion, type Transition, type Easing } from "motion/react";

export default function App() {
  const particles = useMemo(() => {
    return Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 4 + Math.random() * 6,
      size: Math.random() * 2.5 + 1,
      opacity: Math.random() * 0.6 + 0.2,
    }));
  }, []);

  const segment =
    "c 10 0, 10 -12, 20 -12 l 10 0 c 7.5 0, 7.5 -12, 15 -12 l 10 0 c 7.5 0, 7.5 27, 15 27 c 7.5 0, 7.5 -6, 15 -6 c 7.5 0, 7.5 3, 15 3 ";
  const linePath = "M 0 40 " + segment.repeat(4);
  const fillPath = `${linePath} L 400 56.25 L 0 56.25 Z`;

  const chartAnimation = {
    animate: { x: [0, -100] },
    transition: { repeat: Infinity, duration: 4, ease: "linear" } as Transition,
  };

  const dotYKeyframes = [16, 16, 43, 37, 40, 28, 28, 16, 16];
  const dotTimes = [0, 0.05, 0.2, 0.35, 0.5, 0.7, 0.8, 0.95, 1.0];

  const dotEasings: Easing[] = [
    "linear",
    "easeInOut",
    "easeInOut",
    "easeInOut",
    "easeInOut",
    "linear",
    "easeInOut",
    "linear",
  ];

  return (
    <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ top: "100%", opacity: 0 }}
          animate={{ top: "-10%", opacity: [0, p.opacity, p.opacity, 0] }}
          transition={{
            repeat: Infinity,
            duration: p.duration,
            delay: p.delay,
            ease: "linear",
          }}
          className="absolute rounded-full bg-primary"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            boxShadow: "0 0 12px 2px rgba(45, 212, 191, 0.5)",
          }}
        />
      ))}

      <svg
        viewBox="0 0 100 56.25"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient
            id="chartGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="56.25"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>

          <mask id="drawingMask">
            <rect x="0" y="0" width="50" height="56.25" fill="white" />
          </mask>

          <mask id="fillMask">
            <motion.path d={fillPath} fill="white" {...chartAnimation} />
          </mask>
        </defs>

        <g mask="url(#drawingMask)">
          <rect
            x="0"
            y="0"
            width="100"
            height="56.25"
            fill="url(#chartGradient)"
            mask="url(#fillMask)"
          />

          <motion.path
            d={linePath}
            fill="none"
            stroke="var(--color-emerald-600)"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...chartAnimation}
          />
        </g>

        <motion.g
          animate={{ y: dotYKeyframes }}
          transition={{
            repeat: Infinity,
            duration: 4,
            ease: dotEasings,
            times: dotTimes,
          }}
        >
          <motion.circle
            cx="50"
            cy="0"
            fill="var(--color-emerald-600)"
            initial={{ opacity: 0.1, r: 2 }}
            animate={{ opacity: 0.35, r: 6 }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
          <circle
            cx="50"
            cy="0"
            r="1.5"
            fill="var(--color-background)"
            stroke="var(--color-emerald-600)"
            strokeWidth="0.5"
          />
        </motion.g>
      </svg>
    </div>
  );
}
