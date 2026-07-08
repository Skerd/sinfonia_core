"use client";

import Image from "next/image";
import { useState } from "react";
import { PlusIcon, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import { Input } from "@coreModule/components/uiKit/ui/input";

const categories = [
  { id: "all", label: "All" },
  { id: "furniture", label: "Furniture" },
  { id: "shoes", label: "Shoes" },
  { id: "most-purchased", label: "Most Purchased" },
  { id: "electronics", label: "Electronics" },
] as const;

type CategoryId = (typeof categories)[number]["id"];

const products = [
  {
    id: "1",
    name: "Aurora Wireless",
    categoryId: "electronics" as CategoryId,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
    price: 49.99,
  },
  {
    id: "2",
    name: "Smart Watch Pro",
    categoryId: "electronics" as CategoryId,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
    price: 69.99,
  },
  {
    id: "3",
    name: "Smart Speaker",
    categoryId: "electronics" as CategoryId,
    image:
      "https://images.unsplash.com/photo-1543512214-318c7553f230?w=400&q=80",
    price: 23.99,
  },
  {
    id: "4",
    name: "Controller elite",
    categoryId: "electronics" as CategoryId,
    image:
      "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&q=80",
    price: 44.99,
  },
  {
    id: "5",
    name: "AirLite Earbuds",
    categoryId: "most-purchased" as CategoryId,
    image:
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80",
    price: 45.94,
  },
  {
    id: "6",
    name: "Laptop Backpack",
    categoryId: "shoes" as CategoryId,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
    price: 34.5,
  },
];

export default function ProductListSeven() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "all" || product.categoryId === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const total = filteredProducts.length;
  const from = total === 0 ? 0 : 1;
  const to = total;

  return (
    <section className="w-full px-4 py-14">
      <div className="mx-auto max-w-6xl space-y-4 px-4">
        <header className="space-y-4">
          <h2 className="text-3xl font-bold">Products</h2>
          <div className="flex flex-col lg:items-center justify-between lg:flex-row gap-4">
            <nav className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveCategory(cat.id)}
                  className="rounded-lg"
                >
                  {cat.label}
                </Button>
              ))}
            </nav>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                type="search"
                placeholder="Search product...."
                className="w-full pl-9 sm:w-64"
                aria-label="Search product"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="group overflow-hidden rounded-xl py-0 shadow-none"
            >
              <CardContent className="relative p-0">
                <div className="relative aspect-square">
                  <Link href="#">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={400}
                      height={400}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  </Link>
                  <div className="from-background bg-background/50 absolute start-0 right-0 bottom-0 flex items-end justify-between gap-2 px-4 py-2 backdrop-blur-sm">
                    <div className="space-y-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-muted-foreground text-sm">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="rounded-full shadow"
                      aria-label="View product"
                    >
                      <PlusIcon />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <p className="text-muted-foreground mt-6 text-center text-sm">
            No products found
          </p>
        ) : (
          <p className="text-muted-foreground mt-6 text-sm">
            Showing {from} to {to} of {total} entries
          </p>
        )}
      </div>
    </section>
  );
}
