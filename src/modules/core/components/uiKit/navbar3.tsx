"use client";

import { Menu, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@coreModule/components/uiKit/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@coreModule/components/uiKit/ui/sheet";
import { Badge } from "@coreModule/components/uiKit/ui/badge";

const categories: { title: string; href: string; description: string }[] = [
  {
    title: "Men",
    href: "/category/men",
    description: "Apparel, shoes, and accessories for men."
  },
  {
    title: "Women",
    href: "/category/women",
    description: "Stylish and comfortable fashion for women."
  },
  {
    title: "Kids",
    href: "/category/kids",
    description: "Fun and functional outfits for kids of all ages."
  },
  {
    title: "Home & Living",
    href: "/category/home",
    description: "Decor, kitchenware, and lifestyle products."
  },
  {
    title: "Beauty",
    href: "/category/beauty",
    description: "Skin care, cosmetics, and grooming essentials."
  },
  {
    title: "Electronics",
    href: "/category/electronics",
    description: "Gadgets, accessories, and smart devices."
  }
];

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href}>
          <div className="mb-1 text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">{children}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="flex h-16 w-full items-center justify-between border-b p-4">
      <div className="flex items-center">
        <Link href="/" className="text-foreground text-xl font-bold">
          Logo
        </Link>
      </div>

      <div className="hidden md:flex">
        <NavigationMenu viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Shop</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <Link
                        className="flex h-full w-full flex-col justify-end rounded-md bg-[url('/images/products/01.jpeg')] bg-cover p-0! no-underline outline-hidden select-none focus:shadow-md"
                        href="/">
                        <div className="bg-foreground/30 space-y-2 p-4 text-white backdrop-blur-md">
                          <div className="font-medium">New Arrivals</div>
                          <p className="text-sm leading-tight">
                            Discover the styles in our latest collection.
                          </p>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <ListItem href="#" title="Summer Collection">
                    Lightweight essentials perfect for the warm season.
                  </ListItem>
                  <ListItem href="#" title="Accessories">
                    Complete your look with our stylish bags, jewelry, and more.
                  </ListItem>
                  <ListItem href="#" title="Sale">
                    Shop discounted items before they&#39;re gone.
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-2 md:grid-cols-2 lg:w-[550px]">
                  {categories.map((category) => (
                    <ListItem key={category.title} title={category.title} href={category.href}>
                      {category.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Quick Links</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[300px] gap-4">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="#">
                        <div className="font-medium">All Products</div>
                        <div className="text-muted-foreground">
                          Browse our full product catalog.
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="#">
                        <div className="font-medium">FAQs</div>
                        <div className="text-muted-foreground">Answers to common questions.</div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="#">
                        <div className="font-medium">Blog</div>
                        <div className="text-muted-foreground">
                          Get inspired by our latest posts.
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="#">Support</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" className="relative" aria-label="Cart">
          <ShoppingBasket aria-hidden="true" />
          <Badge className="absolute -end-2 -top-2.5 size-5 rounded-full">5</Badge>
        </Button>
        <div className="hidden items-center space-x-4 md:flex">
          <Button size="sm">Sign In</Button>
        </div>

        {/* Mobile Menu Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-4">
            <Link href="/" className="text-foreground block text-xl font-bold">
              Logo
            </Link>

            <div className="grow space-y-6 overflow-y-auto">
              <ul className="grid gap-4">
                <li className="row-span-3">
                  <Link
                    className="flex aspect-square w-full flex-col justify-end rounded-md bg-[url('/images/products/01.jpeg')] bg-cover p-0! no-underline outline-hidden select-none focus:shadow-md"
                    href="/">
                    <div className="bg-foreground/30 space-y-2 p-4 text-white backdrop-blur-md">
                      <div className="font-medium">New Arrivals</div>
                      <p className="text-sm leading-tight">
                        Discover the styles in our latest collection.
                      </p>
                    </div>
                  </Link>
                </li>
                <Link href="#">
                  <div className="mb-1 text-sm leading-none font-medium">Summer Collection</div>
                  <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                    Lightweight essentials perfect for the warm season.
                  </p>
                </Link>
                <Link href="#">
                  <div className="mb-1 text-sm leading-none font-medium">Accessories</div>
                  <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                    Complete your look with our stylish bags, jewelry, and more.
                  </p>
                </Link>
                <Link href="#">
                  <div className="mb-1 text-sm leading-none font-medium">Sale</div>
                  <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                    {" "}
                    Shop discounted items before they&#39;re gone.
                  </p>
                </Link>
              </ul>

              <div className="flex flex-col space-y-2">
                <span className="text-muted-foreground py-2 font-medium">Categories</span>
                <ul className="grid gap-4 md:grid-cols-2">
                  {categories.map((category) => (
                    <Link href={category.href} key={category.title}>
                      <div className="mb-1 text-sm leading-none font-medium">{category.title}</div>
                      <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                        {category.description}
                      </p>
                    </Link>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex flex-col space-y-3">
              <Button onClick={() => setIsOpen(false)}>Sign In</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
