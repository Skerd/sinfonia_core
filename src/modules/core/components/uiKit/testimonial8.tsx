"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    id: 1,
    quote:
      "The attention to detail and creative vision transformed our brand identity completely.",
    author: "Sarah Chen",
    role: "Creative Director",
    company: "Studio Forma",
    image: "https://i.pravatar.cc/100?img=1",
  },
  {
    id: 2,
    quote:
      "Working with them felt like a true creative partnership from day one.",
    author: "Marcus Webb",
    role: "Head of Design",
    company: "Minimal Co",
    image: "https://i.pravatar.cc/100?img=2",
  },
  {
    id: 3,
    quote:
      "They understand that great design is invisible yet unforgettable.",
    author: "Elena Voss",
    role: "Art Director",
    company: "Pixel & Co",
    image: "https://i.pravatar.cc/100?img=3",
  },
];

export default function TestimonialsEditorial() {
  const [active, setActive] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleChange = (index: number) => {
    if (index === active || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActive(index);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 300);
  };

  const handlePrev = () => {
    const newIndex = active === 0 ? testimonials.length - 1 : active - 1;
    handleChange(newIndex);
  };

  const handleNext = () => {
    const newIndex =
      active === testimonials.length - 1 ? 0 : active + 1;
    handleChange(newIndex);
  };

  const current = testimonials[active];

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <div className="flex items-start gap-8">
        <span
          className="text-foreground/10 select-none text-[120px] font-light leading-none transition-all duration-500"
          style={{ fontFeatureSettings: '"tnum"' }}
        >
          {String(active + 1).padStart(2, "0")}
        </span>

        <div className="flex-1 pt-6">
          <blockquote
            className={`text-foreground text-2xl font-light leading-relaxed tracking-tight transition-all duration-300 md:text-3xl ${
              isTransitioning
                ? "translate-x-4 opacity-0"
                : "translate-x-0 opacity-100"
            }`}
          >
            {current.quote}
          </blockquote>

          <div
            className={`mt-10 cursor-default transition-all duration-300 delay-100 group ${
              isTransitioning ? "opacity-0" : "opacity-100"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="relative size-12 overflow-hidden rounded-full ring-2 ring-foreground/10 transition-all duration-300 group-hover:ring-foreground/30">
                <Image
                  src={current.image}
                  alt={current.author}
                  fill
                  className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                />
              </div>
              <div>
                <p className="text-foreground font-medium">{current.author}</p>
                <p className="text-muted-foreground text-sm">
                  {current.role}
                  <span className="text-foreground/20 mx-2">/</span>
                  <span className="transition-colors duration-300 group-hover:text-foreground">
                    {current.company}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            {testimonials.map((_, index) => (
              <button
                key={testimonials[index].id}
                type="button"
                onClick={() => handleChange(index)}
                className="group relative py-4"
                aria-label={`Go to testimonial ${index + 1}`}
              >
                <span
                  className={`block h-px transition-all duration-500 ease-out ${
                    index === active
                      ? "w-12 bg-foreground"
                      : "w-6 bg-foreground/20 group-hover:w-8 group-hover:bg-foreground/40"
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-muted-foreground text-xs uppercase tracking-widest">
            {String(active + 1).padStart(2, "0")} /{" "}
            {String(testimonials.length).padStart(2, "0")}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            className="rounded-full p-2 text-foreground/40 transition-all duration-300 hover:bg-foreground/5 hover:text-foreground"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-full p-2 text-foreground/40 transition-all duration-300 hover:bg-foreground/5 hover:text-foreground"
            aria-label="Next testimonial"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
