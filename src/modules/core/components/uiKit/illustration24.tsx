"use client";

import { motion } from "motion/react";
import { Globe, Link as LinkIcon, Code } from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { useTheme } from "next-themes";

// SVG viewBox: 700x400. All HTML elements use % of container (x/700, y/400).
const PATH_LEFT  = "M 350 245 L 350 180 Q 350 160 330 160 L 140 160 Q 120 160 120 140 L 120 105";
const PATH_MID   = "M 350 245 L 350 105";
const PATH_RIGHT = "M 350 245 L 350 180 Q 350 160 370 160 L 560 160 Q 580 160 580 140 L 580 105";

export default function Illustration24() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const dashColor = isDark ? "#334155" : "#cbd5e1";

  return (
    <div className="flex w-full items-center justify-center bg-background p-4">
      <div
        className="relative w-full max-w-[700px]"
        style={{ aspectRatio: "700 / 400" }}
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 700 400"
          preserveAspectRatio="xMidYMid meet"
        >
          <path d={PATH_LEFT}  stroke={dashColor} strokeWidth="2" strokeDasharray="6 6" fill="none" />
          <path d={PATH_MID}   stroke={dashColor} strokeWidth="2" strokeDasharray="6 6" fill="none" />
          <path d={PATH_RIGHT} stroke={dashColor} strokeWidth="2" strokeDasharray="6 6" fill="none" />
          <AnimatedLine path={PATH_LEFT}  delay={0} />
          <AnimatedLine path={PATH_MID}   delay={0.6} />
          <AnimatedLine path={PATH_RIGHT} delay={1.2} />
        </svg>

        {/* Top buttons — left/top as % of 700x400 */}
        <TopButton icon={<Globe    size={16} className="text-violet-500 shrink-0" />} text="Portal"     style={{ left: "5.71%",  top: "11.25%" }} />
        <TopButton icon={<LinkIcon size={16} className="text-violet-500 shrink-0" />} text="Magic Link" style={{ left: "38.57%", top: "11.25%" }} />
        <TopButton icon={<Code    size={16} className="text-violet-500 shrink-0" />} text="Embed"      style={{ left: "71.43%", top: "11.25%" }} />

        {/* Center button */}
        <div
          className="absolute z-10"
          style={{ left: "32.86%", top: "61.25%", width: "34.29%", height: "15%" }}
        >
          <PulseRings />
          <Button className="relative h-full w-full rounded-xl bg-violet-500 text-base font-semibold text-white shadow-[0_4px_0_#5b21b6] hover:bg-violet-600 active:translate-y-1 active:shadow-none">
            One Click Access
          </Button>
        </div>
      </div>
    </div>
  );
}

function TopButton({
  icon,
  text,
  style,
}: {
  icon: React.ReactNode;
  text: string;
  style: React.CSSProperties;
}) {
  return (
    <div
      className="absolute z-10 flex cursor-pointer items-center justify-center gap-2 rounded-xl border bg-background shadow-sm transition-transform hover:-translate-y-1"
      style={{ width: "22.86%", height: "15%", ...style }}
    >
      {icon}
      <span className="truncate text-sm font-medium text-foreground">{text}</span>
    </div>
  );
}

function AnimatedLine({ path, delay }: { path: string; delay: number }) {
  return (
    <motion.path
      d={path}
      stroke="#a855f7"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
      initial={{ pathLength: 0.15, pathOffset: -0.15, opacity: 0 }}
      animate={{ pathOffset: 1.15, opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

function PulseRings() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute border border-violet-300 dark:border-violet-800"
          initial={{ width: "100%", height: "100%", opacity: 0 }}
          animate={{
            width: ["100%", "200%"],
            height: ["100%", "433%"],
            opacity: [0, 0.6, 0],
            borderRadius: ["12px", "50px"],
          }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: "linear" }}
        />
      ))}
    </div>
  );
}
