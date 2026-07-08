"use client";

import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useTheme } from "next-themes";

const MIN_SCORE = 170;
const MAX_SCORE = 850;
const RADIUS = 70;
const CENTER_X = 100;
const CENTER_Y = 100;

const LABELS = [
  { value: 170, angle: 0 },
  { value: 340, angle: 45 },
  { value: 510, angle: 90 },
  { value: 680, angle: 135 },
  { value: 850, angle: 180 },
];

const getCoordinatesForAngle = (angle: number, radius: number) => {
  const polarAngle = (180 - angle) * (Math.PI / 180);
  return {
    x: CENTER_X + radius * Math.cos(polarAngle),
    y: CENTER_Y - radius * Math.sin(polarAngle),
  };
};

const createFullArc = () => {
  const start = getCoordinatesForAngle(0, RADIUS);
  const end = getCoordinatesForAngle(180, RADIUS);
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y}`;
};

export default function Illustration26() {
  const [score, setScore] = useState(MIN_SCORE);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const animatedScore = useMotionValue(MIN_SCORE);
  const displayScore = useTransform(animatedScore, (latest) =>
    Math.round(latest),
  );
  const rotateAngle = useTransform(
    animatedScore,
    (latest) => ((latest - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * 180 - 90,
  );
  const fillProgress = useTransform(
    animatedScore,
    (latest) => (latest - MIN_SCORE) / (MAX_SCORE - MIN_SCORE),
  );
  const barOpacity = useTransform(fillProgress, [0, 0.01], [0, 1]);

  const generateRandomScore = () => {
    setScore(
      Math.floor(Math.random() * (MAX_SCORE - MIN_SCORE + 1)) + MIN_SCORE,
    );
  };

  useEffect(() => {
    const initTimer = setTimeout(() => setScore(620), 500);
    const interval = setInterval(generateRandomScore, 3000);
    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    animate(animatedScore, score, {
      duration: 1.5,
      type: "spring",
      bounce: 0.2,
      stiffness: 50,
    });
  }, [score]);

  const emptyArcColor = "var(--muted)";
  const labelText = "var(--muted-foreground)";
  const needleColor = "var(--muted-foreground)";
  const needleRingOuter = "var(--background)";
  const needleRingInner = "var(--card)";

  return (
    <motion.div
      onClick={generateRandomScore}
      className="relative flex w-full max-w-md flex-col items-center overflow-hidden rounded-xl border p-6"
    >
      <div className="relative mt-8 flex w-full items-center justify-center">
        <svg
          viewBox="-25 10 250 120"
          className="h-full w-full overflow-visible"
        >
          <defs>
            <filter
              id="needleShadow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.1" />
            </filter>
            <linearGradient
              id="scoreGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="var(--color-yellow-400)" />
              <stop offset="50%" stopColor="var(--color-emerald-500)" />
              <stop offset="100%" stopColor="var(--destructive)" />
            </linearGradient>
          </defs>

          <path
            d={createFullArc()}
            fill="none"
            stroke={emptyArcColor}
            strokeWidth="16"
            strokeLinecap="round"
          />

          <motion.path
            d={createFullArc()}
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            style={{ pathLength: fillProgress, opacity: barOpacity }}
          />

          {LABELS.map((label, i) => {
            const pos = getCoordinatesForAngle(label.angle, 102);
            return (
              <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
                <rect
                  x="-18"
                  y="-11"
                  width="36"
                  height="22"
                  rx="8"
                  fill="var(--background)"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fontSize="7"
                  fill={labelText}
                  fontWeight="400"
                >
                  {label.value}
                </text>
              </g>
            );
          })}

          <g transform={`translate(${CENTER_X}, ${CENTER_Y})`}>
            <motion.g style={{ rotate: rotateAngle }}>
              <circle cx="0" cy="0" r="70" fill="transparent" />
              <circle cx="0" cy="0" r="24" fill={needleRingOuter} />
              <circle
                cx="0"
                cy="0"
                r="18"
                fill={needleRingInner}
                style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.08))" }}
              />
              <path
                d="M -5 0 L 5 0 L 0 -68 Z"
                fill={needleColor}
                filter="url(#needleShadow)"
              />
              <circle cx="0" cy="0" r="5" fill={needleColor} />
            </motion.g>
          </g>
        </svg>
      </div>

      <div className="mt-4 mb-2 text-center">
        <h2 className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wider uppercase">
          Credit Score
        </h2>
        <motion.div className="text-foreground text-4xl font-black tracking-tighter">
          {displayScore}
        </motion.div>
      </div>
    </motion.div>
  );
}
