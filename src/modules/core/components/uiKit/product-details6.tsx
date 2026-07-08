"use client";

import { useState, useEffect } from "react";
import { Star, Minus, Plus, Bookmark, Heart } from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Input } from "@coreModule/components/uiKit/ui/input";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@coreModule/components/uiKit/ui/carousel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@coreModule/components/uiKit/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Progress } from "@coreModule/components/uiKit/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@coreModule/components/uiKit/ui/tabs";
import { cn } from "@coreModule/components/lib/utils";
import { Badge } from "@coreModule/components/uiKit/ui/badge";

const product = {
  category: "Face Care",
  name: "Ayune Radiance Glow Serum",
  rating: 4,
  reviewCount: 546,
  shortDescription:
    "Ayune Radiance Glow Serum is a powerful yet gentle formula designed to brighten dull skin, fade dark spots, and improve overall skin texture. Infused with Vitamin C, Niacinamide, and Hyaluronic Acid, this serum works to deeply hydrate while enhancing your skin's natural radiance.",
  price: "$24.99",
  volume: "150ml",
  images: [
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
    "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=800",
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80",
    "https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=800&q=80",
  ],
  detailsDescription:
    "High-performance formula that brightens dull skin, fades dark spots, and improves texture. Suits all skin types.",
  keyBenefits:
    "Brightens skin tone, reduces dark spots, deep hydration, smoother texture. Visible results in 2–4 weeks with daily use.",
  howToUse:
    "Apply 2–3 drops to clean, dry skin morning and evening. Gently pat into face and neck. Follow with moisturizer and SPF during the day.",
  ingredients: [
    { title: "Vitamin C", content: "Brightens skin and supports collagen." },
    { title: "Hyaluronic Acid", content: "Deep hydration, plumps fine lines." },
    {
      title: "Niacinamide (Vitamin B3)",
      content: "Minimizes pores, evens tone.",
    },
    { title: "Green Tea Extract", content: "Soothes and protects." },
    { title: "Aloe Vera", content: "Calms and nourishes." },
  ],
};

const ratingSummary = {
  average: 4.5,
  newReviewsCount: 50,
  distribution: [
    { stars: 5, percent: 70 },
    { stars: 4, percent: 20 },
    { stars: 3, percent: 5 },
    { stars: 2, percent: 3 },
    { stars: 1, percent: 2 },
  ],
};

const reviews = [
  {
    name: "Alex Mathio",
    stars: 5,
    date: "13 Oct 2024",
    text: "NextGen's dedication to sustainability and ethical practices resonates strongly with today's consumers, positioning the brand as a responsible choice in the fashion world.",
    avatar: "https://pravatar.cc/150?img=1",
  },
  {
    name: "Jordan Lee",
    stars: 5,
    date: "8 Oct 2024",
    text: "This serum transformed my skin in weeks. Gentle, effective, and the glow is real. Will repurchase.",
    avatar: "https://pravatar.cc/150?img=2",
  },
  {
    name: "Sam Taylor",
    stars: 4,
    date: "1 Oct 2024",
    text: "Great value for the quality. My dark spots have faded noticeably. Only wish the bottle was a bit bigger.",
    avatar: "https://pravatar.cc/150?img=3",
  },
  {
    name: "Casey Morgan",
    stars: 5,
    date: "28 Sep 2024",
    text: "Best serum I've tried. Absorbs quickly, no sticky feel, and my skin looks brighter. Highly recommend.",
    avatar: "https://pravatar.cc/150?img=4",
  },
  {
    name: "Riley Kim",
    stars: 4,
    date: "22 Sep 2024",
    text: "Works well with my routine. Hydration is top-notch. Packaging is elegant too.",
    avatar: "https://pravatar.cc/150?img=5",
  },
  {
    name: "Morgan Blake",
    stars: 5,
    date: "15 Sep 2024",
    text: "Visible results in three weeks. My dermatologist noticed the improvement. Worth every penny.",
    avatar: "https://pravatar.cc/150?img=6",
  },
];

