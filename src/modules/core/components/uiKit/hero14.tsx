"use client";

import React from "react";
import { useMotionValue, animate, motion } from "motion/react";
import useMeasure from "react-use-measure";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@coreModule/components/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";

export type InfiniteSliderProps = {
  children: React.ReactNode;
  gap?: number;
  speed?: number;
  speedOnHover?: number;
  direction?: "horizontal" | "vertical";
  reverse?: boolean;
  className?: string;
};

export function MarqueeEffect({
  children,
  gap = 16,
  speed = 100,
  speedOnHover,
  direction = "horizontal",
  reverse = false,
  className,
}: InfiniteSliderProps) {
  const [currentSpeed, setCurrentSpeed] = React.useState(speed);
  const [ref, { width, height }] = useMeasure();
  const translation = useMotionValue(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [key, setKey] = React.useState(0);

  React.useEffect(() => {
    let controls;
    const size = direction === "horizontal" ? width : height;
    const contentSize = size + gap;
    const from = reverse ? -contentSize / 2 : 0;
    const to = reverse ? 0 : -contentSize / 2;

    const distanceToTravel = Math.abs(to - from);
    const duration = distanceToTravel / currentSpeed;

    if (isTransitioning) {
      const remainingDistance = Math.abs(translation.get() - to);
      const transitionDuration = remainingDistance / currentSpeed;

      controls = animate(translation, [translation.get(), to], {
        ease: "linear",
        duration: transitionDuration,
        onComplete: () => {
          setIsTransitioning(false);
          setKey((prevKey) => prevKey + 1);
        },
      });
    } else {
      controls = animate(translation, [from, to], {
        ease: "linear",
        duration,
        repeat: Infinity,
        repeatType: "loop",
        repeatDelay: 0,
        onRepeat: () => {
          translation.set(from);
        },
      });
    }

    return controls?.stop;
  }, [
    key,
    translation,
    currentSpeed,
    width,
    height,
    gap,
    isTransitioning,
    direction,
    reverse,
  ]);

  const hoverProps = speedOnHover
    ? {
        onHoverStart: () => {
          setIsTransitioning(true);
          setCurrentSpeed(speedOnHover);
        },
        onHoverEnd: () => {
          setIsTransitioning(true);
          setCurrentSpeed(speed);
        },
      }
    : {};

  return (
    <div className={cn("overflow-hidden", className)}>
      <motion.div
        className={cn("flex", { "w-max": direction !== "vertical" })}
        style={{
          ...(direction === "horizontal"
            ? { x: translation }
            : { y: translation }),
          gap: `${gap}px`,
          flexDirection: direction === "horizontal" ? "row" : "column",
        }}
        ref={ref}
        {...hoverProps}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}

const images = [
  {
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
  },
  {
    image:
      "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=800&q=80",
  },
  {
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
  },
  {
    image:
      "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=800&q=80",
  },
  {
    image:
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=800&q=80",
  },
  {
    image:
      "https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=800&q=80",
  },
  {
    image:
      "https://images.unsplash.com/photo-1528701800489-20be3c30c1d5?auto=format&fit=crop&w=800&q=80",
  },
  {
    image:
      "https://images.unsplash.com/photo-1519741347686-2752c35adf94?auto=format&fit=crop&w=800&q=80",
  },
  {
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
  },
  {
    image:
      "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=800&q=80",
  },
];

export default function HeroSection() {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid items-center lg:grid-cols-2">
          <header className="relative z-10 mx-auto mb-8 max-w-xl text-center lg:mb-10 lg:text-start">
            <Link href="#" className="inline-flex">
              <Badge
                variant="secondary"
                className="mb-4 rounded-full px-3 py-1 text-xs font-medium"
              >
                New arrivals ready to shop
              </Badge>
            </Link>
            <h3 className="font-bold mb-4 text-4xl text-balance md:text-5xl leading-tight">
              Discover products you will love
            </h3>
            <p className="text-muted-foreground text-balance lg:text-lg">
              Explore curated collections with fast delivery, easy returns, and
              prices that feel friendly. Find your next favorite item in a few
              clicks.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row sm:items-stretch lg:justify-start">
              <div className="flex gap-3">
                <Button size="lg" className="flex-1">
                  Browse products
                  <ArrowRightIcon />
                </Button>
                <Button size="lg" variant="outline" className="flex-1">
                  Explore collections
                </Button>
              </div>
            </div>
            <div className="mt-10 flex items-center justify-center gap-3 lg:justify-start">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <Avatar key={i} className="border-background border-2">
                    <AvatarImage
                      src={`https://i.pravatar.cc/80?img=${i + 20}`}
                      alt="Customer avatar"
                    />
                    <AvatarFallback>C{i}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="text-left text-xs sm:text-sm">
                <p className="font-semibold">More than 25,000 orders shipped</p>
                <p className="text-muted-foreground">
                  Shoppers are checking out right now
                </p>
              </div>
            </div>
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
                {images.slice(i * 3, (i + 1) * 3).map((image, idx) => (
                  <figure key={idx}>
                    <img
                      src={image.image}
                      className="aspect-square object-cover"
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
