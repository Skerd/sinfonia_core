"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const OPTIONS = [
  "package:flutter/animation.dart",
  "package:flutter/cuppertino.dart",
  "package:flutter/gestures.dart",
  "package:flutter/foundations.dart",
  "package:flutter/paintings.dart",
];

const TARGET = "'package:flu";
const MIN_INDEX = 9;

export default function App() {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let index = 0;
    let dir = 1;

    const type = () => {
      setTyped(TARGET.slice(0, index));

      if (index === TARGET.length && dir === 1) {
        dir = -1;
        timeout = setTimeout(type, 2500);
      } else if (index === MIN_INDEX && dir === -1) {
        dir = 1;
        timeout = setTimeout(type, 800);
      } else {
        index += dir;
        timeout = setTimeout(type, dir === 1 ? 150 : 70);
      }
    };

    timeout = setTimeout(type, 1000);
    return () => clearTimeout(timeout);
  }, []);

  const search = typed.replace(/^'/, "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-lg overflow-hidden rounded-lg border p-6 pb-10"
    >
      <div className="pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex font-mono text-xs tracking-wide">
        <div className="flex flex-col items-end pr-4 select-none">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex h-6 items-center text-muted-foreground/50">
              {i}
            </div>
          ))}
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex h-5 items-center">
            <span className="text-destructive mr-3">import</span>
            <span className="text-purple-500">
              'package:flutter/material.dart';
            </span>
          </div>

          <div className="relative flex h-8 items-center">
            <span className="text-destructive mr-3">import</span>
            <span className="text-purple-500">{typed}</span>

            <motion.div
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
              className="ml-0.5 h-4 w-[2px] bg-black/80 dark:bg-white"
            />

            <AnimatePresence>
              {search.length > 2 && (
                <motion.div
                  initial={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -5, filter: "blur(5px)" }}
                  className="bg-muted/60 absolute top-10 left-20 z-20  overflow-hidden rounded-lg border py-2"
                >
                  {OPTIONS.map((opt, i) => {
                    const match = opt.startsWith(search);
                    return (
                      <div
                        key={opt}
                        className="flex cursor-pointer items-center px-4 py-1.5 transition-colors"
                        style={{ opacity: i === 4 ? 0.4 : 1 }}
                      >
                        {match ? (
                          <>
                            <span className="text-purple-500">{search}</span>
                            <span className="text-foreground">
                              {opt.slice(search.length)}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">{opt}</span>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
