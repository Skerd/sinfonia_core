"use client";

import { MarqueeEffect } from "@coreModule/components/uiKit/marquee-effect";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";

const images = [
  "https://images.unsplash.com/photo-1502389614483-e475fc34407e?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=500&auto=format&fit=crop",
];

export default function PromoSection() {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid items-center lg:grid-cols-2">
          <header className="relative z-10 mx-auto mb-8 max-w-xl text-center lg:mb-10 lg:text-start">
            <h3 className="mb-4 text-4xl font-bold text-balance md:text-5xl leading-tight">
              Summer styles are finally here
            </h3>
            <p className="text-muted-foreground text-balance lg:text-lg">
              This year, our new summer collection will shelter you from the
              harsh elements of a world that doesn&lsquo;t care if you live or
              die.
            </p>
            <Button size="lg" className="mt-6">
              Shop Collection
              <ArrowRightIcon />
            </Button>
          </header>
          <div className="absolute grid h-96 grid-cols-2 gap-4 overflow-hidden mask-t-from-80% mask-r-from-10% mask-b-from-80% mask-l-from-10% lg:static lg:h-150 lg:mask-r-from-70% lg:mask-l-from-70%">
            {[
              {
                reverse: false,
              },
              {
                reverse: true,
              },
            ].map((mq, i) => (
              <MarqueeEffect
                key={i}
                gap={12}
                direction="vertical"
                reverse={mq.reverse}
                speed={30}
                speedOnHover={1}
              >
                {images.slice(i * 3, (i + 1) * 3).map((image, i) => (
                  <figure key={i}>
                    <Image
                      src={image}
                      className="aspect-square object-cover"
                      alt="..."
                      width={400}
                      height={400}
                    />
                  </figure>
                ))}
              </MarqueeEffect>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
