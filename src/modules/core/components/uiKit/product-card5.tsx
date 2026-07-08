"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, ShoppingCart } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";

const product = {
  id: "1",
  image:
    "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=500",
  title: "Premium Wireless Headphones",
  price: 149.99,
  isFavorite: false,
};

export default function ProductCard() {
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = () => {
    setIsAddingToCart(true);
    setTimeout(() => setIsAddingToCart(false), 500);
  };

  return (
    <Card className="w-full max-w-72 overflow-hidden pt-0 shadow-none">
      <div className="bg-muted relative aspect-square overflow-hidden">
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
        />

        <div className="absolute end-2 top-2">
          <Button
            size="icon-sm"
            variant="secondary"
            className="rounded-full"
            aria-label={
              product.isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            <Heart
              size={20}
              className={`transition-all ${
                product.isFavorite
                  ? "fill-destructive text-destructive"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            />
          </Button>
        </div>
      </div>

      <CardContent className="flex flex-col gap-3">
        <h5 className="text-card-foreground line-clamp-2 text-base text-balance">
          {product.title}
        </h5>

        <div className="text-foreground text-2xl font-semibold">
          ${product.price.toFixed(2)}
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          className="w-full gap-2"
          size="sm"
        >
          <ShoppingCart size={18} />
          {isAddingToCart ? "Adding..." : "Add to Cart"}
        </Button>
      </CardContent>
    </Card>
  );
}
