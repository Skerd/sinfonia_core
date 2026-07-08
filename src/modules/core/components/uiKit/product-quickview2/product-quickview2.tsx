"use client";

import { ProductQuickviewDialog } from "./product-quickview-modal";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@coreModule/components/uiKit/ui/button";

const productData = {
  id: "1",
  title: "Skater Jeans",
  description:
    "This theme is designed to make your online store look stylish and professional while offering your customers an exceptional user experience.",
  old_price: "$49",
  price: "$39",
  rating: 4,
  reviewCount: 117,
  image:
    "https://images.unsplash.com/photo-1627225924765-552d49cf47ad?q=80&w=700&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  colors: [
    { name: "White", value: "#FFFFFF" },
    { name: "Gray", value: "#9CA3AF" },
    { name: "Crimson", value: "crimson" },
    { name: "Navy", value: "#1E293B" }
  ],
  sizes: [
    { name: "XS", available: true },
    { name: "S", available: true },
    { name: "M", available: true }
  ]
};

export default function Page() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <div className="mx-auto h-[900px] max-w-80 py-24">
        <Link href="#" className="group">
          <figure className="relative aspect-square w-full overflow-hidden rounded-md object-cover">
            <Image
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105 group-hover:rotate-2"
              src={productData.image}
              alt={productData.title}
            />
          </figure>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-1">
              <p className="font-medium">{productData.title}</p>
              <p className="text-muted-foreground">{productData.price}</p>
            </div>
          </div>
          <Button onClick={() => setOpen(true)} variant="secondary" className="mt-4 w-full">
            Quick View
          </Button>
        </Link>
      </div>
      <ProductQuickviewDialog open={open} onOpenChange={setOpen} product={productData} />
    </>
  );
}
