import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@coreModule/components/uiKit/ui/card";
import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@coreModule/components/uiKit/ui/tooltip";

const products = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&q=80",
    name: "Sports Shoes",
    price: 316,
    sold: 316,
    sales: 10,
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=80&q=80",
    name: "Black T-Shirt",
    price: 274,
    sold: 274,
    sales: 20,
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=80&q=80",
    name: "Jeans",
    price: 195,
    sold: 195,
    sales: 15,
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=80&q=80",
    name: "Red Sneakers",
    price: 402,
    sold: 402,
    sales: 40,
  },
  {
    id: 5,
    image:
      "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=80&q=80",
    name: "Red Scarf",
    price: 280,
    sold: 280,
    sales: 37,
  },
];

export default function CardProductList() {
  return (
    <Card className="relative w-full shadow-none md:w-96">
      <CardHeader>
        <CardTitle>Best Selling Product</CardTitle>
        <CardDescription>Top selling products at a glance</CardDescription>
        <CardAction>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon-sm" variant="outline">
                  <ChevronRightIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View All</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {products.map((product) => (
          <Link
            href="#"
            key={product.name}
            className="hover:bg-muted flex items-center justify-between rounded-md border p-0.5 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Image
                src={product.image}
                width={40}
                height={40}
                className="aspect-square rounded-md object-cover"
                alt="..."
                unoptimized
              />
              <div className="truncate text-sm">{product.name}</div>
            </div>
            <div className="text-sm whitespace-nowrap text-green-600 px-3 py-2">
              {product.sold} units sold
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
