"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, Mic } from "lucide-react";

const sentences = [
  "What AI solutions are you looking for?",
  "How can I optimize my workflow today?",
  "Analyze the latest market trends for me.",
];

const App = () => {
  const [displayText, setDisplayText] = useState("");
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentFullText = sentences[sentenceIndex];
    const typingSpeed = isDeleting ? 30 : 60;
    const nextStepTimeout = isDeleting ? 500 : 2000;

    const timeout = setTimeout(() => {
      if (!isDeleting && displayText === currentFullText) {
        setTimeout(() => setIsDeleting(true), nextStepTimeout);
      } else if (isDeleting && displayText === "") {
        setIsDeleting(false);
        setSentenceIndex((prev) => (prev + 1) % sentences.length);
      } else {
        const nextText = isDeleting
          ? currentFullText.substring(0, displayText.length - 1)
          : currentFullText.substring(0, displayText.length + 1);
        setDisplayText(nextText);
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, sentenceIndex]);

  return (
    <div className="group relative flex w-full max-w-md items-center gap-3 overflow-hidden rounded-full border px-4 py-2 transition-shadow duration-500">
      <Search className="text-muted-foreground size-4 shrink-0" />

      <div className="flex h-8 flex-1 items-center text-sm font-medium whitespace-nowrap text-muted-foreground">
        <span className="block truncate">{displayText}</span>
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="ml-1 inline-block h-6 w-0.5 bg-primary"
        />
      </div>

      <Mic className="text-muted-foreground size-4 shrink-0 cursor-pointer" />
    </div>
  );
};

export default App;
