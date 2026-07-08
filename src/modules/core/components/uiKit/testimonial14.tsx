"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "The team is committed to exceeding expectations. We received candidate profiles the same day, and the selected candidate was onboarded by the end of the week.",
    name: "James Robinson",
    position: "VP of HR, Apex Dynamics",
    image: "https://i.pravatar.cc/100?img=11",
    bg: "bg-blue-100 dark:bg-blue-950",
    x: "10%",
    y: "5%",
    rotate: -3,
  },
  {
    quote:
      "Our project timelines were incredibly tight, yet TechWave exceeded our expectations by not only delivering top-tier talent swiftly but also ensuring a seamless onboarding process.",
    name: "David Mitchell",
    position: "Project Lead, NexGen",
    image: "https://i.pravatar.cc/100?img=12",
    bg: "bg-violet-100 dark:bg-violet-950",
    x: "45%",
    y: "0%",
    rotate: 2,
  },
  {
    quote:
      "They delivered exactly what we needed — top-quality talent through a free, streamlined process every time.",
    name: "Emily Carter",
    position: "Operations Director, Stellar Solutions",
    image: "https://i.pravatar.cc/100?img=47",
    bg: "bg-green-100 dark:bg-green-950",
    x: "0%",
    y: "35%",
    rotate: 4,
  },
  {
    quote:
      "Despite the challenges of a compressed schedule, TechWave not only provided exceptional professionals promptly but also facilitated an effortless integration experience.",
    name: "Emily Carter",
    position: "Operations Director, Stellar Solutions",
    image: "https://i.pravatar.cc/100?img=47",
    bg: "bg-rose-100 dark:bg-rose-950",
    x: "8%",
    y: "55%",
    rotate: -2,
  },
  {
    quote:
      "We got the candidate profiles on the same day, and the chosen candidate was fully integrated by the week's end.",
    name: "Mark Johnson",
    position: "Talent Specialist, InnovateTech Solutions",
    image: "https://i.pravatar.cc/100?img=33",
    bg: "bg-amber-100 dark:bg-amber-950",
    x: "35%",
    y: "50%",
    rotate: 1,
  },
  {
    quote:
      "The best partner we've worked with. They quickly understood our requirements and delivered talent who are already thriving on our team.",
    name: "Michael Torres",
    position: "CEO, Visionary Ventures",
    image: "https://i.pravatar.cc/100?img=15",
    bg: "bg-teal-100 dark:bg-teal-950",
    x: "55%",
    y: "45%",
    rotate: -4,
  },
] as const;

const BASE_Z = 1;
const TOP_Z = 100;
const DRAGGING_Z = 150;

export default function TestimonialsDraggable() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [lastDroppedIndex, setLastDroppedIndex] = useState<number | null>(null);

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl md:text-4xl font-bold leading-tight">
          What they say about us
        </h2>

        <div
          ref={containerRef}
          className="relative mt-14 min-h-[520px] md:min-h-[580px]"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              className={`absolute w-[min(320px,85vw)] max-w-sm cursor-grab rounded-2xl p-4  active:cursor-grabbing ${t.bg}`}
              style={{
                left: t.x,
                top: t.y,
                rotate: t.rotate,
                zIndex:
                  draggingIndex === i
                    ? DRAGGING_Z
                    : lastDroppedIndex === i
                      ? TOP_Z
                      : BASE_Z + i,
              }}
              initial={false}
              drag
              dragElastic={0.1}
              dragMomentum
              dragConstraints={containerRef}
              dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
              onDragStart={() => {
                setLastDroppedIndex(i);
                setDraggingIndex(i);
              }}
              onDragEnd={() => setDraggingIndex(null)}
              whileDrag={{
                scale: 1.02,
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              }}
            >
              <div className="rounded-xl p-4">
                <Quote
                  className="text-foreground/70 mb-2 size-10"
                  strokeWidth={1}
                  aria-hidden
                />
                <blockquote className="text-foreground text-sm leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="mt-4 flex items-center gap-3">
                  <img
                    src={t.image}
                    alt=""
                    width={40}
                    height={40}
                    className="size-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {t.position}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
