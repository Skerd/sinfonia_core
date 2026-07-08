"use client";

import Image from "next/image";
import { useState } from "react";
import { Heart, ShoppingCart, SlidersHorizontal } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";

const categories = [
  { id: "all", label: "All Perfumes" },
  { id: "womens", label: "Women's" },
  { id: "unisex", label: "Unisex" },
  { id: "bath-body", label: "Bath & Body" },
] as const;

const products = [
  {
    id: "1",
    name: "Ashes of Moonlight",
    categoryId: "womens",
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&q=80",
    imageVariant:
      "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400&q=80",
    price: 139.0,
  },
  {
    id: "2",
    name: "Whispers of Ether",
    categoryId: "unisex",
    image:
      "https://images.unsplash.com/photo-1458538977777-0549b2370168?q=80&w=400",
    imageVariant:
      "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400&q=80",
    price: 264.0,
  },
  {
    id: "3",
    name: "Memoire Sauvage",
    categoryId: "unisex",
    image:
      "https://images.unsplash.com/photo-1700522360590-a913ff2a3d9f?q=80&w=400",
    imageVariant:
      "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400&q=80",
    price: 124.0,
  },
  {
    id: "4",
    name: "Crimson Mirage",
    categoryId: "womens",
    image:
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&q=80",
    imageVariant:
      "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400&q=80",
    price: 89.0,
  },
  {
    id: "5",
    name: "Velvet Nocturne",
    categoryId: "womens",
    image:
      "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=400&q=80",
    imageVariant:
      "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400&q=80",
    price: 156.0,
  },
  {
    id: "6",
    name: "Aqua Solis",
    categoryId: "unisex",
    image:
      "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400&q=80",
    imageVariant:
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&q=80",
    price: 98.0,
  },
];

export default function ProductListSix() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.categoryId === activeCategory);

  return (
    <section className="w-full px-4 py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:border-b">
          <nav
            className="flex gap-6 overflow-x-auto pb-4 sm:pb-0"
            role="tablist"
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`focus-visible:ring-ring shrink-0 border-b-2 pb-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none sm:pb-4 ${
                  activeCategory === cat.id
                    ? "border-primary text-foreground"
                    : "text-foreground/80 hover:text-foreground border-transparent"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </nav>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground shrink-0 gap-2"
          >
            <SlidersHorizontal className="size-4" />
            Filters
          </Button>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="group relative overflow-hidden pt-0 shadow-none"
              >
                <figure className="relative">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={280}
                    height={280}
                    className="aspect-square w-full object-cover opacity-100 transition-opacity duration-200 group-hover:opacity-0"
                    unoptimized
                  />
                  <Image
                    src={product.imageVariant}
                    alt={`${product.name} variant`}
                    width={280}
                    height={280}
                    className="absolute inset-0 aspect-square w-full object-cover opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    unoptimized
                  />
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="border-background bg-background/90 hover:bg-background absolute top-3 right-3 rounded-full shadow-sm"
                    aria-label="Add to favorites"
                  >
                    <Heart />
                  </Button>
                </figure>
                <CardContent>
                  <div className="space-y-3">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-muted-foreground text-sm font-medium">
                      ${product.price.toFixed(2)}
                    </p>
                    <Button variant="secondary" className="w-full">
                      <ShoppingCart />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground text-center pt-4">No products found</div>
        )}
      </div>
    </section>
  );
}
