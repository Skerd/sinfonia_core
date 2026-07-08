"use client";

import Image from "next/image";
import { useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";

const categories = [
  { id: "all", label: "All" },
  { id: "shorts", label: "Shorts" },
  { id: "hat", label: "Hat" },
  { id: "jackets", label: "Jackets" },
  { id: "shoes", label: "Shoes" },
  { id: "tshirt", label: "T-Shirt" },
] as const;

const products = [
  {
    id: "1",
    name: "Brown Graphic T-shirt",
    type: "T-Shirt",
    categoryId: "tshirt",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
    price: 65,
    originalPrice: null,
  },
  {
    id: "2",
    name: "Double-Breasted Wool Coat",
    type: "Women's Coat",
    categoryId: "jackets",
    image:
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&q=80",
    price: 120,
    originalPrice: 160,
  },
  {
    id: "3",
    name: "White Lipstick Print T-Shirt",
    type: "Women's T-Shirt",
    categoryId: "tshirt",
    image:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80",
    price: 38,
    originalPrice: 55,
  },
  {
    id: "4",
    name: "Yellow Tailored Blazer",
    type: "Women's Blazer",
    categoryId: "jackets",
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80",
    price: 85,
    originalPrice: null,
  },
  {
    id: "5",
    name: "Classic White Sneakers",
    type: "Shoes",
    categoryId: "shoes",
    image:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80",
    price: 95,
    originalPrice: 120,
  },
  {
    id: "6",
    name: "Navy Oversized Hoodie",
    type: "Hoodie",
    categoryId: "tshirt",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80",
    price: 72,
    originalPrice: null,
  },
  {
    id: "7",
    name: "Structured Leather Handbag",
    type: "Bag",
    categoryId: "jackets",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80",
    price: 145,
    originalPrice: 180,
  },
  {
    id: "8",
    name: "Grey Beanie",
    type: "Hat",
    categoryId: "hat",
    image:
      "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=400&q=80",
    price: 28,
    originalPrice: null,
  },
];

export default function ProductListFive() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.categoryId === activeCategory);

  return (
    <section className="bg-background w-full px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-8 text-center text-3xl font-bold md:text-3xl">
          Trending Now – Step Into Style
        </h2>

        <nav
          className="mb-10 flex flex-wrap justify-center gap-1.5"
          role="tablist"
        >
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              onClick={() => setActiveCategory(category.id)}
              className="rounded-full"
            >
              {category.label}
            </Button>
          ))}
        </nav>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-y-8 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="group overflow-hidden rounded-none border-0 py-0 shadow-none"
              >
                <CardContent className="space-y-3 p-0">
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={400}
                      height={400}
                      className="size-full rounded-xl object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 flex flex-col justify-end rounded-xl bg-black/0 p-4 transition-colors duration-200 group-hover:bg-black/10">
                      <div className="translate-y-6 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                        <Button
                          variant="secondary"
                          className="w-full rounded-full"
                        >
                          <ShoppingCart />
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-3 right-3 rounded-full border-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      aria-label="Add to favorites"
                    >
                      <Heart />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">
                      {product.type}
                    </p>
                    <p className="line-clamp-2 text-sm font-semibold">
                      {product.name}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-foreground text-base font-semibold">
                        ${product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-muted-foreground text-sm line-through">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground pt-4 text-center">
            No products found
          </div>
        )}
      </div>
    </section>
  );
}
