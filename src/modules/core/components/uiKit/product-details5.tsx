"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Truck, Star, ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@coreModule/components/uiKit/ui/table";
import { cn } from "@coreModule/components/lib/utils";
import { Separator } from "@coreModule/components/uiKit/ui/separator";

const product = {
  breadcrumbs: [
    { label: "Home", href: "#" },
    { label: "Fragrance", href: "#" },
    { label: "Eau de Parfum", href: "#" },
    { label: "Midnight Noir" },
  ],
  name: "Midnight Noir",
  description:
    "A bold, sensual eau de parfum that opens with bergamot and black pepper, unfolds into rose and oud, and lingers with vanilla and musk. Long-lasting and unmistakably modern.",
  delivery: "Free delivery on orders over $75",
  installment: "Gift wrapping available",
  rating: 4.9,
  reviewCount: "1.2k",
  price: "$128.00",
  colors: [
    { name: "Black", value: "bg-zinc-900", selected: true },
    { name: "Gold", value: "bg-amber-400", selected: false },
    {
      name: "Silver",
      value: "bg-zinc-300 border border-zinc-400",
      selected: false,
    },
  ],
  details: [
    {
      key: "Top notes",
      value: ["Bergamot", "Black pepper", "Cardamom"],
    },
    {
      key: "Heart notes",
      value: ["Rose", "Oud", "Iris"],
    },
    {
      key: "Base notes",
      value: ["Vanilla", "Musk", "Sandalwood"],
    },
    { key: "Volume", value: "100 ml / 3.4 fl oz" },
    {
      key: "Longevity",
      value: "8–10 hours",
    },
  ],
  images: [
    "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200&q=80",
    "https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&q=80",
    "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=1200&q=80",
  ],
};

export default function ProductDetail() {
  const [selectedColor, setSelectedColor] = useState(0);

  return (
    <div className="py-10 sm:py-14">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-6">
          <Breadcrumb>
            <BreadcrumbList className="text-xs">
              {product.breadcrumbs.map((item, i) => (
                <span key={i} className="contents">
                  <BreadcrumbItem>
                    {item.href ? (
                      <BreadcrumbLink href={item.href}>
                        {item.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {i < product.breadcrumbs.length - 1 && (
                    <BreadcrumbSeparator>
                      <span className="text-muted-foreground">/</span>
                    </BreadcrumbSeparator>
                  )}
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          <h1 className="text-3xl lg:text-4xl font-bold">{product.name}</h1>

          <p className="text-muted-foreground max-w-xl text-sm">
            {product.description}
          </p>

          <div className="flex flex-wrap gap-6 text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Truck className="size-4" />
              {product.delivery}
            </span>
            <span className="text-muted-foreground flex items-center gap-2">
              {product.installment}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    "size-4",
                    i <= Math.floor(product.rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30",
                  )}
                />
              ))}
            </div>
            <span className="text-muted-foreground text-sm">
              ({product.rating})
            </span>
            <Link
              href="#reviews"
              className="text-muted-foreground hover:text-foreground flex items-center text-sm transition-colors"
            >
              {product.reviewCount} Reviews <ChevronRight className="size-3" />
            </Link>
          </div>

          <Separator />

          <div className="flex justify-between">
            <p className="text-2xl font-bold sm:text-3xl">{product.price}</p>

            <div className="flex items-center gap-3">
              <p className="text-muted-foreground text-sm">Color</p>
              <div className="flex gap-3">
                {product.colors.map((color, i) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(i)}
                    className={cn(
                      "focus-visible:ring-ring size-5 rounded-full transition-shadow focus-visible:ring-1 focus-visible:outline-none",
                      color.value,
                      selectedColor === i &&
                        "ring-foreground ring-2 ring-offset-2",
                    )}
                    aria-label={color.name}
                    aria-pressed={selectedColor === i}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="rounded-full">
              Add to cart
            </Button>
            <Button className="rounded-full">Buy Now</Button>
          </div>
        </div>

        <div className="border-t pt-6 lg:border-t-0 lg:pt-0 lg:pl-8">
          <h2 className="text-xl">Product Details</h2>
          <Table className="mt-4">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground h-auto py-3">
                  Spec
                </TableHead>
                <TableHead className="text-muted-foreground h-auto py-3">
                  Value
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.details.map((item) => (
                <TableRow key={item.key} className="border-border">
                  <TableCell className="text-muted-foreground py-3">
                    {item.key}
                  </TableCell>
                  <TableCell className="text-foreground py-3 text-sm whitespace-normal">
                    {Array.isArray(item.value) ? (
                      <ul className="space-y-0.5">
                        {item.value.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      item.value
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="mt-12 w-full">
        <Carousel
          opts={{ align: "start", loop: true }}
          className="relative w-full"
        >
          <CarouselContent className="ml-0">
            {product.images.map((src, i) => (
              <CarouselItem key={i} className="basis-full pl-0 md:basis-1/2">
                <div className="bg-muted relative aspect-16/10 w-full overflow-hidden md:pr-2">
                  <Image
                    src={src}
                    alt={`${product.name} view ${i + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious
            variant="secondary"
            className="top-1/2 left-2 -translate-y-1/2 border-0 bg-black/50 text-white hover:bg-black/70 hover:text-white"
          >
            <ArrowLeft />
            <span className="sr-only">Previous</span>
          </CarouselPrevious>
          <CarouselNext
            variant="secondary"
            className="top-1/2 right-2 -translate-y-1/2 border-0 bg-black/50 text-white hover:bg-black/70 hover:text-white md:right-4"
          >
            <ArrowRight />
            <span className="sr-only">Next</span>
          </CarouselNext>
        </Carousel>
      </div>
    </div>
  );
}
