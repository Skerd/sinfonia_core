"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileSpreadsheet,
  ScanLine,
  FileText,
  Image as ImageIcon,
  FileCode,
  SquareDashedMousePointer,
} from "lucide-react";
import { cn } from "@coreModule/components/lib/utils";

const FILE_TYPES = [
  {
    name: "newscan.xlsx",
    icon: FileSpreadsheet,
    color: "text-green-500",
    bg: "bg-green-500/20",
  },
  {
    name: "report.pdf",
    icon: FileText,
    color: "text-red-500",
    bg: "bg-red-500/20",
  },
  {
    name: "data.csv",
    icon: FileCode,
    color: "text-blue-500",
    bg: "bg-blue-500/20",
  },
  {
    name: "image.png",
    icon: ImageIcon,
    color: "text-purple-500",
    bg: "bg-purple-500/20",
  },
];

export default function App() {
  type Item = (typeof FILE_TYPES)[number] & {
    id: number;
    startPos: { x: number; y: number };
    endPos: { x: number; y: number };
    rotate: number;
  };
  const [items, setItems] = useState<Item[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const id = Date.now();
      const fileType =
        FILE_TYPES[Math.floor(Math.random() * FILE_TYPES.length)];

      const entries = [
        { start: { x: -200, y: -80 }, end: { x: -60, y: 50 } },
        { start: { x: 200, y: -80 }, end: { x: 60, y: 50 } },
        { start: { x: -200, y: 80 }, end: { x: -60, y: 60 } },
        { start: { x: 200, y: 80 }, end: { x: 60, y: 60 } },
      ];
      const entry = entries[Math.floor(Math.random() * entries.length)];
      const startPos = entry.start;

      const newItem = {
        id,
        ...fileType,
        startPos,
        endPos: entry.end,
        rotate: Math.random() * 20 - 10,
      };

      setIsDragging(true);
      setItems([newItem]);

      setTimeout(() => {
        setItems([]);
        setIsDragging(false);
      }, 1800);
    }, 2600);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        "relative flex aspect-video w-full max-w-md items-center justify-center overflow-hidden rounded-lg border",
        isDragging && "bg-muted/30",
      )}
    >
      <div className="pointer-events-none z-0 flex flex-col items-center justify-center space-y-4 text-center">
        <SquareDashedMousePointer
          className="text-muted-foreground/50 size-10"
          size={32}
          strokeWidth={1.5}
        />
        <AnimatePresence mode="wait">
          {isDragging ? (
            <motion.div
              key="drag"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0 }}
              className="text-muted-foreground/50 text-sm"
            >
              Drag the files here
            </motion.div>
          ) : (
            <motion.div
              key="attach"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-muted-foreground/50 text-sm"
            >
              Attach files
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{
              x: item.startPos.x,
              y: item.startPos.y,
              rotate: item.rotate - 20,
              opacity: 0,
              scale: 0.8,
            }}
            animate={{
              x: item.endPos.x,
              y: item.endPos.y,
              rotate: item.rotate,
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.85,
              transition: { duration: 0.4 },
            }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="absolute z-10"
          >
            <div className="bg-muted flex flex-col items-center justify-center rounded-lg">
              <div className={`${item.bg} rounded-md p-3`}>
                <item.icon className={cn(item.color, "size-8 stroke-1")} />
              </div>

              <div className="pointer-events-none absolute -right-3 -bottom-3 drop-shadow-lg">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="white"
                  stroke="black"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 11V6a2 2 0 0 0-4 0" />
                  <path d="M14 10V4a2 2 0 0 0-4 0v2" />
                  <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
                  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                </svg>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
