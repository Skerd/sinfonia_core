"use client";

import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";

export default function App() {
  const avatars = [
    {
      id: 1,
      angle: -135,
      src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    },
    {
      id: 2,
      angle: -45,
      src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
    },
    {
      id: 3,
      angle: 45,
      src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
    },
    {
      id: 4,
      angle: 135,
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    },
  ];

  const duration = 25;

  return (
    <div className="relative flex size-96 items-center justify-center overflow-hidden rounded-lg">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 360 360"
      >
        <circle
          cx="180"
          cy="180"
          r="120"
          fill="none"
          stroke="var(--border)"
          strokeWidth="2"
          strokeDasharray="4 8"
          className="opacity-60"
        />
        <circle
          cx="180"
          cy="180"
          r="65"
          fill="none"
          stroke="var(--border)"
          strokeWidth="4"
          strokeDasharray="2 6"
          className="opacity-50"
        />
      </svg>

      <div>
        <img src="/logo.svg" alt="" className="size-10 rounded-full" />
      </div>

      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: duration, repeat: Infinity, ease: "linear" }}
        className="absolute flex h-0 w-0 items-center justify-center"
      >
        {avatars.map((avatar) => (
          <div
            key={avatar.id}
            className="absolute"
            style={{
              transform: `rotate(${avatar.angle}deg) translateX(120px)`,
            }}
          >
            <motion.div
              className="absolute -top-7 -left-7 h-14 w-14"
              animate={{ rotate: [-avatar.angle, -avatar.angle - 360] }}
              transition={{
                duration: duration,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Avatar className="size-12">
                <AvatarImage src={avatar.src} alt="User Avatar" className="object-cover" />
                <AvatarFallback>U{avatar.id}</AvatarFallback>
              </Avatar>
            </motion.div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
