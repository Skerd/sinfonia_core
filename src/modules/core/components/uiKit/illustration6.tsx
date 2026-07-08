"use client";

import { motion } from "motion/react";
import { MousePointer2 } from "lucide-react";
import { cn } from "@coreModule/components/lib/utils";

function withPauses(keys: string[]) {
  return keys.flatMap((k) => [k, k]);
}

function pausedTimes(count: number) {
  const moves = count - 1;
  const pauses = count;
  const p = 2;
  const m = 1;
  const total = pauses * p + moves * m;
  const times: number[] = [];
  let t = 0;
  for (let i = 0; i < count; i++) {
    times.push(t / total);
    t += p;
    times.push(t / total);
    if (i < count - 1) t += m;
  }
  times[times.length - 1] = 1;
  return times;
}

const Cursor = ({
  name,
  color,
  xKeys,
  yKeys,
  duration,
  delay = 0,
}: {
  name: string;
  color: string;
  xKeys: string[];
  yKeys: string[];
  duration: number;
  delay?: number;
}) => {
  const x = withPauses(xKeys);
  const y = withPauses(yKeys);
  const times = pausedTimes(xKeys.length);

  return (
    <motion.div
      className="pointer-events-none absolute z-10 flex flex-col items-start gap-1"
      style={{ left: xKeys[0], top: yKeys[0] }}
      animate={{ left: x, top: y }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear",
        delay,
        times,
      }}
    >
      <MousePointer2 className="text-muted-foreground size-4" />
      <span
        className={cn(
          "rounded-full px-3 py-1 text-xs font-medium text-white",
          color,
        )}
      >
        {name}
      </span>
    </motion.div>
  );
};

export default function App() {
  return (
    <div className="bg-muted/30 relative aspect-video h-full w-full max-w-md overflow-hidden rounded-md border">
      <Cursor
        name="Michelle"
        color="bg-amber-200 text-amber-700 dark:text-amber-300 dark:bg-amber-900"
        duration={18}
        delay={0}
        xKeys={["55%", "15%", "60%", "5%", "45%", "55%"]}
        yKeys={["8%", "40%", "55%", "25%", "50%", "8%"]}
      />
      <Cursor
        name="Paul Jason"
        color="bg-emerald-200 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-900"
        duration={15}
        delay={1}
        xKeys={["5%", "45%", "20%", "55%", "30%", "5%"]}
        yKeys={["30%", "10%", "50%", "35%", "5%", "30%"]}
      />
      <Cursor
        name="Savannah"
        color="bg-red-200 text-destructive dark:text-red-300 dark:bg-red-900"
        duration={20}
        delay={2.5}
        xKeys={["30%", "60%", "10%", "50%", "20%", "30%"]}
        yKeys={["55%", "20%", "10%", "60%", "35%", "55%"]}
      />
    </div>
  );
}
