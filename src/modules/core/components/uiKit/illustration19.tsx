"use client";

import { useState } from "react";
import { motion } from "motion/react";

export default function App({
  defaultDirection = "horizontal",
}: {
  defaultDirection?: "horizontal" | "vertical";
}) {
  const [direction, setDirection] = useState(defaultDirection);
  const isVertical = direction === "vertical";

  const scannerClasses = isVertical
    ? "absolute left-0 right-0 h-48 bg-gradient-to-t from-[#2DD4BF]/15 to-transparent border-b-2 border-[#14B8A6]/40"
    : "absolute top-0 bottom-0 w-48 bg-gradient-to-l from-[#2DD4BF]/15 to-transparent border-r-2 border-[#14B8A6]/40";

  const animationProps = isVertical
    ? { top: ["-20%", "110%", "-20%"] }
    : { left: ["-20%", "110%", "-20%"] };

  return (
    <div className="relative flex aspect-video w-full max-w-md overflow-hidden rounded-lg">
      <motion.div
        className={`${scannerClasses} pointer-events-none z-50 backdrop-blur-[0.5px]`}
        animate={animationProps}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "linear",
          times: [0, 0.5, 1],
        }}
      />

      <img
        src="https://images.unsplash.com/photo-1618761714954-0b8cd0026356?q=80&w=2070&auto=format&fit=crop"
        alt="Scanned Content"
        className="h-full w-full object-cover object-top-left blur-sm grayscale"
      />
    </div>
  );
}
