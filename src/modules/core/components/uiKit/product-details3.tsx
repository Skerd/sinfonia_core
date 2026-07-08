"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, Minus, Plus, ChevronDown } from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@coreModule/components/uiKit/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@coreModule/components/uiKit/ui/collapsible";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@coreModule/components/uiKit/ui/breadcrumb";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@coreModule/components/uiKit/ui/input-group";

export default function ProductDetail() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState("Black");
  const [quantity, setQuantity] = useState(1);
  const [openSections, setOpenSections] = useState({
    details: false,
    shipping: false,
    returns: false,
  });

  const images = [
    "/images/products/01.jpeg",
    "/images/products/02.jpeg",
    "/images/products/03.jpeg",
  ];

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const incrementQuantity = () => setQuantity((prev) => prev + 1);
  const decrementQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="#" prefetch={false}>
                Shop all
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="#" prefetch={false}>
                Clothing
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Classic Cotton T-Shirt</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative aspect-square h-130 w-full overflow-hidden rounded-lg border">
            <Image
              src={images[selectedImage]}
              fill
              className="h-full w-full object-cover"
              alt="..."
              unoptimized
            />
          </div>

          <div className="flex flex-wrap gap-4 lg:flex-col">
            {images.map((image, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={() => setSelectedImage(index)}
                className={`relative size-16 overflow-hidden rounded-lg p-0 lg:size-20 ${
                  selectedImage === index ? "ring-2" : "ring-0"
                }`}
              >
                <Image
                  src={image}
                  className="h-full w-full object-cover"
                  fill
                  alt="..."
                  unoptimized
                />
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="mb-2 text-3xl font-bold">Classic Cotton T-Shirt</h1>
            <p className="text-muted-foreground mb-4 text-xl font-semibold">
              $55
            </p>

            {/* Rating */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`size-4 ${
                      star <= 3
                        ? "fill-yellow-400 text-yellow-400"
                        : star === 4
                          ? "fill-yellow-400/50 text-yellow-400"
                          : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground text-sm hover:underline"
              >
                (3.5 stars) • 10 reviews
              </Link>
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">
              Made from 100% premium cotton, this classic t-shirt offers
              exceptional comfort and durability. Features a relaxed fit,
              reinforced seams, and pre-shrunk fabric. Perfect for everyday wear
              or layering. The soft, breathable material keeps you comfortable
              all day long.
            </p>
          </div>

          {/* Variant Selection */}
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Size</label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="xlarge">X-Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Color
              </label>
              <div className="flex gap-2">
                {["Black", "White", "Navy"].map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedVariant(option)}
                    className={`rounded-md border px-4 py-2 text-sm font-medium ${
                      selectedVariant === option
                        ? "border-primary bg-primary text-white dark:text-black"
                        : "hover:bg-muted border"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="mb-2 block text-sm font-medium">Quantity</label>
            <InputGroup className="w-fit h-auto">
              <InputGroupAddon align="inline-start">
                <InputGroupButton
                  size="icon-sm"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus />
                </InputGroupButton>
              </InputGroupAddon>
              <InputGroupInput
                readOnly
                tabIndex={-1}
                value={String(quantity)}
                aria-label="Quantity"
                className="w-12 text-center"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-sm"
                  onClick={incrementQuantity}
                  aria-label="Increase quantity"
                >
                  <Plus />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>

          {/* Action Buttons */}
          <div>
            <div className="flex gap-2 space-y-3">
              <Button className="grow">Add To Cart</Button>
              <Button className="grow" variant="outline">
                Buy Now
              </Button>
            </div>
            <p className="text-muted-foreground text-center text-sm">
              Free shipping over $50
            </p>
          </div>

          {/* Collapsible Sections */}
          <div className="space-y-4 pt-6">
            <Collapsible
              open={openSections.details}
              onOpenChange={() => toggleSection("details")}
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between py-3 text-left">
                <span className="font-medium">Details</span>
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${openSections.details ? "rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-3">
                <div className="text-muted-foreground space-y-2 text-sm">
                  <p>• 100% premium cotton construction</p>
                  <p>• Pre-shrunk fabric to maintain fit</p>
                  <p>• Reinforced shoulder seams for durability</p>
                  <p>• Tagless label for comfort</p>
                  <p>• Machine wash cold, tumble dry low</p>
                  <p>• Available in sizes S-XL</p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible
              open={openSections.shipping}
              onOpenChange={() => toggleSection("shipping")}
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between border-t py-3 text-left">
                <span className="font-medium">Shipping</span>
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${openSections.shipping ? "rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-3">
                <div className="text-muted-foreground space-y-2 text-sm">
                  <p>• Free shipping on orders over $50</p>
                  <p>• Standard shipping: 5-7 business days</p>
                  <p>• Express shipping: 2-3 business days</p>
                  <p>• International shipping available</p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible
              open={openSections.returns}
              onOpenChange={() => toggleSection("returns")}
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between border-t py-3 text-left">
                <span className="font-medium">Returns</span>
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${openSections.returns ? "rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-3">
                <div className="text-muted-foreground space-y-2 text-sm">
                  <p>• 30-day return policy</p>
                  <p>• Items must be in original condition</p>
                  <p>• Free return shipping for defective items</p>
                  <p>• Refunds processed within 5-10 business days</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
}
