"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const MOCK_MESSAGES = [
  { id: 1, text: "Hi, how can I help you today?", sender: "bot" },
  { id: 2, text: "Hey, I'm having trouble with my account.", sender: "user" },
  { id: 3, text: "What seems to be the problem?", sender: "bot" },
  { id: 4, text: "I can't log in to my dashboard.", sender: "user" },
  { id: 5, text: "Let me check your credentials right away.", sender: "bot" },
  { id: 6, text: "I appreciate the quick help!", sender: "user" },
  { id: 7, text: "Would you like me to reset your password?", sender: "bot" },
  { id: 8, text: "Yes, that would be great.", sender: "user" },
];

const App = () => {
  const [messages, setMessages] = useState<{ uniqueId: number; id: number; text: string; sender: string }[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prev) => {
        const nextIndex = index % MOCK_MESSAGES.length;
        const newMessage = {
          ...MOCK_MESSAGES[nextIndex],
          uniqueId: Date.now(),
        };

        const updated = [...prev, newMessage];
        return updated.length > 7 ? updated.slice(1) : updated;
      });
      setIndex((prev) => prev + 1);
    }, 1500);

    return () => clearInterval(interval);
  }, [index]);

  return (
    <div className="relative flex h-72 w-full max-w-md flex-col justify-end overflow-hidden mask-t-from-50% mask-t-to-90%">
      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false} mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.uniqueId}
              layout
              initial={{ opacity: 0, y: 40, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 25,
                mass: 0.7,
              }}
              className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-5 py-3 text-xs ${
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-muted-foreground rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
