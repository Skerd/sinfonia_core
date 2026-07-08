import Link from "next/link";
import Image from "next/image";
import { HeartIcon, PlusIcon } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Card, CardContent, CardFooter } from "@coreModule/components/uiKit/ui/card";

const productData = {
  name: "Red Hat",
  href: "#",
  image: "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=500",
  price: "$28",
  category: "Clothing"
};

export default function ProductCard() {
  return (
    <Card className="relative gap-0 space-y-4 overflow-hidden p-0 w-full max-w-72 shadow-none">
      <Link href={productData.href} className="block">
        <figure>
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute end-3 top-3 rounded-full bg-white/70 dark:text-black">
            <HeartIcon className="size-4" />
          </Button>
          <Image
            className="aspect-square w-full"
            src={productData.image}
            width={300}
            height={500}
            alt={productData.name}
            unoptimized
          />
        </figure>
      </Link>
      <CardContent>
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-medium">{productData.name}</h3>
            <p className="text-muted-foreground text-sm">{productData.category}</p>
          </div>
          <p className="text-lg font-medium">{productData.price}</p>
        </div>
      </CardContent>
      <CardFooter className="border-t p-0!">
        <Button variant="ghost" className="w-full">
          <PlusIcon /> Add to Card
        </Button>
      </CardFooter>
    </Card>
  );
}
