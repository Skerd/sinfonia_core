"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { BarChart3, Users, TrendingUp } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@coreModule/components/uiKit/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@coreModule/components/lib/utils";
import Image from "next/image";
import { Badge } from "@coreModule/components/uiKit/ui/badge";

type FeatureItem = {
  icon: React.ElementType;
  title: string;
  description: string;
};

const features: FeatureItem[] = [
  {
    icon: BarChart3,
    title: "Task Tracking",
    description:
      "Monitor your project tasks and milestones across multiple projects — all updated in real-time.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Manage team members, assign tasks, and coordinate workflows seamlessly from a single, unified dashboard.",
  },
  {
    icon: TrendingUp,
    title: "Performance Analytics",
    description:
      "Visualize real-time progress and performance of your projects with clear metrics and easy-to-read insights.",
  },
];

const images = [
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0",
];

export default function FeatureSectionEleven() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const progressNodes = useRef<(HTMLDivElement | null)[]>([]);
  const autoplay = React.useRef(Autoplay({ delay: 8000 }));

  // Initialize progress nodes array
  useEffect(() => {
    progressNodes.current = progressNodes.current.slice(0, features.length);
  }, []);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Use autoplay progress for each pagination card
  const { showAutoplayProgress, resetProgress, restartProgress } =
    useAutoplayProgress(api, progressNodes, current);

  const scrollTo = (index: number) => {
    if (!api) return;

    // Reset progress bar before scrolling
    resetProgress();

    // Scroll to the selected index
    api.scrollTo(index);

    // Restart progress after a short delay to ensure the slide has changed
    setTimeout(() => {
      const autoplay = api.plugins()?.autoplay;
      if (autoplay) {
        // Reset autoplay timer
        autoplay.reset();
        const timeUntilNext = autoplay.timeUntilNext();
        if (timeUntilNext !== null && timeUntilNext > 0) {
          restartProgress(timeUntilNext, index);
        }
      }
    }, 100);
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-4">
          <Badge variant="outline" className="gap-2">
            <span className="block size-2 rounded-full bg-green-500"></span>{" "}
            Real-Time Project Overview
          </Badge>
          <h3 className="text-3xl leading-tight font-bold md:text-4xl">
            Stay in control of Your Projects
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="relative lg:col-span-2">
            <Carousel
              setApi={setApi}
              plugins={[autoplay.current]}
              className="w-full"
              opts={{
                align: "start",
                loop: true,
              }}
            >
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem key={index} className="basis-full p-0">
                    <div className="bg-muted relative aspect-video w-full overflow-hidden">
                      <Image
                        src={image}
                        alt={`Project dashboard ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Right Panel - Features List */}
          <div className="flex flex-col divide-y lg:col-span-1">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = current === index;

              return (
                <React.Fragment key={index}>
                  <div
                    className="relative cursor-pointer p-4 py-6"
                    onClick={() => scrollTo(index)}
                  >
                    <div className="relative z-10 flex items-start gap-4">
                      <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full border">
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <h4 className="text-foreground text-lg font-medium">
                          {feature.title}
                        </h4>
                        <p className="text-muted-foreground text-sm/relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                    <div className="absolute inset-0 w-full overflow-hidden">
                      <div
                        ref={(el) => {
                          progressNodes.current[index] = el;
                        }}
                        className={cn(
                          "embla__progress__bar bg-muted z-0 h-full",
                          !(isActive && showAutoplayProgress) && "opacity-0",
                        )}
                      />
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function useAutoplayProgress(
  emblaApi: CarouselApi | undefined,
  progressNodes: React.MutableRefObject<(HTMLDivElement | null)[]>,
  current: number,
) {
  const [showAutoplayProgress, setShowAutoplayProgress] = useState(false);
  const animationName = useRef("");
  const timeoutId = useRef<NodeJS.Timeout | undefined>(undefined);
  const rafId = useRef<number | undefined>(undefined);
  const currentRef = useRef(current);

  // Update current ref when current changes
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  // Reset all progress bars
  const resetAllProgress = useCallback(() => {
    progressNodes.current.forEach((node) => {
      if (node) {
        node.style.animationName = "none";
        node.style.transform = "translate3d(0,0,0)";
      }
    });
  }, [progressNodes]);

  const startProgress = useCallback(
    (timeUntilNext: number | null, targetIndex?: number) => {
      const index =
        targetIndex !== undefined ? targetIndex : currentRef.current;
      const node = progressNodes.current[index];
      if (!node) return;
      if (timeUntilNext === null || timeUntilNext <= 0) return;

      if (!animationName.current) {
        const style = window.getComputedStyle(node);
        animationName.current = style.animationName;
      }

      // Clear any existing timeouts and animations
      if (timeoutId.current) clearTimeout(timeoutId.current);
      if (rafId.current) cancelAnimationFrame(rafId.current);

      // Reset the node first
      node.style.animationName = "none";
      node.style.transform = "translate3d(0,0,0)";

      // Force reflow
      void node.offsetHeight;

      // Start animation in next frame
      rafId.current = window.requestAnimationFrame(() => {
        timeoutId.current = setTimeout(() => {
          const currentNode = progressNodes.current[index];
          if (currentNode && index === currentRef.current) {
            currentNode.style.animationName = animationName.current;
            currentNode.style.animationDuration = `${timeUntilNext}ms`;
            setShowAutoplayProgress(true);
          }
        }, 0);
      });
    },
    [progressNodes],
  );

  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = emblaApi.plugins()?.autoplay;
    if (!autoplay) return;

    const handleTimerset = () => {
      const timeUntilNext = autoplay.timeUntilNext();
      const selectedIndex = emblaApi.selectedScrollSnap();
      startProgress(timeUntilNext, selectedIndex);
    };

    const handleTimerStopped = () => {
      setShowAutoplayProgress(false);
      resetAllProgress();
    };

    const handlePlay = () => {
      const timeUntilNext = autoplay.timeUntilNext();
      const selectedIndex = emblaApi.selectedScrollSnap();
      startProgress(timeUntilNext, selectedIndex);
    };

    const handleSelect = () => {
      // Reset all progress bars when slide changes
      resetAllProgress();
      setShowAutoplayProgress(false);

      // Start progress for new slide
      const timeUntilNext = autoplay.timeUntilNext();
      const selectedIndex = emblaApi.selectedScrollSnap();
      if (timeUntilNext !== null && timeUntilNext > 0) {
        setTimeout(() => {
          startProgress(timeUntilNext, selectedIndex);
        }, 50);
      }
    };

    emblaApi.on("autoplay:timerset", handleTimerset);
    emblaApi.on("autoplay:timerstopped", handleTimerStopped);
    emblaApi.on("autoplay:play", handlePlay);
    emblaApi.on("select", handleSelect);

    // Initialize progress on mount
    const timeUntilNext = autoplay.timeUntilNext();
    const selectedIndex = emblaApi.selectedScrollSnap();
    if (timeUntilNext !== null && timeUntilNext > 0) {
      setTimeout(() => {
        startProgress(timeUntilNext, selectedIndex);
      }, 100);
    }

    return () => {
      emblaApi.off("autoplay:timerset", handleTimerset);
      emblaApi.off("autoplay:timerstopped", handleTimerStopped);
      emblaApi.off("autoplay:play", handlePlay);
      emblaApi.off("select", handleSelect);
    };
  }, [emblaApi, startProgress, resetAllProgress]);

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, []);

  const resetProgress = useCallback(() => {
    resetAllProgress();
    setShowAutoplayProgress(false);
    if (timeoutId.current) clearTimeout(timeoutId.current);
    if (rafId.current) cancelAnimationFrame(rafId.current);
  }, [resetAllProgress]);

  const restartProgress = useCallback(
    (timeUntilNext: number | null, targetIndex: number) => {
      startProgress(timeUntilNext, targetIndex);
    },
    [startProgress],
  );

  return {
    showAutoplayProgress,
    resetProgress,
    restartProgress,
  };
}
