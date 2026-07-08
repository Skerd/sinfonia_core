import Image from "next/image";
import { Star, ShoppingCartIcon, HeartIcon, EyeIcon } from "lucide-react";

import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@coreModule/components/uiKit/ui/tooltip";

const productData = {
  id: "1",
  name: "Red Hat",
  description:
    "Decor Wooden Stool, a stylish, versatile piece with natural wood finish.",
  price: 28.99,
  image: "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=500",
  category: "Clothing",
  rating: 4.5,
  inStock: true,
};

export default function ProductCard() {
  return (
    <Card className="group w-full max-w-96 gap-0 overflow-hidden pt-0 shadow-none">
      <figure className="relative mb-4 aspect-4/3 w-full">
        <Image
          src={productData.image}
          alt={productData.name}
          layout="fill"
          objectFit="cover"
          unoptimized
        />
        <Badge variant="secondary" className="absolute top-3 right-3">
          {productData.category}
        </Badge>

        <div className="absolute right-3 bottom-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button size="icon" variant="outline">
                  <HeartIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add to Wishlist</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Button size="icon" variant="outline">
                  <EyeIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </figure>
      <CardContent className="space-y-4">
        <div>
          <div className="text-2xl font-bold">{productData.name}</div>
          <div className="mt-2 flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`size-4 ${
                  i < Math.floor(productData.rating)
                    ? "fill-current text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
            <span className="text-muted-foreground ml-2 text-xs">
              ({productData.rating})
            </span>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          {productData.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold lg:text-2xl">
            ${productData.price.toFixed(2)}
          </span>
          <Badge variant={productData.inStock ? "outline" : "destructive"}>
            {productData.inStock ? "In Stock" : "Out of Stock"}
          </Badge>
        </div>
        <Button variant="secondary" className="w-full">
          <ShoppingCartIcon /> Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
}
