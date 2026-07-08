"use client";

import * as React from "react";
import Link from "next/link";
import { HeartIcon, MenuIcon, SearchIcon, ShoppingBag } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@coreModule/components/uiKit/ui/navigation-menu";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Sheet, SheetContent } from "@coreModule/components/uiKit/ui/sheet";
import { Separator } from "@coreModule/components/uiKit/ui/separator";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { BagIcon, JewelryIcon, SunglassesIcon, HatIcon, BeltIcon, OtherIcon } from "./icons";

type ListItemType = {
  title: string;
  href?: string;
  description?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const accessoriesMenuItems: ListItemType[] = [
  {
    title: "Bags",
    href: "#",
    icon: BagIcon
  },
  {
    title: "Jewelry",
    href: "#",
    icon: JewelryIcon
  },
  {
    title: "Sunglasses",
    href: "#",
    icon: SunglassesIcon
  },
  {
    title: "Hats & Beanies",
    href: "#",
    icon: HatIcon
  },
  {
    title: "Belts",
    href: "#",
    icon: BeltIcon
  },
  {
    title: "All  Accessories",
    href: "#",
    icon: OtherIcon
  }
];

const collectionItems = [
  {
    title: "Trends",
    href: "#",
    description: "Discover this summer's trendy products."
  },
  {
    title: "Best Sellers",
    href: "#",
    description: "We've collected the best-selling products for you."
  },
  {
    title: "New Arrivals",
    href: "#",
    description: "Discover the most favorited products."
  }
];

export default function NavigationMenuDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <header>
        <div className="flex grid-cols-3 items-center justify-between p-4">
          {/* left content and log */}
          <Link href="/" className="flex items-center gap-2">
            <img
              className="size-6 rounded-md"
              src="https://shadcnuikit.com/logo.png"
              alt="svg logo"
            />
            <span className="text-base font-medium">Shadcn UI Kit</span>
          </Link>

          {/* main navigation */}
          <NavigationMenu className="hidden lg:block">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Collections</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-0 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          href="#"
                          className="block space-y-2"
                          onClick={(e) => e.preventDefault()}>
                          <img
                            src="https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?q=80&w=300&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="..."
                            className="aspect-4/3 w-96 rounded object-cover"
                          />
                          <div className="space-y-1">
                            <div className="text-sm leading-none font-medium">
                              Timeless Classics
                            </div>
                            <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                              Elevate your style with essentials
                            </p>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    {collectionItems.map((item, i) => (
                      <Link
                        key={i}
                        href={`${item.href}`}
                        className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground gap-2 space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                        onClick={(e) => e.preventDefault()}>
                        <div className="text-sm leading-none font-medium">{item.title}</div>
                        <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                          {item.description}
                        </p>
                      </Link>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Accessories</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] list-none grid-cols-2 gap-3 lg:w-[300px]">
                    {accessoriesMenuItems.map((item, i) => (
                      <NavigationMenuLink key={i} asChild>
                        <Link
                          href={`${item.href}`}
                          className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex justify-center gap-2 space-y-1 rounded-md p-3 text-center leading-none no-underline transition-colors outline-none select-none"
                          onClick={(e) => e.preventDefault()}>
                          {item.icon ? (
                            <item.icon className="text-muted-foreground mx-auto size-8" />
                          ) : null}
                          <span className="block text-sm leading-none font-medium">
                            {item.title}
                          </span>
                        </Link>
                      </NavigationMenuLink>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="#"
                    className={navigationMenuTriggerStyle()}
                    onClick={(e) => e.preventDefault()}>
                    Women
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="#"
                    className={navigationMenuTriggerStyle()}
                    onClick={(e) => e.preventDefault()}>
                    Men
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* right content */}
          <div className="flex items-center gap-1">
            <Button variant="ghost">
              <SearchIcon />
            </Button>
            <Button variant="ghost">
              <HeartIcon />
            </Button>
            <Button variant="ghost" size="icon" className="relative" aria-label="Cart">
              <ShoppingBag aria-hidden="true" />
              <Badge className="absolute -top-1 left-full size-4 -translate-x-1/2 rounded-full p-0 text-[10px]">
                4
              </Badge>
            </Button>
            <div className="ms-3 flex items-center gap-1">
              <Button variant="secondary">Sign in</Button>
              <Button variant="ghost" onClick={() => setOpen(true)} className="lg:hidden">
                <MenuIcon />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* for mobile navigation */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="space-y-4 overflow-auto p-4">
          <div className="space-y-2">
            <div className="font-medium">Collections</div>
            <ul className="space-y-4">
              <li>
                <Link
                  href="#"
                  className="block space-y-2 rounded-md border p-3"
                  onClick={(e) => e.preventDefault()}>
                  <img
                    src="https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?q=80&w=300&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="..."
                    className="aspect-4/3 w-96 rounded object-cover"
                  />
                  <div className="space-y-1">
                    <div className="text-sm leading-none font-medium">Timeless Classics</div>
                    <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                      Elevate your style with essentials
                    </p>
                  </div>
                </Link>
              </li>
              {collectionItems.map((item, i) => (
                <li key={i}>
                  <Link
                    href={`${item.href}`}
                    className="block gap-2 space-y-1 leading-none no-underline outline-none"
                    onClick={(e) => e.preventDefault()}>
                    <div className="text-sm leading-none font-medium">{item.title}</div>
                    <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                      {item.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="font-medium">Accessories</div>
            <ul className="grid list-none grid-cols-2 gap-2">
              {accessoriesMenuItems.map((item, i) => (
                <Link
                  key={i}
                  href={`${item.href}`}
                  className="bg-muted/50 flex flex-col justify-center gap-2 space-y-1 rounded-md p-3 text-center leading-none no-underline transition-colors"
                  onClick={(e) => e.preventDefault()}>
                  {item.icon ? (
                    <item.icon className="text-muted-foreground mx-auto size-8" />
                  ) : null}
                  <span className="block text-sm leading-none font-medium">{item.title}</span>
                </Link>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <Link
              href="#"
              className="bg-muted/50 flex flex-col justify-center gap-2 space-y-1 rounded-md p-3 text-center leading-none no-underline transition-colors">
              Men
            </Link>

            <Link
              href="#"
              className="bg-muted/50 flex flex-col justify-center gap-2 space-y-1 rounded-md p-3 text-center leading-none no-underline transition-colors">
              Women
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      {/* fake content */}
      <main className="bg-muted/50 min-h-[500px]"></main>
    </>
  );
}
