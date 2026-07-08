"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@coreModule/components/uiKit/ui/carousel";
import { Separator } from "@coreModule/components/uiKit/ui/separator";

const products = [
  {
    id: "1",
    category: "Clothing",
    name: "Men's Solid Slim Fit Cotton Casual Shirt",
    price: 70,
    originalPrice: 100,
    image:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80",
  },
  {
    id: "2",
    category: "Nail Polishes",
    name: "Debelle Metallic Gel Nail Lacquer",
    price: 80,
    originalPrice: 100,
    image:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80",
  },
  {
    id: "3",
    category: "Ceramic",
    name: "Where Elegance Meets Functionality",
    price: 150,
    originalPrice: 200,
    image:
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&q=80",
  },
  {
    id: "4",
    category: "Furniture",
    name: "Lunaluxe Velvet Executive Chair",
    price: 500,
    originalPrice: 550,
    image:
      "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&q=80",
  },
  {
    id: "5",
    category: "Clothing",
    name: "Colorful T-Shirts Casual Comfortable Wear",
    price: 50,
    originalPrice: 70,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
  },
  {
    id: "6",
    category: "Nail Polishes",
    name: "Bella Voste Sugar Baby Nail Paints",
    price: 50,
    originalPrice: 70,
    image:
      "https://images.unsplash.com/photo-1631214524028-2bc8dfdee1e3?w=400&q=80",
  },
  {
    id: "7",
    category: "Clothing",
    name: "Classic Denim Jacket",
    price: 89,
    originalPrice: 120,
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80",
  },
  {
    id: "8",
    category: "Furniture",
    name: "Minimal Oak Side Table",
    price: 180,
    originalPrice: 220,
    image:
      "https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=400&q=80",
  },
  {
    id: "9",
    category: "Ceramic",
    name: "Handcrafted Stoneware Mug",
    price: 35,
    originalPrice: 45,
    image:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80",
  },
  {
    id: "10",
    category: "Nail Polishes",
    name: "Glossy Finish Top Coat",
    price: 25,
    originalPrice: 35,
    image:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80",
  },
  {
    id: "11",
    category: "Clothing",
    name: "Wool Blend Winter Scarf",
    price: 45,
    originalPrice: 65,
    image:
      "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&q=80",
  },
  {
    id: "12",
    category: "Furniture",
    name: "Industrial Pendant Lamp",
    price: 120,
    originalPrice: 150,
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80",
  },
];

export default function ProductListEight() {
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
    <section className="w-full px-4 py-14">
      <div className="mx-auto max-w-6xl space-y-6 px-4">
        <header className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold md:text-3xl">
            New Arrival In Fashion
          </h2>
          <Button variant="link" className="shrink-0 p-0" asChild>
            <Link href="#">View all</Link>
          </Button>
        </header>

        <Separator />

        <Carousel
          setApi={setApi}
          opts={{ align: "start", containScroll: "trimSnaps" }}
          className="w-full"
        >
          <CarouselContent>
            {products.map((product) => (
              <CarouselItem
                key={product.id}
                className="basis-2/3 pl-4 lg:basis-1/3"
              >
                <Card className="overflow-hidden rounded-lg border py-0 shadow-sm">
                  <CardContent className="flex p-0">
                    <div className="bg-muted relative h-32 w-28 shrink-0 overflow-hidden sm:h-36 sm:w-32">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 p-4">
                      <p className="text-muted-foreground text-xs tracking-wide uppercase">
                        {product.category}
                      </p>
                      <p className="text-foreground line-clamp-2 leading-tight font-semibold">
                        {product.name}
                      </p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-bold">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground text-sm line-through">
                          ${product.originalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="flex justify-center gap-1 pt-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => api?.scrollPrev()}
              disabled={!canScrollPrev}
              aria-label="Previous"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => api?.scrollNext()}
              disabled={!canScrollNext}
              aria-label="Next"
            >
              <ChevronRight />
            </Button>
          </div>
        </Carousel>
      </div>
    </section>
  );
}
