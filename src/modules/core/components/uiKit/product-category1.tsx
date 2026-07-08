"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@coreModule/components/uiKit/ui/breadcrumb";
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
    name: "Handbags",
    href: "#",
    imageSrc:
      "https://images.unsplash.com/photo-1594221708779-94832f4320d1?w=400&q=80",
    imageAlt: "Handbags category",
  },
  {
    name: "Jewellery",
    href: "#",
    imageSrc:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80",
    imageAlt: "Jewellery category",
  },
  {
    name: "GUCCI",
    href: "#",
    imageSrc:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    imageAlt: "GUCCI brand",
  },
  {
    name: "Fragrance",
    href: "#",
    imageSrc:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&q=80",
    imageAlt: "Fragrance category",
  },
  {
    name: "Lamps",
    href: "#",
    imageSrc:
      "https://images.unsplash.com/photo-1487070183336-b863922373d4?w=400&q=80",
    imageAlt: "Lamps category",
  },
] as const;

export default function ProductCategory() {
  return (
    <section className="py-14 md:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="#">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Collection</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Carousel
          opts={{
            align: "start",
            dragFree: true,
            containScroll: "trimSnaps",
          }}
        >
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold md:text-4xl">All Product</h1>
            <div className="flex gap-2">
              <CarouselPrevious className="relative top-0 left-0 translate-x-0 translate-y-0" />
              <CarouselNext className="relative top-0 right-0 translate-x-0 translate-y-0" />
            </div>
          </div>
          <CarouselContent>
            {categories.map((category) => (
              <CarouselItem
                key={category.name}
                className="min-w-0 basis-[calc((100%-3rem)/4)] pl-4"
              >
                <Card className="overflow-hidden rounded-none border-0 p-0 shadow-none">
                  <Link href={category.href} className="block">
                    <div className="aspect-3/4 overflow-hidden">
                      <Image
                        src={category.imageSrc}
                        alt={category.imageAlt}
                        width={240}
                        height={320}
                        className="h-full w-full rounded-lg object-cover"
                        unoptimized
                      />
                    </div>
                    <p className="p-4 text-center">{category.name}</p>
                  </Link>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
