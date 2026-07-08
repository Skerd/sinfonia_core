"use client";

import { useState } from "react";
import { Badge } from "@coreModule/components/uiKit/ui/badge";

const testimonials = [
  {
    quote:
      "From concept to delivery, the collaboration was seamless. The design direction was exactly what we needed to stand out in a crowded market.",
    name: "Sarah Mitchell",
    role: "Marketing Director, Atlas Inc",
    image: "https://i.pravatar.cc/100?img=20",
  },
  {
    quote:
      "Working with Hayden was a game-changer for our brand. The new identity he created not only looks fantastic but also resonates deeply with our audience. We've seen a significant increase in engagement since the redesign!",
    name: "Christopher",
    role: "CEO at Hungrycorp",
    image: "https://i.pravatar.cc/100?img=12",
  },
  {
    quote:
      "Professional, creative, and incredibly responsive. The rebrand exceeded our expectations and our customers have noticed the difference.",
    name: "James Chen",
    role: "Founder, Nova Labs",
    image: "https://i.pravatar.cc/100?img=33",
  },
] as const;

export default function TestimonialsSpeechBubble() {
  const [active, setActive] = useState(1);
  const current = testimonials[active];

  return (
    <section className="bg-muted/50 py-16">
      <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
        <Badge
          variant="outline"
          className="bg-background text-muted-foreground px-3 py-1.5 text-[11px] font-medium tracking-wider uppercase"
        >
          Testimonials
        </Badge>

        <h2 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">
          What Clients Are Saying
        </h2>
        <p className="text-muted-foreground mt-3 text-base leading-relaxed md:text-lg">
          Read what they have to say about our collaborations and how my design
          solutions have helped them connect with their audiences
        </p>

        <div className="mt-12 flex items-center justify-center gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="relative">
              <button
                type="button"
                onClick={() => setActive(i)}
                className="relative rounded-full transition-transform focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                aria-label={`View testimonial by ${t.name}`}
                aria-current={active === i ? "true" : undefined}
              >
                <img
                  src={t.image}
                  alt=""
                  width={72}
                  height={72}
                  className={`rounded-full object-cover transition-all ${
                    active === i
                      ? "size-16 ring-2 ring-gray-800 ring-offset-2 md:size-20 md:ring-[3px] md:ring-offset-[3px]"
                      : "size-14 grayscale md:size-16"
                  }`}
                  style={
                    active === i
                      ? { boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }
                      : undefined
                  }
                />
              </button>
              {active === i && (
                <div
                  className="border-b-background absolute -bottom-3 left-1/2 z-10 -translate-x-1/2 border-12 border-transparent"
                  style={{
                    filter: "drop-shadow(0 -2px 2px rgba(0,0,0,0.06))",
                  }}
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>

        {/* Testimonial card with speech-bubble tail */}
        <div
          className="bg-background relative mx-auto mt-3 max-w-2xl rounded-lg px-6 py-8 text-left md:px-10 md:py-10 shadow-lg"
        >
          <blockquote className="text-base leading-relaxed md:text-lg">
            &ldquo;{current.quote}&rdquo;
          </blockquote>
          <p className="text-muted-foreground mt-5 text-sm md:text-base">
            {current.name}, {current.role}
          </p>
        </div>
      </div>
    </section>
  );
}
