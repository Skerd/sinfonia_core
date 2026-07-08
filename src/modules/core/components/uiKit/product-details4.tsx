"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronDown, ShoppingBag } from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@coreModule/components/uiKit/ui/carousel";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@coreModule/components/uiKit/ui/collapsible";
import { cn } from "@coreModule/components/lib/utils";
import { Badge } from "@coreModule/components/uiKit/ui/badge";

const product = {
  category: "PERFUME",
  name: "Ashes of Moonlight",
  price: "$139.00",
  intro:
    "Step into the world of Parfs, where each bottle unveils a tale of bold elegance and understated strength designed for those who command presence without a word.",
  volumes: ["100 ml", "70 ml", "50 ml"] as const,
  characteristics: [
    { label: "Brand", value: "PARFS" },
    { label: "Collection", value: "2022" },
    { label: "Item no", value: "04681745" },
  ],
  description: [
    "A fragrance that captures the quiet power of moonlight on ash—smoky, luminous, and unforgettable. Blended with rare oud, iris, and musk, it leaves a lasting impression.",
    "Designed for those who prefer subtle statement over loud declaration. Eau de Parfum concentration for lasting wear. 100 ml | 4 oz.",
  ],
  images: [
    "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=800&q=80",
    "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80",
    "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&q=80",
    "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80",
    "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80",
    "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&q=80",
    "https://images.unsplash.com/photo-1619994121345-228e1f2957b3?w=800&q=80",
  ],
};

export default function ProductDetail() {
  const [api, setApi] = useState<CarouselApi>();
  const [thumbApi, setThumbApi] = useState<CarouselApi>();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVolume, setSelectedVolume] =
    useState<(typeof product.volumes)[number]>("100 ml");
  const [openSections, setOpenSections] = useState({
    characteristics: true,
    description: true,
    payment: false,
    returns: false,
  });

  useEffect(() => {
    if (!api) return;
    setSelectedImage(api.selectedScrollSnap());
    api.on("select", () => setSelectedImage(api.selectedScrollSnap()));
  }, [api]);

  useEffect(() => {
    thumbApi?.scrollTo(selectedImage);
  }, [selectedImage, thumbApi]);

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-8">
        <div className="space-y-4">
          <Carousel setApi={setApi} className="w-full">
            <CarouselContent>
              {product.images.map((src, i) => (
                <CarouselItem key={i}>
                  <div className="bg-muted relative aspect-4/5 w-full overflow-hidden rounded-lg">
                    <Image
                      src={src}
                      alt={`${product.name} ${i + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
          <Carousel
            setApi={setThumbApi}
            opts={{ align: "start", containScroll: "trimSnaps" }}
            className="w-full"
          >
            <CarouselContent>
              {product.images.map((src, i) => (
                <CarouselItem key={i} className="basis-1/5">
                  <button
                    type="button"
                    onClick={() => api?.scrollTo(i)}
                    className={cn(
                      "relative aspect-square w-full overflow-hidden rounded-md border transition-opacity hover:opacity-90",
                      selectedImage === i
                        ? "ring-primary ring-2"
                        : "border-transparent",
                    )}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        <div className="flex flex-col space-y-4">
          <Badge variant="outline">{product.category}</Badge>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {product.name}
          </h1>
          <p className="text-lg">{product.price}</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {product.intro}
          </p>

          <div>
            <p className="text-foreground mb-2 text-xs font-medium tracking-wider uppercase">
              Volume:
            </p>
            <div className="flex gap-6">
              {product.volumes.map((vol) => (
                <button
                  key={vol}
                  type="button"
                  onClick={() => setSelectedVolume(vol)}
                  className={cn(
                    "hover:text-foreground text-sm font-medium transition-colors",
                    selectedVolume === vol
                      ? "text-foreground border-foreground border-b-2"
                      : "text-muted-foreground",
                  )}
                >
                  {vol}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Button size="lg" className="w-full sm:w-auto">
              <ShoppingBag />
              Add to Bag
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Buy Now
            </Button>
          </div>

          <div className="mt-10 border-t pt-6">
            <Collapsible
              open={openSections.characteristics}
              onOpenChange={() => toggleSection("characteristics")}
            >
              <CollapsibleTrigger className="text-foreground flex w-full items-center justify-between py-3 text-xs font-medium tracking-wider uppercase">
                Characteristics
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    openSections.characteristics && "rotate-180",
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <dl className="space-y-2 py-2">
                  {product.characteristics.map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible
              open={openSections.description}
              onOpenChange={() => toggleSection("description")}
            >
              <CollapsibleTrigger className="text-foreground flex w-full items-center justify-between border-t py-3 text-xs font-medium tracking-wider uppercase">
                Description
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    openSections.description && "rotate-180",
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="text-muted-foreground space-y-3 border-t py-3 text-sm leading-relaxed">
                  {product.description.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible
              open={openSections.payment}
              onOpenChange={() => toggleSection("payment")}
            >
              <CollapsibleTrigger className="text-foreground flex w-full items-center justify-between border-t py-3 text-xs font-medium tracking-wider uppercase">
                Payment & Delivery
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    openSections.payment && "rotate-180",
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="text-muted-foreground border-t py-3 text-sm">
                  Free standard shipping on orders over $50. Express options
                  available at checkout. We accept major cards and PayPal.
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible
              open={openSections.returns}
              onOpenChange={() => toggleSection("returns")}
            >
              <CollapsibleTrigger className="text-foreground flex w-full items-center justify-between border-t py-3 text-xs font-medium tracking-wider uppercase">
                Returns
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    openSections.returns && "rotate-180",
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="text-muted-foreground border-t py-3 text-sm">
                  30-day return policy. Unopened items in original packaging can
                  be returned for a full refund.
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
}
