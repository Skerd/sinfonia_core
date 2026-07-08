"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";

const TASKS = [
  { id: 0, title: "Initiated session", time: "Aug 4 at 14:09" },
  { id: 1, title: "Session created", time: "Aug 4 at 14:10" },
  { id: 2, title: "User creation process", time: "Aug 4 at 14:12" },
  { id: 3, title: "User created", time: "Aug 4 at 14:16" },
];

function Spinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
      className="size-4 rounded-full border-2 border-zinc-600 border-t-zinc-300"
    />
  );
}

function CheckCircle({ visible }: { visible: boolean }) {
  return (
    <div className="relative flex size-4 shrink-0 items-center justify-center">
      <AnimatePresence>
        {visible && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {visible && (
          <motion.div
            className="relative z-10"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              delay: 0.12,
              type: "spring",
              stiffness: 400,
              damping: 20,
            }}
          >
            <Check className="size-2 text-background" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TaskChecklist() {
  const [checkedCount, setCheckedCount] = useState(0);

  useEffect(() => {
    if (checkedCount < TASKS.length) {
      const t = setTimeout(() => setCheckedCount((c) => c + 1), 2000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCheckedCount(0), 1800);
    return () => clearTimeout(t);
  }, [checkedCount]);

  return (
    <div className="w-full max-w-xs space-y-5 rounded-lg border p-4">
      <div className="flex items-center justify-between rounded-xl border p-3">
        <div className="flex items-center gap-3">
          <Spinner />
          <span className="text-muted-foreground font-mono text-xs">
            session.created
          </span>
        </div>
        <span className="text-muted-foreground text-xs">13:09</span>
      </div>

      <div className="relative">
        <div className="space-y-4 ps-3.5">
          {TASKS.map((task, idx) => {
            const isChecked = idx < checkedCount;

            return (
              <div key={task.id} className="relative flex items-center gap-4">
                <CheckCircle visible={isChecked} />
                <div className="pt-1.5">
                  <motion.p
                    className="text-xs leading-none"
                    animate={{
                      color: isChecked
                        ? "var(--foreground)"
                        : "var(--muted-foreground)",
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {task.title}
                  </motion.p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {task.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
