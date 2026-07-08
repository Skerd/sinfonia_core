"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Minus, Plus, ShieldCheckIcon, Heart } from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Input } from "@coreModule/components/uiKit/ui/input";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@coreModule/components/uiKit/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@coreModule/components/uiKit/ui/tabs";
import { Progress } from "@coreModule/components/uiKit/ui/progress";
import { RadioGroup, RadioGroupItem } from "@coreModule/components/uiKit/ui/radio-group";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@coreModule/components/uiKit/ui/field";
import { cn } from "@coreModule/components/lib/utils";
import { ButtonGroup } from "@coreModule/components/uiKit/ui/button-group";

const product = {
  name: "Bio-Active Ceramide Moisturizer",
  slogan: "Visibly firms and smooths skin to reduce early signs of aging",
  rating: 4.7,
  reviewCount: 1634,
  price: 19,
  oldPrice: 29,
  description:
    "Formulated with bio-active ceramides, this moisturizer helps strengthen the skin barrier, improve elasticity, and deliver long-lasting hydration. Designed for daily use, it supports smoother, healthier-looking skin without feeling heavy or greasy.",
  keyBenefits:
    "Strengthens skin barrier, improves elasticity, long-lasting hydration, smooths skin texture, reduces early signs of aging.",
  keyIngredients:
    "Bio-active ceramides, hyaluronic acid, niacinamide, peptides, and nourishing botanical extracts.",
  howToUse:
    "Apply to clean skin morning and evening. Take a small amount and massage gently into face and neck until absorbed. Follow with SPF during the day.",
  images: [
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
    "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80",
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80",
    "https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=800&q=80",
    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80",
  ],
  seeItInAction: [
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80",
    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80",
    "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&q=80",
  ],
  youMightAlsoLike: [
    "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&q=80&auto=format&fit=crop",
  ],
  bundles: [
    { label: "Single Product", price: 19, save: null },
    { label: "Buy 2", price: 34.2, save: "Save 10%" },
    { label: "Buy 3", price: 45.6, save: "Save 20%" },
  ],
};

const ratingDistribution = [
  { stars: 5, percent: 65 },
  { stars: 4, percent: 15 },
  { stars: 3, percent: 7 },
  { stars: 2, percent: 8 },
  { stars: 1, percent: 5 },
];

