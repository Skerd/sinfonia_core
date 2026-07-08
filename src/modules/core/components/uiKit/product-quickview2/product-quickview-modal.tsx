"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@coreModule/components/uiKit/ui/dialog";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { HeartIcon, MinusIcon, PlusIcon, Star } from "lucide-react";
import { cn } from "@coreModule/components/lib/utils";
import { RadioGroup, RadioGroupItem } from "@coreModule/components/uiKit/ui/radio-group";
import { ButtonGroup } from "@coreModule/components/uiKit/ui/button-group";
import { Input } from "@coreModule/components/uiKit/ui/input";

interface ProductQuickviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    title: string;
    description: string;
    price: string;
    old_price: string;
    rating: number;
    reviewCount: number;
    image: string;
    colors: Array<{ name: string; value: string }>;
    sizes: Array<{ name: string; available: boolean }>;
  };
}

export function ProductQuickviewDialog({ open, onOpenChange, product }: ProductQuickviewProps) {
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name);
  const [selectedSize, setSelectedSize] = useState("S");

  const renderStars = (rating: number) => {
    return Array(5)
      .fill("")
      .map((_, i) =>
        i < rating ? (
          <Star key={i} className="size-4 fill-amber-500 text-amber-500" />
        ) : (
          <Star key={i} className="text-muted-foreground size-4 opacity-70" />
        )
      );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="flex flex-col gap-0">
          {/* Product Image */}
          <figure className="relative flex items-center justify-center">
            <Button
              variant="outline"
              size="sm"
              className="absolute start-3 top-3"
              aria-label="Add to Wishlist">
              <HeartIcon />
            </Button>
            <img src={product.image} alt={product.title} className="h-96 w-full object-cover" />
          </figure>

          {/* Product Details */}
          <div className="flex flex-col p-4 md:p-6">
            <div className="flex-1">
              <div className="mb-4 flex justify-between">
                <h2 className="font-heading text-2xl text-balance lg:text-3xl">{product.title}</h2>

                <p className="flex items-center gap-2 text-2xl font-medium">
                  <span className="text-muted-foreground text-xl line-through">
                    {product.old_price}
                  </span>
                  {product.price}
                </p>
              </div>

              {/* Rating */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex gap-1">{renderStars(product.rating)}</div>
                <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  {product.reviewCount} reviews
                </a>
              </div>

              <p className="text-muted-foreground mb-6 text-sm">{product.description}</p>

              {/* Color Selection */}
              <fieldset className="mb-4 space-y-4 lg:mb-8">
                <legend className="text-foreground text-sm leading-none font-medium">Color</legend>
                <RadioGroup
                  className="flex gap-1.5"
                  onValueChange={(value) => setSelectedColor(value)}
                  defaultValue="blue">
                  {product.colors.map((color) => (
                    <RadioGroupItem
                      key={color.name}
                      value={color.name}
                      style={{ backgroundColor: color.value }}
                      aria-label={`Select ${color.name} color`}
                      className={cn(
                        "size-6 rounded-full border transition-all",
                        selectedColor === color.name
                          ? "border-foreground ring-foreground ring ring-offset-2"
                          : "border-border hover:border-foreground/50"
                      )}
                    />
                  ))}
                </RadioGroup>
              </fieldset>

              {/* Size Selection */}
              <fieldset className="mb-4 space-y-4 lg:mb-8">
                <legend className="text-foreground flex w-full items-center justify-between text-sm leading-none font-medium">
                  <span>Size</span>
                  <a
                    href="#size-guide"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    Size guide
                  </a>
                </legend>
                <RadioGroup
                  className="grid grid-cols-4 gap-2"
                  onValueChange={(value) => setSelectedSize(value)}
                  defaultValue="1">
                  {product.sizes.map((size) => (
                    <label
                      key={`${size.name}`}
                      className="border-input has-focus-visible:border-ring has-focus-visible:ring-ring/50 has-data-[state=checked]:border-primary/50 relative flex cursor-pointer flex-col items-center gap-3 rounded-md border px-2 py-3 text-center shadow-xs transition-[color,box-shadow] outline-none has-focus-visible:ring-[3px] has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50">
                      <RadioGroupItem
                        id={`${size.name}`}
                        value={size.name}
                        className="sr-only after:absolute after:inset-0"
                      />
                      <p className="text-foreground text-sm leading-none font-medium">
                        {size.name}
                      </p>
                    </label>
                  ))}
                </RadioGroup>
              </fieldset>
            </div>

            {/* Add to Bag Button */}
            <div className="flex gap-2">
              <ButtonGroup>
                <Button variant="outline" aria-label="" disabled>
                  <MinusIcon />
                </Button>
                <Input className="w-12 text-center" placeholder="1" />
                <Button variant="outline" aria-label="">
                  <PlusIcon />
                </Button>
              </ButtonGroup>
              <Button className="grow">Add to Cart</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
