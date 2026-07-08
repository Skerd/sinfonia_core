"use client";

import { useState } from "react";
import { Check, Heart, ShoppingCart } from "lucide-react";

import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import { cn } from "@coreModule/components/lib/utils";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Badge } from "@coreModule/components/uiKit/ui/badge";

const product = {
  id: "1",
  image:
    "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=500",
  title: "Premium Leather Shoes",
  price: 129.99,
  originalPrice: 179.99,
  colors: [
    { name: "Black", hex: "#000000" },
    { name: "Navy", hex: "#001f3f" },
    { name: "Tan", hex: "#D2B48C" },
    { name: "Red", hex: "#FF4136" },
  ],
  sizes: [
    { name: "6", available: true },
    { name: "7", available: true },
    { name: "8", available: true },
    { name: "9", available: false },
    { name: "10", available: true },
    { name: "11", available: true },
  ],
};

export default function ProductCard() {
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(
    product.sizes.find((s) => s.available) || product.sizes[0],
  );
  const [isFavorited, setIsFavorited] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleToggleFavorite = () => {
    const next = !isFavorited;
    setIsFavorited(next);
  };

  const savings = product.originalPrice
    ? product.originalPrice - product.price
    : 0;

  const savingsPercent = product.originalPrice
    ? Math.round((savings / product.originalPrice) * 100)
    : 0;

  return (
    <Card className="overflow-hidden py-0 shadow-none">
      <CardContent className="flex flex-1 flex-col justify-between p-0 lg:flex-row">
        <figure className="relative shrink-0 overflow-hidden md:w-80">
          <img
            src={product.image}
            alt={product.title}
            className="aspect-3/2 w-full object-cover transition-transform duration-300 hover:scale-105 lg:aspect-auto"
          />

          {savings > 0 && (
            <Badge className="absolute start-3 top-3" variant="destructive">
              Save {savingsPercent}%
            </Badge>
          )}

          <div className="absolute end-3 top-3">
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={handleToggleFavorite}
              className="bg-background rounded-full"
            >
              <Heart
                size={20}
                className={cn(
                  "transition-colors",
                  isFavorited
                    ? "fill-red-500 text-red-500"
                    : "text-muted-foreground hover:text-red-500",
                )}
              />
            </Button>
          </div>
        </figure>

        <div className="flex flex-col p-4">
          <h5 className="mb-2 text-xl font-semibold">{product.title}</h5>

          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              ${product.price.toFixed(2)}
            </span>

            {product.originalPrice && (
              <span className="text-muted-foreground line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Colors */}
          <div className="mb-6">
            <label className="mb-3 block text-sm">Color</label>
            <div className="flex items-center flex-wrap gap-2">
              {product.colors.map((color) => (
                <Button
                  key={color.name}
                  size="icon"
                  variant="outline"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "size-5 rounded-full border transition-all",
                    selectedColor.name === color.name
                      ? "border-neutral-900 ring-1 ring-neutral-900 ring-offset-1"
                      : "border-neutral-200 hover:border-neutral-400",
                  )}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
              <span className="text-muted-foreground text-sm">{selectedColor.name}</span>
            </div>
          </div>

          {/* Sizes */}
          <div className="mb-6">
            <label className="mb-3 block text-sm">Size</label>

            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <Button
                  key={size.name}
                  size="icon-sm"
                  variant={
                    selectedSize.name === size.name ? "default" : "outline"
                  }
                  disabled={!size.available}
                  onClick={() => size.available && setSelectedSize(size)}
                  className={cn(
                    "rounded-lg font-semibold transition-all",
                    !size.available
                      ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400"
                      : "",
                  )}
                >
                  {size.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <Button className="w-full" onClick={handleAddToCart}>
              {isAdded ? (
                <>
                  <Check />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart />
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