export default function ProductDetail() {
  const [selectedBundle, setSelectedBundle] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const incrementQuantity = () => setQuantity((prev) => prev + 1);
  const decrementQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList className="text-sm">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="#">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <span className="text-muted-foreground">&gt;</span>
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="#">Product</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <span className="text-muted-foreground">&gt;</span>
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Product Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-4">
            <div className="bg-muted relative aspect-4/3 w-full overflow-hidden rounded-lg">
              <img
                src={product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {product.images.slice(1, 5).map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-md border border-transparent"
                >
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={cn(
                      "size-4",
                      i <= Math.floor(product.rating)
                        ? "fill-amber-400 text-amber-500"
                        : "text-muted-foreground",
                    )}
                  />
                ))}
              </div>
              <span className="text-muted-foreground text-sm">
                {product.rating} ({product.reviewCount.toLocaleString()}{" "}
                Reviews)
              </span>
            </div>
            <h1 className="text-2xl font-bold md:text-3xl">{product.name}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {product.slogan}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                ${product.price.toFixed(2)}
              </span>
              <span className="text-muted-foreground text-sm line-through">
                ${product.oldPrice.toFixed(2)}
              </span>
            </div>

            <RadioGroup
              value={String(selectedBundle)}
              onValueChange={(v) => setSelectedBundle(Number(v))}
            >
              {product.bundles.map((bundle, i) => (
                <FieldLabel
                  key={i}
                  htmlFor={`bundle-${i}`}
                  className="border-input cursor-pointer"
                >
                  <Field orientation="horizontal">
                    <RadioGroupItem
                      id={`bundle-${i}`}
                      value={String(i)}
                      className="size-4 shrink-0"
                    />
                    <FieldContent className="flex-row justify-between gap-2">
                      <FieldTitle>{bundle.label}</FieldTitle>
                      <FieldDescription className="flex items-center justify-between gap-2">
                        {bundle.save && (
                          <span className="text-destructive font-medium">
                            {bundle.save}
                          </span>
                        )}
                        <span>${bundle.price.toFixed(2)}</span>
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>

            <div className="mt-6 flex items-center gap-2">
              <ButtonGroup>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="rounded-r-none border-r"
                >
                  <Minus />
                </Button>
                <Input
                  type="text"
                  readOnly
                  value={quantity}
                  className="w-12 text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={incrementQuantity}
                  className="rounded-l-none border-l"
                >
                  <Plus />
                </Button>
              </ButtonGroup>

              <div className="flex grow gap-2">
                <Button className="grow">Add to Cart</Button>
                <Button variant="outline" className="flex-1">
                  <Heart />
                  Add to Favorites
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <Carousel
                opts={{ align: "start", containScroll: "trimSnaps" }}
                className="w-full"
              >
                <div className="flex items-center justify-between">
                  <p className="text-foreground text-sm font-medium">
                    You might also like these
                  </p>
                  <div className="flex gap-1">
                    <CarouselPrevious className="border-input bg-background hover:bg-muted/80 static size-8 translate-y-0 border" />
                    <CarouselNext className="border-input bg-background hover:bg-muted/80 static size-8 translate-y-0 border" />
                  </div>
                </div>
                <CarouselContent className="mt-2 ml-0 gap-2">
                  {product.youMightAlsoLike.map((src, i) => (
                    <CarouselItem key={i} className="basis-[120px] pl-0">
                      <div className="bg-muted relative aspect-square overflow-hidden rounded-md">
                        <img
                          src={src}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>

            <Accordion
              type="single"
              collapsible
              defaultValue="description"
              className="mt-8 border-t pt-6"
            >
              <AccordionItem value="description" className="border-b">
                <AccordionTrigger className="py-4 text-sm font-medium hover:no-underline">
                  Product Description
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm leading-relaxed">
                  {product.description}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="benefits" className="border-b">
                <AccordionTrigger className="py-4 text-sm font-medium hover:no-underline">
                  KEY Benefits
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm leading-relaxed">
                  {product.keyBenefits}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="ingredients" className="border-b">
                <AccordionTrigger className="py-4 text-sm font-medium hover:no-underline">
                  KEY Ingredients
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm leading-relaxed">
                  {product.keyIngredients}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="howToUse" className="border-b-0">
                <AccordionTrigger className="py-4 text-sm font-medium hover:no-underline">
                  How to Use
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm leading-relaxed">
                  {product.howToUse}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        <Tabs defaultValue="reviews" className="mt-12 border-t pt-8">
          <TabsList className="h-auto w-auto gap-0 rounded-none border-0 border-b bg-transparent p-0 *:rounded-none *:border-transparent! *:bg-transparent! *:data-[state=active]:shadow-none!">
            <TabsTrigger
              value="reviews"
              className="data-[state=active]:border-b-foreground! px-0 pt-0 pb-3 data-[state=active]:bg-transparent"
            >
              Reviews
            </TabsTrigger>
            <TabsTrigger
              value="qa"
              className="data-[state=active]:border-b-foreground! px-0 pt-0 pb-3 data-[state=active]:bg-transparent"
            >
              Questions and Answer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="mt-8">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
              <div>
                <h2 className="text-lg">More reviews by people like you</h2>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm font-medium">Excellent</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="size-4 fill-amber-500 text-amber-500"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm">
                  Based on 531 verified reviews on Trustpilot
                  <ShieldCheckIcon className="size-4 text-green-600" />
                </p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm">
                  Select a row below to filter reviews.
                </p>
                <div className="mt-4 space-y-3">
                  {ratingDistribution.map((row) => (
                    <div
                      key={row.stars}
                      className="flex cursor-pointer items-center gap-4 text-sm"
                    >
                      <span className="w-14">{row.stars} Star</span>
                      <Progress
                        value={row.percent}
                        className="*:data-[slot=progress-indicator]:bg-primary h-2 flex-1"
                      />
                      <span className="w-10 text-right">{row.percent}%</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-col items-start gap-1">
                  <span className="text-muted-foreground text-sm">
                    Overall Rating
                  </span>
                  <span className="text-3xl font-bold">4.5</span>
                  <span className="text-muted-foreground text-sm">
                    860 Reviews
                  </span>
                </div>
                <Button className="mt-6">Write a review</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="qa" className="mt-8">
            <p className="text-muted-foreground text-sm">
              Questions and answers about this product will appear here.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
