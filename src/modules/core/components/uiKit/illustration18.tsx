"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus } from "lucide-react";

const headers = ["Sub Category", "Units Sold/Mon", "Average Price"];
const data = [
  ["Gardening and...", "60,000", "$4,500.00"],
  ["Patio and lau...", "4,500", "$450.67"],
  ["Tech devices...", "309", "$345.45"],
];

const buttons = [
  { text: "Add Tag", icon: Plus },
  { text: "Compare" },
  { text: "Track" },
  { text: "Filter" },
];

export default function App() {
  const [active, setActive] = useState("0-2");
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      const r = Math.floor(Math.random() * data.length);
      const c = Math.floor(Math.random() * headers.length);
      setActive(`${r}-${c}`);
    }, 1800);
    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div
      className="border-b-none w-full max-w-lg overflow-hidden rounded-lg border"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-4 border-b p-4">
        <h2 className="text-sm">Products (800+)</h2>
        <div className="flex gap-2">
          {buttons.map((btn, i) => (
            <button
              key={i}
              className="bg-muted hover:bg-muted flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
            >
              {btn.icon && <btn.icon className="size-2" />}
              {btn.text}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3">
        {headers.map((h, i) => (
          <div
            key={i}
            className={`border-b px-6 py-4 text-xs ${i !== headers.length - 1 ? "" : ""}`}
          >
            {h}
          </div>
        ))}

        {data.map((row, r) =>
          row.map((cell, c) => {
            const id = `${r}-${c}`;
            const isActive = active === id;

            return (
              <div
                key={id}
                onMouseEnter={() => isHovered && setActive(id)}
                className={`text-muted-foreground relative cursor-pointer px-6 py-5 text-xs transition-colors duration-200 ${r !== data.length - 1 ? "border-b" : ""} ${isActive ? "bg-primary/5" : "hover:bg-primary/5"} `}
              >
                {isActive && (
                  <motion.div
                    layoutId="excel-selection"
                    className="border-purple-500 pointer-events-none absolute inset-0 z-10 border"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  >
                    <div className="bg-purple-500 absolute -top-[2px] -left-[2px] h-[5px] w-[5px] rounded-sm" />
                    <div className="bg-purple-500 absolute -top-[2px] -right-[2px] h-[5px] w-[5px] rounded-sm" />
                    <div className="bg-purple-500 absolute -bottom-[2px] -left-[2px] h-[5px] w-[5px] rounded-sm" />
                    <div className="bg-purple-500 absolute -right-[2px] -bottom-[2px] h-[5px] w-[5px] rounded-sm" />
                  </motion.div>
                )}
                {cell}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
