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
import { BagIcon, BeltIcon, HatIcon, JewelryIcon, OtherIcon, SunglassesIcon } from "./icons";

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
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Collections</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="lg:w-[600px grid gap-0 md:w-[400px] lg:grid-cols-2">
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
              <li className="col-start-2 row-span-3 row-start-1">
                <NavigationMenuLink asChild>
                  <Link href="#" className="block space-y-2" onClick={(e) => e.preventDefault()}>
                    <img
                      src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80"
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
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Accessories</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] list-none grid-cols-2 gap-3 lg:w-[300px]">
              {accessoriesMenuItems.map((item, i) => (
                <NavigationMenuLink asChild key={i}>
                  <Link
                    href={`${item.href}`}
                    className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex justify-center gap-2 space-y-1 rounded-md p-3 text-center leading-none no-underline transition-colors outline-none select-none"
                    onClick={(e) => e.preventDefault()}>
                    {item.icon ? (
                      <item.icon className="text-muted-foreground mx-auto size-8" />
                    ) : null}
                    <span className="block text-sm leading-none font-medium">{item.title}</span>
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
  );
}
