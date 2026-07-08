"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@coreModule/components/uiKit/ui/carousel";
import { Button } from "@coreModule/components/uiKit/ui/button";

const testimonials = [
  {
    quote:
      "This platform transformed how we work. The team delivered exactly what we needed and the results speak for themselves.",
    highlightedText: "exactly what we needed",
    authorName: "Alex Morgan",
    authorPosition: "Head of Product, TechFlow",
    authorImage: "https://i.pravatar.cc/100?img=14",
  },
  {
    quote:
      "Outstanding support and a truly robust product. We've seen remarkable improvements since we started using it.",
    highlightedText: "remarkable improvements",
    authorName: "Sarah Chen",
    authorPosition: "CEO, Tech Solutions",
    authorImage: "https://i.pravatar.cc/100?img=1",
  },
  {
    quote:
      "A game-changer for our team. The scalability and reliability are unmatched. Best decision we made this year.",
    highlightedText: "game-changer",
    authorName: "Michael Lee",
    authorPosition: "Lead Developer, Innovate Corp",
    authorImage: "https://i.pravatar.cc/100?img=2",
  },
];

export default function TestimonialCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback((api: CarouselApi) => {
    if (!api) return;
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;
    onSelect(api);
    const handler = () => onSelect(api);
    api.on("select", handler);
    return () => {
      api.off("select", handler);
    };
  }, [api, onSelect]);

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <Carousel
          opts={{ align: "start", loop: true }}
          setApi={setApi}
          className="w-full"
        >
          <CarouselContent>
            {testimonials.map((t, i) => {
              const formattedQuote = t.highlightedText
                ? t.quote.replace(
                    t.highlightedText,
                    `<strong class="font-semibold">${t.highlightedText}</strong>`,
                  )
                : t.quote;
              return (
                <CarouselItem key={i} className="basis-full pl-4 md:pl-6">
                  <div className="flex flex-col items-center text-center">
                    <p
                      className="text-foreground max-w-xl text-balance text-xl sm:text-2xl"
                      dangerouslySetInnerHTML={{
                        __html: `"${formattedQuote}"`,
                      }}
                    />
                    <p className="text-muted-foreground mt-5 font-medium">
                      {t.authorName}
                    </p>
                    <p className="text-foreground/40 mt-1.5 font-medium">
                      {t.authorPosition}
                    </p>
                    {t.authorImage && (
                      <img
                        src={t.authorImage}
                        alt=""
                        width={48}
                        height={48}
                        className="bg-muted mt-5 size-12 rounded-full object-cover"
                      />
                    )}
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          <div className="mt-8 flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <Button
                key={i}
                variant={selectedIndex === i ? "default" : "ghost"}
                size="icon"
                className="h-2 w-2 min-h-0 min-w-0 rounded-full p-0 md:h-2.5 md:w-2.5"
                onClick={() => api?.scrollTo(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                aria-current={selectedIndex === i ? "true" : undefined}
              />
            ))}
          </div>
        </Carousel>
      </div>
    </section>
  );
}
