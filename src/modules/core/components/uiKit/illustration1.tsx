"use client";

import { useState, useEffect } from "react";
import { motion, animate, useMotionValue, useTransform } from "motion/react";
import { Badge } from "@coreModule/components/uiKit/ui/badge";

interface Point {
  x: number;
  y: number;
}

const getBezierPoint = (
  t: number,
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
): Point => {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
};

const getPathPoint = (progress: number): Point => {
  if (progress <= 0) return { x: 80, y: 150 };
  if (progress >= 3) return { x: 320, y: 60 };

  const seg = Math.floor(progress);
  const t = progress - seg;

  switch (seg) {
    case 0:
      return getBezierPoint(
        t,
        { x: 80, y: 150 },
        { x: 120, y: 150 },
        { x: 120, y: 90 },
        { x: 160, y: 90 },
      );
    case 1:
      return getBezierPoint(
        t,
        { x: 160, y: 90 },
        { x: 200, y: 90 },
        { x: 200, y: 110 },
        { x: 240, y: 110 },
      );
    case 2:
      return getBezierPoint(
        t,
        { x: 240, y: 110 },
        { x: 280, y: 110 },
        { x: 280, y: 60 },
        { x: 320, y: 60 },
      );
    default:
      return { x: 320, y: 60 };
  }
};

const scores: number[] = [100, 112, 124, 132];
const path: string =
  "M 0 140 C 40 140, 40 150, 80 150 C 120 150, 120 90, 160 90 C 200 90, 200 110, 240 110 C 280 110, 280 60, 320 60";

export default function CreditScoreBento() {
  const [step, setStep] = useState<number>(-1);
  const [score, setScore] = useState<number>(0);

  const progressVal = useMotionValue(0);

  const pointX = useTransform(progressVal, (p: number) => getPathPoint(p).x);
  const pointY = useTransform(progressVal, (p: number) => getPathPoint(p).y);

  useEffect(() => {
    let int: ReturnType<typeof setInterval>;
    const tmr = setTimeout(() => {
      setStep(0);
      int = setInterval(() => setStep((s) => (s + 1) % 4), 3000);
    }, 2000);
    return () => {
      clearTimeout(tmr);
      clearInterval(int);
    };
  }, []);

  useEffect(() => {
    const isInit = step === -1;
    const prevScore = isInit ? 0 : step === 0 ? scores[3] : scores[step - 1];
    const targetScore = isInit ? scores[0] : scores[step];

    const duration = isInit ? 2 : step === 0 ? 0.6 : 0.8;

    const scoreAnim = animate(prevScore, targetScore, {
      duration,
      ease: "easeInOut",
      onUpdate: (v: number) => setScore(Math.round(v)),
    });

    const pathAnim = isInit
      ? undefined
      : animate(progressVal, step, {
          duration,
          ease: "easeInOut",
        });

    return () => {
      scoreAnim.stop();
      if (pathAnim) pathAnim.stop();
    };
  }, [step, progressVal]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-background w-full max-w-md rounded-lg border p-6"
    >
      <div className="mb-4">
        <h2 className="text-muted-foreground mb-1 text-xs">
          Credit Score Growth
        </h2>
        <div className="flex items-center">
          <span className="text-4xl font-bold">{score}</span>
          <Badge
            variant="outline"
            className="ml-3 bg-green-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-50"
          >
            +1.3%
          </Badge>
        </div>
      </div>

      <div className="bg-background relative h-[200px] w-full overflow-hidden rounded-md border">
        <svg
          viewBox="0 0 320 180"
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="2.5"
                floodColor="#000"
                floodOpacity="0.15"
              />
            </filter>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-emerald-500)"
                stopOpacity="0.25"
              />
              <stop
                offset="100%"
                stopColor="var(--color-emerald-300)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          <line
            x1="0"
            y1="60"
            x2="320"
            y2="60"
            stroke="var(--border)"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1="120"
            x2="320"
            y2="120"
            stroke="var(--border)"
            strokeWidth="1"
          />

          <motion.path
            d={`${path} L 320 180 L 0 180 Z`}
            fill="url(#grad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          />
          <motion.path
            d={path}
            fill="none"
            stroke="var(--color-emerald-500)"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2 }}
          />

          <motion.g
            style={{ x: pointX }}
            animate={{ opacity: step >= 0 ? 1 : 0 }}
            transition={{ duration: 0.6 }}
          >
            <line
              y1="0"
              y2="180"
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <motion.g style={{ y: pointY }}>
              <circle r="6" fill="var(--background)" filter="url(#shadow)" />
              <circle r="2" fill="var(--primary)" />
            </motion.g>
          </motion.g>
        </svg>
      </div>
    </motion.div>
  );
}
