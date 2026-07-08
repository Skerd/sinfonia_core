"use client";

import { useState } from "react";
import Image from "next/image";

const testimonials = [
  {
    quote:
      "Exceptional service and dedication. The team brought our vision to life and exceeded all expectations.",
    name: "Alex Turner",
    role: "CEO at VentureLabs",
    image: "https://i.pravatar.cc/100?img=1",
  },
  {
    quote:
      "Creative solutions, fast delivery, and outstanding professionalism. Highly recommend working with them.",
    name: "Julia Williams",
    role: "Marketing Director at Creatify",
    image: "https://i.pravatar.cc/100?img=2",
  },
  {
    quote:
      "An innovative approach and seamless communication. We achieved our goals sooner thanks to their expertise.",
    name: "Samuel Lee",
    role: "Product Owner at NexGen",
    image: "https://i.pravatar.cc/100?img=3",
  },
];

export default function TestimonialsMinimal() {
  const [active, setActive] = useState(0);

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-16">
      <div className="relative mb-12 min-h-[80px]">
        {testimonials.map((t, i) => (
          <p
            key={i}
            className={`text-foreground absolute inset-0 text-xl leading-relaxed font-light transition-all duration-500 ease-out md:text-2xl ${
              active === i
                ? "blur-0 translate-y-0 opacity-100"
                : "pointer-events-none translate-y-4 opacity-0 blur-sm"
            } `}
          >
            "{t.quote}"
          </p>
        ))}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex -space-x-2">
          {testimonials.map((t, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`ring-background relative h-10 w-10 overflow-hidden rounded-full ring-2 transition-all duration-300 ease-out ${active === i ? "z-10 scale-110" : "grayscale hover:scale-105 hover:grayscale-0"} `}
            >
              <Image src={t.image} alt={t.name} fill className="object-cover" />
            </button>
          ))}
        </div>

        <div className="bg-border h-8 w-px" />

        <div className="relative min-h-[44px] flex-1">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`absolute inset-0 flex flex-col justify-center transition-all duration-400 ease-out ${active === i ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-2 opacity-0"} `}
            >
              <span className="text-foreground text-sm font-medium">
                {t.name}
              </span>
              <span className="text-muted-foreground text-xs">{t.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
