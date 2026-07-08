"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@coreModule/components/uiKit/ui/carousel";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";

const cards = [
  { title: "Card 1", description: "Description for card 1" },
  { title: "Card 2", description: "Description for card 2" },
  { title: "Card 3", description: "Description for card 3" },
  { title: "Card 4", description: "Description for card 4" },
];

export default function CarouselComponent() {
  return (
    <Carousel className="w-full max-w-xs">
      <CarouselContent>
        {cards.map((card, index) => (
          <CarouselItem key={index}>
            <Card>
              <CardContent className="flex aspect-square items-center justify-center p-6">
                <div className="text-center">
                  <h3 className="mb-2 font-semibold">{card.title}</h3>
                  <p className="text-muted-foreground text-sm">{card.description}</p>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

