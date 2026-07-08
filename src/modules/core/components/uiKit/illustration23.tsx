"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "next-themes";

type ColorScheme = {
  bg: string;
  text: string;
  border: string;
  accent: string;
  muted: string;
};

type TaskTemplate = {
  title: string;
  date: string;
  initial: string;
  light: ColorScheme;
  dark: ColorScheme;
};

type Task = TaskTemplate & { id: string; lane: number; initialX: number };

const TASK_TEMPLATES: TaskTemplate[] = [
  {
    title: "Show the meters to the electrician",
    date: "until 23.05.24",
    initial: "AI",
    light: {
      bg: "#d1fae5",
      text: "#064e3b",
      border: "#6ee7b7",
      accent: "#059669",
      muted: "#065f46",
    },
    dark: {
      bg: "#052e16",
      text: "#6ee7b7",
      border: "#065f46",
      accent: "#10b981",
      muted: "#34d399",
    },
  },
  {
    title: "Pay for a subscription to the service",
    date: "until 23.05.24",
    initial: "AI",
    light: {
      bg: "#ede9fe",
      text: "#3b0764",
      border: "#c4b5fd",
      accent: "#7c3aed",
      muted: "#6d28d9",
    },
    dark: {
      bg: "#1e1040",
      text: "#c4b5fd",
      border: "#4c1d95",
      accent: "#8b5cf6",
      muted: "#a78bfa",
    },
  },
  {
    title: "Call a tire fitter",
    date: "until 23.05.24",
    initial: "AI",
    light: {
      bg: "#dbeafe",
      text: "#1e3a8a",
      border: "#93c5fd",
      accent: "#2563eb",
      muted: "#1d4ed8",
    },
    dark: {
      bg: "#0f1f4a",
      text: "#93c5fd",
      border: "#1d4ed8",
      accent: "#3b82f6",
      muted: "#60a5fa",
    },
  },
  {
    title: "Update server infrastructure",
    date: "until 24.05.24",
    initial: "DS",
    light: {
      bg: "#fce7f3",
      text: "#500724",
      border: "#f9a8d4",
      accent: "#db2777",
      muted: "#9d174d",
    },
    dark: {
      bg: "#2d0418",
      text: "#f9a8d4",
      border: "#9d174d",
      accent: "#ec4899",
      muted: "#f472b6",
    },
  },
  {
    title: "Review Q3 marketing metrics",
    date: "until 25.05.24",
    initial: "MK",
    light: {
      bg: "#ffedd5",
      text: "#431407",
      border: "#fdba74",
      accent: "#ea580c",
      muted: "#9a3412",
    },
    dark: {
      bg: "#2c0e03",
      text: "#fdba74",
      border: "#9a3412",
      accent: "#f97316",
      muted: "#fb923c",
    },
  },
];

const FINAL_X = -900;

export default function Illustration23() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const gridColor = isDark ? "#2A2A35" : "rgba(0,0,0,0.07)";

  useEffect(() => {
    if (!containerRef.current) return;
    setContainerWidth(containerRef.current.offsetWidth);

    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!containerWidth) return;

    let taskCounter = 0;

    const minSpacing = Math.max(300, containerWidth * 0.4);

    // Pre-generate two staggered x positions per lane with random jitter
    const lanePositions = [0, 1, 2].map(() => {
      const x0 = containerWidth * (0.55 + Math.random() * 0.3);
      const x1 = x0 - minSpacing - Math.random() * containerWidth * 0.15;
      return [x0, x1] as [number, number];
    });

    const initialTasks: Task[] = Array.from({ length: 6 }).map((_, i) => {
      const template =
        TASK_TEMPLATES[Math.floor(Math.random() * TASK_TEMPLATES.length)];
      const lane = i % 3;
      const laneGroup = Math.floor(i / 3);
      return {
        id: `task-init-${Date.now()}-${i}`,
        lane,
        initialX: lanePositions[lane][laneGroup],
        ...template,
      };
    });

    setTasks(initialTasks);

    const addTask = () => {
      const template =
        TASK_TEMPLATES[Math.floor(Math.random() * TASK_TEMPLATES.length)];
      setTasks((prev) =>
        [
          ...prev,
          {
            id: `task-${Date.now()}-${taskCounter}`,
            lane: taskCounter % 3,
            initialX: containerWidth * 1.05 + Math.random() * 80,
            ...template,
          },
        ].slice(-15),
      );
      taskCounter++;
    };

    const interval = setInterval(addTask, 3500);
    return () => clearInterval(interval);
  }, [containerWidth]);

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full overflow-hidden rounded-md border"
    >
      {/* Scrolling grid header */}
      <motion.div
        className="absolute top-0 left-0 h-16 w-[200%] border-b"
        style={{
          backgroundImage: `repeating-linear-gradient(to right, transparent, transparent 49px, ${gridColor} 49px, ${gridColor} 50px)`,
        }}
        animate={{ x: ["0px", "-50px"] }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />

      {/* Today indicator */}
      <div className="absolute top-8 bottom-0 left-1/2 z-30 w-px bg-indigo-400 dark:bg-indigo-600">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 dark:bg-indigo-800 px-4 py-1.5 text-xs font-medium whitespace-nowrap text-white">
          22.04.24
        </div>
      </div>

      <AnimatePresence>
        {tasks.map((task) => {
          const scheme = isDark ? task.dark : task.light;
          const taskWidth = Math.max(240, task.title.length * 8);
          const distance = task.initialX - FINAL_X;
          const duration = distance / 120;

          return (
            <motion.div
              key={task.id}
              initial={{ x: task.initialX, opacity: 0 }}
              animate={{ x: FINAL_X, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                x: { duration, ease: "linear" },
                opacity: { duration: 0.4 },
              }}
              className="absolute left-0 z-10 cursor-pointer overflow-hidden rounded-sm p-3"
              style={{
                top: 100 + task.lane * 70,
                width: taskWidth,
                backgroundColor: scheme.bg,
                border: `1px solid ${scheme.border}`,
              }}
            >
              <div
                className="absolute top-0 left-0 h-[4px] w-full"
                style={{ backgroundColor: scheme.accent }}
              />
              <div className="mt-1 flex w-full items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold"
                    style={{
                      backgroundColor: scheme.accent + "33",
                      color: scheme.accent,
                    }}
                  >
                    {task.initial}
                  </div>
                  <h3
                    className="truncate text-[13px] leading-snug font-medium"
                    style={{ color: scheme.text }}
                  >
                    {task.title}
                  </h3>
                </div>
                <span
                  className="shrink-0 font-mono text-[10px]"
                  style={{ color: scheme.muted }}
                >
                  {task.date}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
