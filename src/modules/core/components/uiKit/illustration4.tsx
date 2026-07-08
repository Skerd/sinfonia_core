"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { UserCheck, Landmark, ShieldCheck, Coins } from "lucide-react";
import { cn } from "@coreModule/components/lib/utils";

const CARDS = [
  {
    id: 1,
    title: "KYC Submitted",
    desc: "Steven Kirk, London, UK",
    status: "Completed",
    color: "text-green-600",
    bg: "bg-green-50",
    icon: <UserCheck size={20} />,
  },
  {
    id: 2,
    title: "USD Deposit (ACH)",
    desc: "$500,000 from J. Kirk",
    status: "Credited",
    color: "text-green-600",
    bg: "bg-green-50",
    icon: <Landmark size={20} />,
  },
  {
    id: 3,
    title: "+$500 PYUSD",
    desc: "from U80a...7D0a",
    status: "Confirming",
    color: "text-gray-500",
    bg: "bg-gray-100",
    icon: <ShieldCheck size={20} />,
  },
  {
    id: 4,
    title: "1,000,000 USDC",
    desc: "to External Wallet",
    status: "Pending",
    color: "text-blue-600",
    bg: "bg-blue-50",
    icon: <Coins size={20} />,
  },
];

const CARD_HEIGHT = 96;

export default function App() {
  const [index, setIndex] = useState(0);
  const displayCards = [...CARDS, ...CARDS, ...CARDS];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % (displayCards.length - 2));
    }, 2000);
    return () => clearInterval(timer);
  }, [displayCards.length]);

  return (
    <div className="relative h-60 w-full max-w-md overflow-hidden">
      <motion.div
        animate={{ y: -(index * CARD_HEIGHT) }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="flex flex-col items-center px-4"
      >
        {displayCards.map((item, i) => {
          const isCenter = i === index + 1;
          return (
            <motion.div
              key={`${item.id}-${i}`}
              animate={{
                scale: isCenter ? 1.05 : 0.9,
                opacity: isCenter ? 1 : 0.4,
                z: isCenter ? 10 : 0,
              }}
              className={cn(
                "relative mb-4 flex h-20 w-full items-center justify-between rounded-2xl border p-4 transition-colors",
                isCenter ? "shadow-lg" : "shadow-none",
              )}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold ${item.bg} ${item.color} border-current/10`}
              >
                {item.status === "Confirming" && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "linear",
                    }}
                    className="h-2.5 w-2.5 rounded-full border-2 border-current border-t-transparent"
                  />
                )}
                {item.status}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
