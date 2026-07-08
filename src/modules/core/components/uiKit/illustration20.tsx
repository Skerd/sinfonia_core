"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";

const COLORS = ["#8B5CF6", "#C084FC", "#3B82F6", "#10B981", "#34D399"];

const generateData = () =>
  [1, 2, 3, 4, 5].map((id, idx) => ({
    id: `b-${id}`,
    label: id,
    value: 1.5 + Math.random() * 3.5,
    color: COLORS[idx],
  }));

export default function App() {
  const [data, setData] = useState(generateData());

  useEffect(() => {
    const interval = setInterval(() => setData(generateData()), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md rounded-lg py-6">
      <div className="relative mt-4 ml-4 h-[300px] w-full">
        {[0, 1, 2, 3, 4, 5].map((val) => (
          <div
            key={val}
            className="absolute flex w-full items-center"
            style={{ bottom: `${val * 20}%` }}
          >
            <span className="text-muted-foreground/40 absolute -left-10 w-6 text-right text-sm font-medium">
              {val}
            </span>
            <div className="w-full border border-b border-dashed"></div>
          </div>
        ))}

        <div className="absolute inset-0 z-10 flex h-full items-end justify-around">
          {data.map((bar, idx) => {
            const heightPct = (bar.value / 5) * 100;

            return (
              <div
                key={bar.id}
                className="relative flex h-full flex-col items-center justify-end"
              >
                <motion.div
                  initial={{ height: "0%", opacity: 0 }}
                  animate={{ height: `${heightPct}%`, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 18,
                    delay: idx * 0.06,
                  }}
                  className="w-12 origin-bottom rounded-lg"
                  style={{ backgroundColor: bar.color }}
                />
                <span className="absolute -bottom-10 text-sm font-medium text-slate-400">
                  {bar.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