export default function ProductDetail() {
  const [quantity, setQuantity] = useState(1);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [reviewsApi, setReviewsApi] = useState<CarouselApi>();
  const [currentReview, setCurrentReview] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  useEffect(() => {
    if (!reviewsApi) return;
    setCurrentReview(reviewsApi.selectedScrollSnap());
    reviewsApi.on("select", () =>
      setCurrentReview(reviewsApi.selectedScrollSnap()),
    );
  }, [reviewsApi]);

  const reviewSlides = Math.ceil(reviews.length / 2);

  const incrementQuantity = () => setQuantity((prev) => prev + 1);
  const decrementQuantity = () =>
    setQuantity((prev) => (prev > 0 ? prev - 1 : 0));

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
          <div className="space-y-4">
            <div className="relative w-full">
              <Carousel setApi={setApi} className="inset-0">
                <CarouselContent className="ml-0 h-full">
                  {product.images.map((src, i) => (
                    <CarouselItem key={i} className="pl-0">
                      <img
                        src={src}
                        alt={`${product.name} ${i + 1}`}
                        className="aspect-4/3 object-cover"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious
                  className="border-background/80 bg-background/80 text-foreground hover:bg-background top-auto right-14 bottom-4 left-auto"
                  variant="secondary"
                />
                <CarouselNext
                  className="border-background/80 bg-background/80 text-foreground hover:bg-background top-auto right-4 bottom-4"
                  variant="secondary"
                />
              </Carousel>
            </div>
            <div className="flex justify-center gap-2">
              {product.images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => api?.scrollTo(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={cn(
                    "size-2 rounded-full transition-colors",
                    i === current
                      ? "bg-primary"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <Badge variant="outline">{product.category}</Badge>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {product.name}
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={cn(
                      "size-4",
                      i <= product.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30",
                    )}
                  />
                ))}
              </div>
              <span className="text-muted-foreground text-sm">
                ({product.reviewCount} Review)
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {product.shortDescription}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{product.price}</span>
              <span className="text-muted-foreground text-sm">
                ({product.volume})
              </span>
            </div>

            <div>
              <span className="text-muted-foreground text-sm">Quantity:</span>
              <div className="border-input bg-background mt-2 flex w-fit items-center rounded-md border">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={decrementQuantity}
                  disabled={quantity <= 0}
                  className="rounded-r-none border-r"
                >
                  <Minus />
                </Button>
                <Input
                  type="number"
                  readOnly
                  value={quantity}
                  className="w-14 [appearance:textfield] border-0 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={incrementQuantity}
                  className="rounded-l-none border-l"
                >
                  <Plus />
                </Button>
              </div>
            </div>

            <div className="mt-8 flex gap-2">
              <Button variant="outline" size="icon">
                <Bookmark />
                <span className="sr-only">Save</span>
              </Button>
              <Button variant="outline" size="icon">
                <Heart />
                <span className="sr-only">Wishlist</span>
              </Button>
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
              >
                Buy Product
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="product-details" className="mt-8 border-t pt-8">
          <div className="grid gap-8 lg:grid-cols-[200px_1fr] lg:gap-12">
            <TabsList className="flex h-fit w-full flex-col justify-start rounded-lg border-0 bg-transparent p-0 *:w-full *:rounded-md *:p-4">
              <TabsTrigger
                value="product-details"
                className="text-muted-foreground data-[state=active]:border-primary/10 data-[state=active]:text-foreground data-[state=active]:bg-accent/50 justify-start border-transparent bg-transparent px-0 py-2 data-[state=active]:shadow-none!"
              >
                Product Details
              </TabsTrigger>
              <TabsTrigger
                value="customer-reviews"
                className="text-muted-foreground data-[state=active]:border-primary/10 data-[state=active]:text-foreground justify-start border-transparent bg-transparent px-0 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none!"
              >
                Customer Reviews
              </TabsTrigger>
              <TabsTrigger
                value="key-benefits"
                className="text-muted-foreground data-[state=active]:border-primary/10 data-[state=active]:text-foreground data-[state=active]:bg-accent/50 justify-start border-transparent bg-transparent px-0 py-2 data-[state=active]:shadow-none!"
              >
                Key Benefits
              </TabsTrigger>
              <TabsTrigger
                value="how-to-use"
                className="text-muted-foreground data-[state=active]:border-primary/10 data-[state=active]:text-foreground data-[state=active]:bg-accent/50 justify-start border-transparent bg-transparent px-0 py-2 data-[state=active]:shadow-none!"
              >
                How to Use
              </TabsTrigger>
            </TabsList>

            <div className="min-w-0">
              <TabsContent value="product-details" className="mt-0">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Details Product
                </h2>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {product.detailsDescription}
                </p>
                <Accordion
                  type="single"
                  collapsible
                  defaultValue="vitamin-c"
                  className="mt-6 w-full"
                >
                  {product.ingredients.map((item) => (
                    <AccordionItem
                      key={item.title}
                      value={item.title
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[()]/g, "")}
                    >
                      <AccordionTrigger className="text-sm font-medium">
                        {item.title}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                        {item.content}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              <TabsContent value="key-benefits" className="mt-0">
                <h2 className="font-serif text-2xl font-semibold tracking-tight">
                  Key Benefits
                </h2>
                <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                  {product.keyBenefits}
                </p>
              </TabsContent>

              <TabsContent value="how-to-use" className="mt-0">
                <h2 className="font-serif text-2xl font-semibold tracking-tight">
                  How to Use
                </h2>
                <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                  {product.howToUse}
                </p>
              </TabsContent>

              <TabsContent value="customer-reviews" className="mt-0">
                <div className="space-y-8">
                  <h2 className="text-xl font-bold">Rating & Reviews</h2>
                  <div className="grid gap-8 md:grid-cols-[auto_1fr] md:gap-12">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">
                          {ratingSummary.average.toString().replace(".", ",")}
                        </span>
                        <span className="text-muted-foreground text-lg">
                          /5
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        ({ratingSummary.newReviewsCount} New Reviews)
                      </p>
                      <div className="flex flex-col gap-2">
                        {ratingSummary.distribution.map((row) => (
                          <div
                            key={row.stars}
                            className="flex items-center gap-2"
                          >
                            <Star className="size-4 shrink-0 fill-amber-400 text-amber-400" />
                            <span className="text-muted-foreground w-4 text-sm">
                              {row.stars}
                            </span>
                            <Progress
                              value={row.percent}
                              className="bg-muted *:data-[slot=progress-indicator]:bg-foreground h-2 w-24"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="relative min-w-0">
                      <Carousel
                        setApi={setReviewsApi}
                        opts={{ align: "start", containScroll: "trimSnaps" }}
                        className="w-full"
                      >
                        <CarouselContent className="ml-0">
                          {Array.from({ length: reviewSlides }).map(
                            (_, slideIndex) => (
                              <CarouselItem
                                key={slideIndex}
                                className="grid grid-cols-1 gap-4 pl-0 md:grid-cols-2"
                              >
                                {reviews
                                  .slice(slideIndex * 2, slideIndex * 2 + 2)
                                  .map((review) => (
                                    <div
                                      key={review.name}
                                      className="bg-background flex flex-col rounded-lg border p-4"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <span className="font-semibold">
                                          {review.name}
                                        </span>
                                        <span className="text-muted-foreground shrink-0 text-sm">
                                          {review.date}
                                        </span>
                                      </div>
                                      <div className="mt-1 flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                          <Star
                                            key={i}
                                            className={cn(
                                              "size-4",
                                              i <= review.stars
                                                ? "fill-amber-400 text-amber-400"
                                                : "text-muted-foreground/30",
                                            )}
                                          />
                                        ))}
                                      </div>
                                      <p className="text-foreground mt-3 flex-1 text-sm leading-relaxed">
                                        {review.text}
                                      </p>
                                      <Avatar className="mt-4 size-8">
                                        <AvatarImage
                                          src={review.avatar}
                                          alt={review.name}
                                        />
                                        <AvatarFallback>
                                          {review.name.slice(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                  ))}
                              </CarouselItem>
                            ),
                          )}
                        </CarouselContent>
                        <CarouselNext
                          className="border-muted bg-muted/80 hover:bg-muted top-1/2 right-0 -translate-y-1/2"
                          variant="secondary"
                        />
                      </Carousel>
                      <div className="mt-4 flex justify-center gap-2">
                        {Array.from({ length: reviewSlides }).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => reviewsApi?.scrollTo(i)}
                            aria-label={`Reviews slide ${i + 1}`}
                            className={cn(
                              "h-1.5 max-w-8 flex-1 rounded-full transition-colors",
                              i === currentReview
                                ? "bg-foreground"
                                : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
