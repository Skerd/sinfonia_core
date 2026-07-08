"use client";

import { useState } from "react";
import { ShoppingCartIcon, Star } from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { RadioGroup, RadioGroupItem } from "@coreModule/components/uiKit/ui/radio-group";
import { cn } from "@coreModule/components/lib/utils";
import Image from "next/image";

const product = {
  name: "Basic Tee 6-Pack",
  price: "$192",
  href: "#",
  breadcrumbs: [
    { id: 1, name: "Men", href: "#" },
    { id: 2, name: "Clothing", href: "#" },
  ],
  images: [
    {
      src: "/images/products/01.jpeg",
      alt: "Two each of gray, white, and black shirts laying flat.",
    },
    {
      src: "/images/products/02.jpeg",
      alt: "Model wearing plain black basic tee.",
    },
    {
      src: "/images/products/03.jpeg",
      alt: "Model wearing plain gray basic tee.",
    },
    {
      src: "/images/products/04.jpeg",
      alt: "Model wearing plain white basic tee.",
    },
  ],
  colors: [
    { name: "White", class: "bg-white", selectedClass: "ring-gray-400" },
    { name: "Gray", class: "bg-gray-200", selectedClass: "ring-gray-400" },
    { name: "Black", class: "bg-gray-900", selectedClass: "ring-gray-900" },
  ],
  sizes: [
    { name: "XXS", inStock: false },
    { name: "XS", inStock: true },
    { name: "M", inStock: true },
    { name: "L", inStock: true },
  ],
  description:
    'The Basic Tee 6-Pack allows you to fully express your vibrant personality with three grayscale options. Feeling adventurous? Put on a heather gray tee. Want to be a trendsetter? Try our exclusive colorway: "Black". Need to add an extra pop of color to your outfit? Our white tee has you covered.',
  highlights: [
    "Hand cut and sewn locally",
    "Dyed with our proprietary colors",
    "Pre-washed & pre-shrunk",
    "Ultra-soft 100% cotton",
  ],
  details:
    'The 6-Pack includes two black, two white, and two heather gray Basic Tees. Sign up for our subscription service and be the first to get new, exciting colors, like our upcoming "Charcoal Gray" limited release.',
};

const reviews = { href: "#", average: 4, totalCount: 117 };

export default function ProductDetail() {
  const [selectedColor, setSelectedColor] = useState(product.colors[0].name);
  const [selectedSize, setSelectedSize] = useState(product.sizes[2].name);

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20 lg:max-w-7xl lg:px-8">
      <div className="mx-auto max-w-2xl lg:grid lg:max-w-7xl lg:grid-cols-3 lg:gap-x-8">
        <Image
          alt={product.images[0].alt}
          src={product.images[0].src}
          width={300}
          height={300}
          className="hidden aspect-3/4 size-full rounded-lg object-cover lg:block"
          unoptimized
        />
        <div className="hidden lg:grid lg:grid-cols-1 lg:gap-y-8">
          <Image
            alt={product.images[1].alt}
            src={product.images[1].src}
            width={300}
            height={300}
            className="aspect-3/2 w-full rounded-lg object-cover"
            unoptimized
          />
          <Image
            alt={product.images[2].alt}
            src={product.images[2].src}
            width={300}
            height={300}
            className="aspect-3/2 w-full rounded-lg object-cover"
            unoptimized
          />
        </div>
        <Image
          alt={product.images[3].alt}
          src={product.images[3].src}
          width={300}
          height={300}
          className="aspect-4/5 size-full rounded-lg object-cover sm:rounded-lg lg:aspect-3/4"
          unoptimized
        />
      </div>

      {/* Product info */}
      <div className="pt-8 lg:grid lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr] lg:gap-x-8">
        <div className="lg:border-border lg:col-span-2 lg:border-r lg:pr-8">
          <h1 className="text-foreground text-2xl font-bold sm:text-3xl">
            {product.name}
          </h1>
        </div>

        <div className="mt-4 lg:row-span-3 lg:mt-0">
          <h2 className="sr-only">Product information</h2>
          <p className="text-foreground text-3xl font-semibold tracking-tight">
            {product.price}
          </p>

          <div className="mt-6">
            <h3 className="sr-only">Reviews</h3>
            <div className="flex items-center">
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((rating) => (
                  <Star
                    key={rating}
                    className={cn(
                      "size-5",
                      reviews.average > rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-muted text-muted",
                    )}
                  />
                ))}
              </div>
              <p className="sr-only">{reviews.average} out of 5 stars</p>
              <a
                href={reviews.href}
                className="text-primary hover:text-primary/90 ml-3 text-sm font-medium"
              >
                {reviews.totalCount} reviews
              </a>
            </div>
          </div>

          <form className="mt-8">
            <div>
              <h3 className="text-foreground text-sm font-medium">Color</h3>
              <RadioGroup
                defaultValue={selectedColor}
                onValueChange={setSelectedColor}
                className="mt-2 flex items-center gap-3"
              >
                {product.colors.map((color) => (
                  <div key={color.name} className="relative">
                    <RadioGroupItem
                      value={color.name}
                      id={`color-${color.name}`}
                      className="sr-only"
                    />
                    <label
                      htmlFor={`color-${color.name}`}
                      className={cn(
                        "border-border block size-6 rounded-full border",
                        color.class,
                        selectedColor === color.name && "ring-primary ring-2",
                      )}
                    >
                      <span className="sr-only">{color.name}</span>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground text-sm font-medium">Size</h3>
              </div>

              <RadioGroup
                defaultValue={selectedSize}
                onValueChange={setSelectedSize}
                className="mt-2 grid grid-cols-4 gap-3 sm:grid-cols-8 lg:grid-cols-4"
              >
                {product.sizes.map((size) => (
                  <div key={size.name}>
                    <RadioGroupItem
                      value={size.name}
                      id={`size-${size.name}`}
                      className="peer sr-only"
                      disabled={!size.inStock}
                    />
                    <label
                      htmlFor={`size-${size.name}`}
                      className={cn(
                        "border-border bg-background hover:bg-accent hover:peer-disabled:bg-background [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/10 flex cursor-pointer items-center justify-center rounded-md border px-3 py-3 text-sm font-medium uppercase peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
                        "sm:flex-1",
                      )}
                    >
                      {size.name}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Button className="mt-6 w-full" size="lg">
              <ShoppingCartIcon />
              Add to Cart
            </Button>
          </form>
        </div>

        <div className="lg:border-border prose dark:prose-invert max-w-full space-y-6 py-10 lg:col-span-2 lg:col-start-1 lg:border-r lg:pt-6 lg:pr-8 lg:pb-16">
          <h4 className="sr-only">Description</h4>
          <p>{product.description}</p>
          <h4>Highlights</h4>
          <ul>
            {product.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
