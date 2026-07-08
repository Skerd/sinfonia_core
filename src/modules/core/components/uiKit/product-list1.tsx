import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";

const products = [
  {
    id: 1,
    name: "Sweat polar",
    href: "#",
    imageSrc: "/images/products/01.jpeg",
    imageAlt: "Front of men's Basic Tee in black.",
    price: "$35",
    color: "Black",
  },
  {
    id: 2,
    name: "T-shirt",
    href: "#",
    imageSrc: "/images/products/02.jpeg",
    imageAlt: "Front of men's Basic Tee in black.",
    price: "$28",
    color: "Aspen White",
  },
  {
    id: 3,
    name: "T-shirt",
    href: "#",
    imageSrc: "/images/products/03.jpeg",
    imageAlt: "Front of men's Basic Tee in black.",
    price: "$40",
    color: "Charcoal",
  },
  {
    id: 4,
    name: "Red Hat",
    href: "#",
    imageSrc: "/images/products/04.jpeg",
    imageAlt: "Front of men's Basic Tee in black.",
    price: "$49",
    color: "Iso Dots",
  },
];

export default function ProductList() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20 lg:max-w-7xl lg:px-8">
      <div className="mb-6 flex justify-between">
        <h2 className="text-2xl font-bold">New Season Products</h2>
        <Button variant="link" className="px-0!" asChild>
          <Link href="#">
            See all products <ChevronRight />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="group relative space-y-4">
            <figure className="w-full overflow-hidden rounded-md group-hover:opacity-75">
              <Image
                alt={product.imageAlt}
                src={product.imageSrc}
                width={300}
                height={300}
                className="aspect-3/4 w-full object-cover"
                unoptimized
              />
            </figure>
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium">
                  <a href={product.href}>
                    <span aria-hidden="true" className="absolute inset-0" />
                    {product.name}
                  </a>
                </h3>
                <p className="text-muted-foreground text-sm">{product.color}</p>
              </div>
              <p className="font-medium">{product.price}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
