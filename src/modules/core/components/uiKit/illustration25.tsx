"use client";

import { useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
} from "motion/react";
import { useTheme } from "next-themes";

const TOTAL_BARS = 36;

const PHASES = [
  {
    title: "Rating Point",
    value: 1228,
    max: 1986,
    color: "#ea580c",
    lightInactive: "#fed7aa",
    darkInactive: "#431407",
  },
  {
    title: "Active Users",
    value: 3450,
    max: 5000,
    color: "#6366f1",
    lightInactive: "#e0e7ff",
    darkInactive: "#1e1b4b",
  },
  {
    title: "System Health",
    value: 89,
    max: 100,
    color: "#10b981",
    lightInactive: "#d1fae5",
    darkInactive: "#052e16",
  },
];

const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
  exit: {
    opacity: 1,
    transition: { staggerChildren: 0.02, staggerDirection: -1 },
  },
};

const barVariants = {
  hidden: { scaleY: 0, opacity: 0 },
  visible: {
    scaleY: 1,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 20 },
  },
  exit: {
    scaleY: 0,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export default function Illustration25() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const currentValue = useMotionValue(0);
  const roundedValue = useTransform(currentValue, (latest) =>
    Math.round(latest).toLocaleString("en-US"),
  );

  useEffect(() => {
    let isActive = true;

    const runAnimationCycle = async () => {
      currentValue.set(0);
      setIsVisible(true);

      animate(currentValue, PHASES[phaseIndex].value, {
        duration: 1.5,
        ease: "easeOut",
      });

      await new Promise((resolve) => setTimeout(resolve, 4500));
      if (!isActive) return;

      setIsVisible(false);

      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!isActive) return;

      setPhaseIndex((prev) => (prev + 1) % PHASES.length);
    };

    runAnimationCycle();

    return () => {
      isActive = false;
    };
  }, [phaseIndex]);

  const currentPhase = PHASES[phaseIndex];
  const activeBarCount = Math.round(
    (currentPhase.value / currentPhase.max) * TOTAL_BARS,
  );
  const inactiveColor = isDark
    ? currentPhase.darkInactive
    : currentPhase.lightInactive;

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6">
        <div className="mb-1 flex h-5 items-end">
          <AnimatePresence>
            {isVisible && (
              <motion.h3
                key={`title-${phaseIndex}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="text-muted-foreground text-sm font-medium"
              >
                {currentPhase.title}
              </motion.h3>
            )}
          </AnimatePresence>
        </div>
        <div className="flex h-9 items-end justify-between">
          <div className="flex h-full items-end">
            <AnimatePresence>
              {isVisible && (
                <motion.span
                  key={`value-${phaseIndex}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="text-foreground text-4xl leading-none font-bold tracking-tight"
                >
                  {roundedValue}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div className="flex h-7 items-end">
            <AnimatePresence>
              {isVisible && (
                <motion.span
                  key={`max-${phaseIndex}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="text-muted-foreground text-lg leading-none font-medium"
                >
                  /{currentPhase.max.toLocaleString("en-US")}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex h-16 w-full items-end justify-between gap-4">
        <AnimatePresence mode="wait">
          {isVisible && (
            <motion.div
              key={`bars-${phaseIndex}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex h-full w-full items-end justify-between gap-[3px]"
            >
              {Array.from({ length: TOTAL_BARS }).map((_, i) => (
                <motion.div
                  key={i}
                  variants={barVariants}
                  className="flex-1 origin-bottom rounded-full"
                  style={{
                    height: "100%",
                    backgroundColor:
                      i < activeBarCount ? currentPhase.color : inactiveColor,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
