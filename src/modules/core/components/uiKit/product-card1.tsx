import Link from "next/link";
import Image from "next/image";
import { HeartIcon, PlusIcon } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { ButtonGroup } from "@coreModule/components/uiKit/ui/button-group";

const product = {
  name: "Red Hat",
  href: "#",
  image: "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=500",
  price: "$28",
  category: "Clothing",
};

export default function ProductCard() {
  return (
    <div className="group relative w-full max-w-72 space-y-4">
      <Link href={product.href} className="block">
        <figure className="group-hover:opacity-90">
          <Image
            className="aspect-square w-full rounded-lg"
            src={product.image}
            width={300}
            height={500}
            alt={product.name}
            unoptimized
          />
        </figure>
      </Link>
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-medium">{product.name}</h3>
          <p className="text-muted-foreground text-sm">{product.category}</p>
        </div>
        <p className="text-lg font-medium">{product.price}</p>
      </div>
      <ButtonGroup className="w-full">
        <Button variant="outline" size="icon">
          <HeartIcon />
        </Button>
        <Button variant="outline" className="grow">
          <PlusIcon /> Add to Card
        </Button>
      </ButtonGroup>
    </div>
  );
}
