"use client";

import { useState, useEffect } from "react";
import { Heart, Expand as Expand2, ShoppingCart, Star } from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import { Badge } from "@coreModule/components/uiKit/ui/badge";

const product = {
  discount: "50% Off",
  image:
    "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=500",
  alt: "AerOline Pro Chair - Jet Black with Amber Stitch",
  brand: "AerOline Pro Chair",
  title: "Jet Black with Amber Stitch",
  rating: 4.9,
  currentPrice: 280.0,
  originalPrice: 560.0,
  timeLeft: {
    days: 2,
    hours: 12,
    minutes: 48,
    seconds: 10,
  },
};

export default function ProductCard() {
  const {
    discount,
    image,
    alt,
    brand,
    title,
    rating,
    currentPrice,
    originalPrice,
    timeLeft,
  } = product;

  const [time, setTime] = useState(timeLeft);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prevTime) => {
        let { days, hours, minutes, seconds } = prevTime;

        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
          if (minutes < 0) {
            minutes = 59;
            hours--;
            if (hours < 0) {
              hours = 23;
              days--;
            }
          }
        }

        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="w-full max-w-80 overflow-hidden pt-0 shadow-none">
      <div className="relative">
        {discount && (
          <Badge className="absolute top-3 left-3 z-10 rounded-full bg-amber-700 dark:bg-amber-400">
            {discount}
          </Badge>
        )}

        <div className="absolute top-3 right-3 z-10 flex flex-col gap-3">
          <Button
            size="icon-sm"
            variant="secondary"
            className="bg-background hover:bg-secondary size-10 rounded-full"
            onClick={() => setIsFavorite(!isFavorite)}
            aria-label="Add to favorites"
          >
            <Heart
              fill={isFavorite ? "currentColor" : "none"}
              stroke={isFavorite ? "currentColor" : "currentColor"}
            />
          </Button>
          <Button
            size="icon-sm"
            variant="secondary"
            className="bg-background hover:bg-secondary size-10 rounded-full"
            aria-label="Expand view"
          >
            <Expand2 />
          </Button>
          <Button
            size="icon-sm"
            variant="secondary"
            className="bg-background hover:bg-secondary size-10 rounded-full"
            aria-label="Add to cart"
          >
            <ShoppingCart />
          </Button>
        </div>

        <figure>
          <img
            src={image}
            alt={alt}
            className="aspect-4/3 w-full object-cover"
          />
        </figure>
      </div>

      <CardContent>
        <div className="relative z-10 -mt-12 mb-6 rounded-xl bg-amber-400 p-4 dark:bg-amber-700">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-foreground text-2xl font-bold tabular-nums">
                {String(time.days).padStart(2, "0")}
              </div>
              <div className="text-foreground/70 text-xs font-medium md:text-sm">
                Days
              </div>
            </div>
            <div>
              <div className="text-foreground text-2xl font-bold tabular-nums">
                {String(time.hours).padStart(2, "0")}
              </div>
              <div className="text-foreground/70 text-xs font-medium md:text-sm">
                Hours
              </div>
            </div>
            <div>
              <div className="text-foreground text-2xl font-bold tabular-nums">
                {String(time.minutes).padStart(2, "0")}
              </div>
              <div className="text-foreground/70 text-xs font-medium md:text-sm">
                Mins
              </div>
            </div>
            <div>
              <div className="text-foreground text-2xl font-bold tabular-nums">
                {String(time.seconds).padStart(2, "0")}
              </div>
              <div className="text-foreground/70 text-xs font-medium md:text-sm">
                Sec
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">{brand}</p>
            <div className="flex shrink-0 items-center gap-1">
              <Star className="size-4 fill-amber-400 stroke-amber-400" />
              <span className="text-xs">{rating}</span>
            </div>
          </div>

          <h5 className="text-foreground text-base font-bold md:text-lg">
            {title}
          </h5>

          <div className="flex items-end gap-1">
            <span className="text-foreground text-lg font-medium">
              ${currentPrice.toFixed(2)}
            </span>
            <span className="text-muted-foreground mb-0.5 text-sm line-through">
              ${originalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
