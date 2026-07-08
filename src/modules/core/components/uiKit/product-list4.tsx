"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star, Zap } from "lucide-react";

import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@coreModule/components/uiKit/ui/carousel";

const products = [
  {
    id: "1",
    name: "Our Florist's Pick",
    category: "Letterbox Flowers",
    image:
      "https://images.unsplash.com/photo-1471899236350-e3016bf1e69e?q=80&w=600",
    price: 34,
    rating: 5,
    reviewCount: 18,
    tag: "British tulips",
  },
  {
    id: "2",
    name: "The Anna & Hug in a Biscuit",
    category: "Flowers & Gifts",
    image:
      "https://plus.unsplash.com/premium_photo-1677094766116-aa0f8742d36b?q=80&w=600",
    price: 31,
    rating: 5,
    reviewCount: 100,
    tag: null,
  },
  {
    id: "3",
    name: "The Yui",
    category: "Hand-tied flowers",
    image:
      "https://images.unsplash.com/photo-1496062031456-07b8f162a322?w=600&q=80",
    price: 37,
    rating: 5,
    reviewCount: 398,
    tag: null,
  },
  {
    id: "4",
    name: "The Dara",
    category: "Hand-tied flowers",
    image:
      "https://images.unsplash.com/photo-1717843756352-349bcde43545?q=80&w=600",
    price: 65,
    rating: 5,
    reviewCount: 279,
    tag: null,
  },
  {
    id: "5",
    name: "The Meadow",
    category: "Letterbox Flowers",
    image:
      "https://images.unsplash.com/photo-1753187998415-441599b2ebfb?q=80&w=600",
    price: 42,
    rating: 5,
    reviewCount: 156,
    tag: "Seasonal",
  },
  {
    id: "6",
    name: "The Blush",
    category: "Hand-tied flowers",
    image:
      "https://images.unsplash.com/photo-1753189198695-9cfa2b47e76b?q=80&w=600",
    price: 48,
    rating: 5,
    reviewCount: 224,
    tag: null,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${count} reviews`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className="size-4 fill-amber-400 text-amber-400"
          aria-hidden
        />
      ))}
      <span className="text-muted-foreground text-sm">({count})</span>
    </div>
  );
}

export default function ProductListFour() {
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <section className="w-full py-8 lg:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-3xl font-bold md:text-3xl">
              Give a gift to your loved one.
            </h2>
            <p className="text-muted-foreground">
              Rewards members earn double points on select items for a limited
              time.
            </p>
          </div>
          <Button variant="link" className="shrink-0 underline" asChild>
            <Link href="#">Shop now</Link>
          </Button>
        </header>

        <Carousel
          setApi={setApi}
          opts={{ align: "start", containScroll: "trimSnaps" }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {products.map((product) => (
              <CarouselItem key={product.id} className="basis-[280px] pl-4">
                <Card className="overflow-hidden border-0 bg-transparent shadow-none">
                  <CardContent className="flex flex-col gap-3 p-0">
                    <div className="bg-muted relative aspect-3/4 w-full overflow-hidden rounded-lg">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                        <Badge
                          variant="default"
                          className="gap-1 rounded-md px-2 py-1 text-xs font-medium"
                        >
                          <Zap className="size-3.5" />
                          Double Points
                        </Badge>
                        {product.tag && (
                          <Badge
                            variant="secondary"
                            className="w-fit rounded-full text-xs"
                          >
                            {product.tag}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-foreground leading-tight font-bold">
                        {product.name}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {product.category}
                      </p>
                      <StarRating count={product.reviewCount} />
                      <div className="mt-1 flex items-end justify-between gap-2">
                        <span className="text-foreground text-lg font-bold">
                          {`$${product.price}`}
                        </span>
                        <Button size="sm" variant="default">
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="mt-4 flex justify-end gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-md"
              onClick={() => api?.scrollPrev()}
              disabled={!canScrollPrev}
              aria-label="Scroll left"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-md"
              onClick={() => api?.scrollNext()}
              disabled={!canScrollNext}
              aria-label="Scroll right"
            >
              <ChevronRight />
            </Button>
          </div>
        </Carousel>
      </div>
    </section>
  );
}
