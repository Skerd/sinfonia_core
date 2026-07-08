import Image from "next/image";
import Link from "next/link";
import { Star, HeartIcon, ShoppingCartIcon } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";

export default function ProductDetail() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20 lg:max-w-7xl lg:px-8">
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-8">
        <figure className="mx-auto shrink-0">
          <Image
            src="/images/products/01.jpeg"
            alt="..."
            width={800}
            height={600}
            className="w-full rounded-lg"
            unoptimized
          />
        </figure>

        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-2xl leading-tight font-bold md:text-3xl">
              BreezyMove Comfortable & Stylish Sweetsh
            </h1>

            <div className="sm:flex sm:items-center sm:gap-4">
              <p className="text-xl font-medium sm:text-2xl">$249.99</p>
              <div className="mt-2 flex items-center gap-2 sm:mt-0">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="size-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm">(5.0)</p>
                <Link href="#" className="text-sm hover:underline">
                  345 Reviews
                </Link>
              </div>
            </div>

            <div className="flex gap-2">
              <Button>
                <ShoppingCartIcon />
                Add to Cart
              </Button>
              <Button variant="outline" size="icon">
                <HeartIcon />
              </Button>
            </div>
          </div>

          <div className="prose dark:prose-invert space-y-4">
            <p>
              Experience ultimate comfort and style with the ComfortFit Unisex
              Sweetshort! Crafted from 100% breathable cotton, this lightweight
              design keeps you feeling fresh all day long. The adjustable
              elastic waistband and sleek fit make it perfect for both active
              days and laid-back lounging. Whether you`re hitting the gym or
              enjoying a casual outing, ComfortFit Sweetshort is your go-to
              choice for effortless style and comfort!
            </p>
            <h4>Key Features</h4>
            <ul>
              <li>Made from 100% breathable cotton</li>
              <li>Adjustable elastic waistband for a perfect fit</li>
              <li>Spacious side pockets</li>
              <li>Unisex design suitable for everyone</li>
              <li>Ideal for daily wear and athletic activities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
