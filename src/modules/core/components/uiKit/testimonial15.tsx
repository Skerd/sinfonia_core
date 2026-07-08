"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    quote:
      "I can't recommend Credenza enough! Their lending solutions have made it easier for us to manage customer applications and approvals, resulting in faster turnaround times and happier clients.",
    name: "William Ashford",
    position: "Co-Founder, Asterisk Inc",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  {
    quote:
      "Exceptional service from start to finish. The team understood our needs and delivered a solution that exceeded our expectations.",
    name: "Sarah Chen",
    position: "CEO, TechFlow",
    avatar: "https://i.pravatar.cc/150?img=5",
  },
  {
    quote:
      "A game-changer for our operations. We've seen measurable improvements in efficiency and client satisfaction since we started working with them.",
    name: "Marcus Webb",
    position: "Operations Director, NexGen",
    avatar: "https://i.pravatar.cc/150?img=33",
  },
] as const;

export default function TestimonialsTwoColumn() {
  const [active, setActive] = useState(0);
  const current = testimonials[active];

  const goPrev = () =>
    setActive((i) => (i === 0 ? testimonials.length - 1 : i - 1));
  const goNext = () =>
    setActive((i) => (i === testimonials.length - 1 ? 0 : i + 1));

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-3xl leading-tight font-bold">
              What Our Clients Are Saying
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We take pride in delivering exceptional solutions that deliver
              great results. But don&apos;t just take our word for it.
            </p>
            <Button variant="outline">
              View All Testimonials
              <ChevronRight />
            </Button>
          </div>

          <div className="relative">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <blockquote className="md:text-xl/relaxed">
                  &ldquo;{current.quote}&rdquo;
                </blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={current.avatar} alt={current.name} />
                    <AvatarFallback>{current.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{current.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {current.position}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="mt-8 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={goPrev}
                aria-label="Previous testimonial"
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={goNext}
                aria-label="Next testimonial"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
