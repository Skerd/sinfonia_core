"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const App = () => {
  const [index, setIndex] = useState(0);
  const totalSlots = 5;

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % (totalSlots + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative flex gap-3">
      {[...Array(totalSlots)].map((_, i) => (
        <div
          key={i}
          className="relative flex h-16 w-12 items-center justify-center"
        >
          <div className="bg-background absolute inset-0 rounded-xl border" />

          {i === index && (
            <motion.div
              layoutId="focus-ring"
              transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
              className="border-primary absolute inset-0 z-10 rounded-xl border"
            />
          )}

          <AnimatePresence>
            {i < index && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="bg-primary z-20 size-3 rounded-full"
              />
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

export default App;
