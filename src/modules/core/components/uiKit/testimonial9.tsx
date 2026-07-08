"use client";

import { useRef, useState, useCallback } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Ashley Cole",
    role: "Teacher at Stanford",
    image: "https://i.pravatar.cc/100?img=20",
    quote:
      "Super easy to use and actually works! I've already recommended it to a few friends.",
  },
  {
    name: "Mark Allen",
    role: "College Professor",
    image: "https://i.pravatar.cc/100?img=21",
    quote:
      "Clean design, fast results. Honestly, one of the best purchases I've made this year.",
  },
  {
    name: "Tyler Durden",
    role: "Football Coach",
    image: "https://i.pravatar.cc/100?img=22",
    quote:
      "Game-changer. Simple, effective and gets real results. Everyone needs this.",
  },
  {
    name: "Jessica Moore",
    role: "Marketing Lead",
    image: "https://i.pravatar.cc/100?img=23",
    quote:
      "Exceeded expectations. The team was responsive and the outcome was exactly what we needed.",
  },
  {
    name: "David Park",
    role: "Software Engineer",
    image: "https://i.pravatar.cc/100?img=24",
    quote:
      "Straightforward setup, great support. Would recommend to anyone looking for a reliable solution.",
  },
  {
    name: "Rachel Green",
    role: "Product Manager",
    image: "https://i.pravatar.cc/100?img=25",
    quote:
      "Real impact on our workflow. We've seen measurable improvements since day one.",
  },
  {
    name: "Chris Taylor",
    role: "Operations Director",
    image: "https://i.pravatar.cc/100?img=26",
    quote:
      "Professional from start to finish. Delivered on every promise and then some.",
  },
] as const;

const CARD_WIDTH = 320;
const CARD_GAP = 24;

export default function TestimonialsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const card = container.children[index] as HTMLElement;
    if (card) {
      card.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
      setActiveIndex(index);
    }
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const cardTotalWidth = CARD_WIDTH + CARD_GAP;
    const index = Math.round(scrollLeft / cardTotalWidth);
    setActiveIndex(Math.min(Math.max(0, index), testimonials.length - 1));
  }, []);

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <header className="mb-14 text-left">
          <h2 className="text-4xl font-bold tracking-tight  md:text-4xl">
            Real Words. Real Impact.
          </h2>
          <p className="text-gray-500 mt-2 text-lg">
            Loved by 1000+ Regular Customers around the World.
          </p>
        </header>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-6 overflow-x-auto pb-2 scroll-snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ gap: CARD_GAP }}
        >
          {testimonials.map((t, i) => {
            const isDarkCard = i % 2 === 0;
            return (
              <article
                key={i}
                className="relative flex shrink-0 snap-center overflow-hidden rounded-2xl shadow-lg"
                style={{
                  width: CARD_WIDTH,
                  minWidth: CARD_WIDTH,
                }}
              >
                {/* Top: image filling most of card, name/role overlaid at top */}
                <div
                  className="relative h-[240px] w-full overflow-hidden"
                  style={{
                    backgroundColor: isDarkCard ? "#1a1a1a" : "#e5e7eb",
                  }}
                >
                  <img
                    src={t.image}
                    alt=""
                    className="absolute inset-0 size-full object-cover object-top"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: isDarkCard
                        ? "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 50%)"
                        : "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 50%)",
                    }}
                  />
                  <div className="absolute left-0 right-0 top-6 text-center">
                    <p className="text-lg font-semibold text-white drop-shadow-sm">
                      {t.name}
                    </p>
                    <p className="text-sm text-white/90">{t.role}</p>
                  </div>
                </div>

                {/* Bottom: solid dark block with stars + quote */}
                <div
                  className="flex flex-col items-center px-5 pb-6 pt-4"
                  style={{
                    backgroundColor: isDarkCard ? "#1a1a1a" : "#374151",
                    minHeight: 140,
                  }}
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className="size-5 fill-amber-400 text-amber-400"
                        aria-hidden
                      />
                    ))}
                  </div>
                  <blockquote className="mt-3 text-center text-sm leading-relaxed text-white">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                </div>
              </article>
            );
          })}
        </div>

        {/* Pagination: 7 dots, active darker/filled */}
        <div className="mt-10 flex justify-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToIndex(i)}
              className="rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              aria-label={`Go to testimonial ${i + 1}`}
              aria-current={activeIndex === i ? "true" : undefined}
            >
              <span
                className={`block rounded-full transition-all ${
                  activeIndex === i
                    ? "size-2.5 bg-gray-900"
                    : "size-2 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
