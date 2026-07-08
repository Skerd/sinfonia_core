"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  HeartIcon,
  LayoutGridIcon,
  ListIcon,
  ShoppingCartIcon,
  StarIcon,
  StoreIcon,
} from "lucide-react";

import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { ButtonGroup } from "@coreModule/components/uiKit/ui/button-group";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@coreModule/components/uiKit/ui/select";

type SortBy = "new" | "popular" | "price";
type ViewMode = "list" | "grid";

const products = [
  {
    id: "1",
    title:
      "Product wholesale Original Used Second hand Oppo Mobile phone 128GB",
    image:
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=200",
    price: "899.00",
    originalPrice: "298.00",
    discount: "30",
    rating: 4.5,
    ordersCount: 154,
    seller: "AB Technology Ltd",
    isNew: true,
  },
  {
    id: "2",
    title:
      "Magic The Gathering Final Fantasy Collector Booster Box MTG Presale",
    image:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=200&q=80",
    price: "86.00",
    originalPrice: null,
    discount: null,
    rating: 4.5,
    ordersCount: 320,
    seller: "AB Technology Ltd",
    isNew: false,
  },
  {
    id: "3",
    title: "Wireless Bluetooth Headphones with Noise Cancellation",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80",
    price: "129.00",
    originalPrice: "199.00",
    discount: "35",
    rating: 4.8,
    ordersCount: 89,
    seller: "Tech Audio Co",
    isNew: true,
  },
  {
    id: "4",
    title: "Minimalist Leather Watch with Stainless Steel Band",
    image:
      "https://images.unsplash.com/photo-1601737487795-dab272f52420?q=80&w=200",
    price: "249.00",
    originalPrice: "349.00",
    discount: "29",
    rating: 4.6,
    ordersCount: 412,
    seller: "Time & Style",
    isNew: false,
  },
  {
    id: "5",
    title: "Portable SSD 1TB External Storage USB-C",
    image:
      "https://images.unsplash.com/photo-1601737487795-dab272f52420?q=80&w=200",
    price: "89.00",
    originalPrice: null,
    discount: null,
    rating: 4.9,
    ordersCount: 1203,
    seller: "DataDrive Inc",
    isNew: true,
  },
];

function StarRating({ value }: { value: number }) {
  const full = Math.floor(value);
  const hasHalf = value % 1 !== 0;
  return (
    <div className="flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i}>
          {i < full ? (
            <StarIcon className="size-4 fill-amber-400 text-amber-400" />
          ) : i === full && hasHalf ? (
            <StarIcon className="size-4 fill-amber-400 text-amber-400" />
          ) : (
            <StarIcon className="text-muted-foreground size-4 opacity-50" />
          )}
        </span>
      ))}
    </div>
  );
}

export default function ProductListThree() {
  const [sortBy, setSortBy] = useState<SortBy>("new");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const sortedProducts = useMemo(() => {
    const list = [...products];
    switch (sortBy) {
      case "new":
        return list.sort((a, b) =>
          a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1,
        );
      case "popular":
        return list.sort((a, b) => b.ordersCount - a.ordersCount);
      case "price":
        return list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      default:
        return list;
    }
  }, [sortBy]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 py-8 lg:py-16">
      <header className="mb-8 space-y-2">
        <h4 className="text-3xl font-bold">All Products</h4>
        <p className="text-muted-foreground text-sm">
          Browse our collection of featured products
        </p>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Show by:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger size="sm" aria-label="Show by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New items</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ButtonGroup orientation="horizontal">
          <Button
            size="icon"
            variant={viewMode === "list" ? "default" : "outline"}
            aria-pressed={viewMode === "list"}
            onClick={() => setViewMode("list")}
          >
            <ListIcon />
          </Button>
          <Button
            size="icon"
            variant={viewMode === "grid" ? "default" : "outline"}
            aria-pressed={viewMode === "grid"}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGridIcon />
          </Button>
        </ButtonGroup>
      </div>

      <div
        className={
          viewMode === "grid" ? "grid gap-4 sm:grid-cols-3" : "space-y-4"
        }
      >
        {sortedProducts.map((product) =>
          viewMode === "list" ? (
            <Card key={product.id} className="overflow-hidden py-0 shadow-none">
              <CardContent className="flex items-start ps-0 pe-4">
                <div className="relative shrink-0">
                  <div className="bg-muted relative aspect-square w-28 overflow-hidden rounded-l-xl md:w-36">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {product.isNew && (
                      <Badge
                        variant="destructive"
                        className="absolute top-2 left-2 rounded-sm"
                      >
                        New
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4">
                  <p className="text-foreground line-clamp-2 text-sm font-medium">
                    {product.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-primary text-lg font-bold">
                      ${product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-muted-foreground text-sm line-through">
                        ${product.originalPrice}
                      </span>
                    )}
                    {product.discount && (
                      <span className="text-destructive text-sm">
                        -{product.discount}%
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <StarRating value={product.rating} />
                    <span>{product.rating}</span>
                    <span aria-hidden>·</span>
                    <span>{product.ordersCount} orders this week</span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <StoreIcon className="size-3.5 shrink-0" />
                    <span>Seller: {product.seller}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col justify-center gap-2 py-4">
                  <Button size="sm">
                    <ShoppingCartIcon />
                    Add to cart
                  </Button>
                  <Button size="sm" variant="outline">
                    <HeartIcon />
                    Add to wishlist
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card key={product.id} className="overflow-hidden py-0 shadow-none">
              <CardContent className="flex h-full flex-col p-0">
                <div className="bg-muted relative aspect-square w-full overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {product.isNew && (
                    <Badge
                      variant="destructive"
                      className="absolute top-2 left-2 rounded-sm"
                    >
                      New
                    </Badge>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="text-foreground line-clamp-2 text-sm font-medium">
                    {product.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-primary font-bold">
                      ${product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-muted-foreground text-sm line-through">
                        ${product.originalPrice}
                      </span>
                    )}
                    {product.discount && (
                      <span className="text-destructive text-sm">
                        -{product.discount}%
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <StarRating value={product.rating} />
                    <span>{product.rating}</span>
                    <span aria-hidden>·</span>
                    <span>{product.ordersCount} orders</span>
                  </div>
                  <div className="mt-auto pt-2 flex gap-2">
                    <Button size="sm" className="flex-1">
                      <ShoppingCartIcon />
                      Cart
                    </Button>
                    <Button size="sm" variant="outline">
                      <HeartIcon />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ),
        )}
      </div>
    </div>
  );
}
