"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@coreModule/components/uiKit/ui/carousel";
import { Card } from "@coreModule/components/uiKit/ui/card";

const categories = [
  {
    name: "Cosmetic",
    count: 9,
    href: "#",
    imageSrc:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&q=80",
    imageAlt: "Cosmetic category",
  },
  {
    name: "Ceramic",
    count: 7,
    href: "#",
    imageSrc:
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=200&q=80",
    imageAlt: "Ceramic category",
  },
  {
    name: "Fashion",
    count: 11,
    href: "#",
    imageSrc:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&q=80",
    imageAlt: "Fashion category",
  },
  {
    name: "Jewellery",
    count: 8,
    href: "#",
    imageSrc:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&q=80",
    imageAlt: "Jewellery category",
  },
  {
    name: "Kitchen",
    count: 3,
    href: "#",
    imageSrc:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&q=80",
    imageAlt: "Kitchen category",
  },
  {
    name: "Grocery",
    count: 8,
    href: "#",
    imageSrc:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80",
    imageAlt: "Grocery category",
  },
] as const;

export default function ProductCategoryFeatured() {
  return (
    <section className="py-14 md:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold md:text-3xl">Featured Categories</h2>
          <Link
            href="#"
            className="text-muted-foreground text-sm underline-offset-4 hover:underline"
          >
            View All Collection
          </Link>
        </div>

        <Carousel
          opts={{
            align: "start",
            dragFree: true,
            containScroll: "trimSnaps",
          }}
        >
          <CarouselContent className="-ml-4">
            {categories.map((category) => (
              <CarouselItem
                key={category.name}
                className="min-w-0 basis-2/4 lg:basis-1/4"
              >
                <Card className="hover:border-primary/30 overflow-hidden py-0 shadow-none transition-colors">
                  <Link href={category.href} className="block">
                    <div className="flex items-center gap-4 p-4">
                      <div className="flex flex-1 flex-col">
                        <span className="font-semibold">{category.name}</span>
                        <span className="text-muted-foreground text-sm">
                          {category.count} items
                        </span>
                      </div>
                      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md md:h-20 md:w-24">
                        <Image
                          src={category.imageSrc}
                          alt={category.imageAlt}
                          width={96}
                          height={80}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      </div>
                    </div>
                  </Link>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-6 flex justify-center gap-2">
            <CarouselPrevious className="relative top-0 left-0 translate-x-0 translate-y-0" />
            <CarouselNext className="relative top-0 right-0 translate-x-0 translate-y-0" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
