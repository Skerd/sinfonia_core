"use client";

import Image from "next/image";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Heart, ShoppingCart } from "lucide-react";
import { useState } from "react";

interface ProductCardProps {
  id: string;
  image: string;
  title: string;
  price: number;
  onAddToCart?: () => void;
  onToggleFavorite?: () => void;
}

const products = [
  {
    id: "1",
    image: "/images/products/01.jpeg",
    title: "Premium Wireless Headphones",
    price: 149.99,
  },
  {
    id: "2",
    image: "/images/products/02.jpeg",
    title: "Smart Watch Pro",
    price: 299.99,
  },
  {
    id: "3",
    image: "/images/products/03.jpeg",
    title: "Professional Camera Lens",
    price: 599.99,
  },
  {
    id: "4",
    image: "/images/products/04.jpeg",
    title: "Mechanical Gaming Keyboard",
    price: 179.99,
  },
];

export default function ProductList() {
  const handleAddToCart = (productId: string) => {
    console.log(`Added product ${productId} to cart`);
  };

  const handleToggleFavorite = (productId: string) => {
    console.log(`Toggled favorite for product ${productId}`);
  };

  return (
    <section className="py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl px-4">
        <header className="mb-12">
          <h2 className="text-foreground mb-2 text-3xl font-bold">
            Featured Products
          </h2>
          <p className="text-muted-foreground">
            Discover our collection of premium electronics and accessories
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              image={product.image}
              title={product.title}
              price={product.price}
              onAddToCart={() => handleAddToCart(product.id)}
              onToggleFavorite={() => handleToggleFavorite(product.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({
  id,
  image,
  title,
  price,
  onAddToCart,
  onToggleFavorite,
}: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    onToggleFavorite?.();
  };

  const handleAddToCart = () => {
    setIsAddingToCart(true);
    onAddToCart?.();
    setTimeout(() => setIsAddingToCart(false), 500);
  };

  return (
    <div className="border-border bg-card w-full overflow-hidden rounded-lg border">
      <div className="bg-muted relative aspect-square overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <Button
          onClick={handleToggleFavorite}
          size="icon"
          className="bg-background/80 hover:bg-background absolute top-3 right-3 rounded-full"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            size={20}
            className={`transition-all ${
              isFavorite
                ? "fill-destructive text-destructive"
                : "text-muted-foreground hover:text-foreground"
            }`}
          />
        </Button>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <h5 className="text-card-foreground line-clamp-2 text-lg text-balance">
          {title}
        </h5>
        <div className="text-foreground text-xl font-semibold">
          ${price.toFixed(2)}
        </div>
        <Button
          variant="secondary"
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          className="w-full gap-2"
        >
          <ShoppingCart size={18} />
          {isAddingToCart ? "Adding..." : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
}
