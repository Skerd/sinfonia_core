"use client";

import Link from "next/link";
import { AlignJustify } from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@coreModule/components/uiKit/ui/sheet";
import { cn } from "@coreModule/components/lib/utils";
import Image from "next/image";
import {
  NavigationMenu,
  NavigationMenuLink,
  NavigationMenuItem,
  NavigationMenuList,
} from "@coreModule/components/uiKit/ui/navigation-menu";
import { Badge } from "@coreModule/components/uiKit/ui/badge";

const NAV_LINKS = [
  { label: "Home", href: "#" },
  { label: "How it works", href: "#" },
  { label: "Features", href: "#" },
  { label: "Integrations", href: "#" },
];

const STATS = [
  { value: "10+", label: "Years Experience" },
  { value: "890", label: "Cases Solved" },
  { value: "250", label: "Business Partners" },
];

const IMAGES = [
  {
    src: "https://readymadeui.com/images/face-primer-category.webp",
    alt: "Face primer category",
  },
  { src: "https://readymadeui.com/images/product6.webp", alt: "Product" },
  { src: "https://readymadeui.com/images/product2.webp", alt: "Product" },
  {
    src: "https://readymadeui.com/images/skin-glow-category.webp",
    alt: "Skin glow category",
  },
];

export default function HeroSection() {
  return (
    <>
      <header className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4">
        <nav className="flex w-full items-center justify-between py-4">
          <Link href="#" className="shrink-0">
            <Image
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMCIgd2lkdGg9IjMwMC4wMDAwMDBwdCIgaGVpZ2h0PSIzMDAuMDAwMDAwcHQiIHZpZXdCb3g9IjAgMCAzMDAuMDAwMDAwIDMwMC4wMDAwMDAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiPgoKPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4wMDAwMDAsMzAwLjAwMDAwMCkgc2NhbGUoMC4xMDAwMDAsLTAuMTAwMDAwKSIgZmlsbD0iIzAwMDAwMCIgc3Ryb2tlPSJub25lIj4KPHBhdGggZD0iTTAgMTUwMCBsMCAtMTUwMCAxNTAwIDAgMTUwMCAwIDAgMTUwMCAwIDE1MDAgLTE1MDAgMCAtMTUwMCAwIDAgLTE1MDB6IG02NDcgMTA2MCBjMzEgLTEyIDE4ODIgLTE4NTYgMTkxNCAtMTkwOCA1NCAtODUgMSAtMjA5IC05NyAtMjI4IC05MSAtMTcgLTMwIC03MSAtMTA1NyA5NTQgLTUzNyA1MzcgLTk1NCA5NjIgLTk2MyA5ODEgLTU2IDExNyA3NiAyNDggMjAzIDIwMXogbTg0NSAtMyBjMTUgLTcgMjYzIC0yNDcgNTUyIC01MzQgNDUxIC00NDkgNTI3IC01MjggNTM2IC01NjMgMTYgLTU4IC0xIC0xMTAgLTUwIC0xNTQgLTM1IC0zMSAtNDcgLTM2IC05MSAtMzYgLTI3IDAgLTYyIDYgLTc3IDE0IC0xNSA4IC0yNjMgMjUxIC01NTEgNTQwIGwtNTI1IDUyNSAtNCA1OCBjLTMgNDkgMCA2NCAyMCA5MyA0MSA2MiAxMjQgODYgMTkwIDU3eiBtODU2IC0xIGMxNSAtOCA3MCAtNTkgMTIzIC0xMTMgMTE2IC0xMTggMTMzIC0xNTQgMTA0IC0yMjkgLTMxIC04MCAtMTM2IC0xMjggLTIwMyAtOTEgLTQ5IDI4IC0yMTIgMTkxIC0yMzMgMjMzIC0zNCA3MiAtOCAxNTEgNjUgMTk1IDM3IDIyIDEwNiAyNSAxNDQgNXogbS0xNjgzIC04NTcgYzE3IC0xMCAyNjIgLTI1MSA1NDcgLTUzNiA1NDggLTU1MCA1MzkgLTUzOSA1MjQgLTYxOCAtMTggLTk2IC0xNDEgLTE1NSAtMjIxIC0xMDcgLTE2IDExIC0yNjUgMjUyIC01NTIgNTM4IC00NjUgNDYxIC01MjMgNTIzIC01MjkgNTU3IC0xNCA4MiAyNyAxNTYgMTAxIDE4MiA0NSAxNiA4NiAxMSAxMzAgLTE2eiBtLTI4IC04MzAgYzMyIC0xMiAyMTggLTE5MSAyMzkgLTIzMSAzMSAtNTkgOSAtMTQ2IC00NyAtMTg3IC0zNSAtMjYgLTkzIC0zNyAtMTM2IC0yNiAtMzAgNyAtMjI2IDE5NCAtMjQ5IDIzNyAtNjAgMTE1IDY5IDI1NCAxOTMgMjA3eiIvPgo8L2c+Cjwvc3ZnPg=="
              alt="Logo"
              className="rounded-md"
              width={32}
              height={32}
            />
            <span className="sr-only">Shadcn UI Kit</span>
          </Link>

          <NavigationMenu
            viewport={false}
            className="hidden max-w-none flex-1 justify-center md:flex"
          >
            <NavigationMenuList className="gap-6 text-sm font-medium">
              {NAV_LINKS.map(({ label, href }) => (
                <NavigationMenuItem key={label}>
                  <NavigationMenuLink asChild>
                    <Link href={href}>{label}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-1">
            <Button variant="ghost" className="rounded-full" size="lg" asChild>
              <Link href="#">Login</Link>
            </Button>
            <Button
              variant="secondary"
              className="rounded-full"
              size="lg"
              asChild
            >
              <Link href="#">Get Started</Link>
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                >
                  <AlignJustify className="size-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex h-full w-full flex-col justify-center gap-6 p-4 text-left text-lg backdrop-blur md:w-[320px]">
                  {NAV_LINKS.map(({ label, href }) => (
                    <SheetClose key={label} asChild>
                      <Link href={href} className="font-medium">
                        {label}
                      </Link>
                    </SheetClose>
                  ))}
                  <Button asChild variant="outline" className="rounded-full">
                    <Link href="#">Get Started</Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-14 lg:py-32">
        <div className="grid items-center justify-center gap-x-12 gap-y-16 lg:grid-cols-2">
          <div className="text-center lg:text-start">
            <Badge
              variant="outline"
              className="mb-2 font-medium tracking-tight text-indigo-600 uppercase"
            >
              <span className="mr-1 inline-block size-2 bg-indigo-600" />
              Built to Grow with You
            </Badge>
            <h1 className="text-4xl leading-tight font-bold text-balance md:text-5xl">
              Empower Brand with Human-Centered Solutions
            </h1>
            <p className="text-muted-foreground mt-6 text-base leading-relaxed text-balance">
              Showcase your products and connect with your audience. Our
              all-in-one platform helps you manage operations and boost
              visibility — whether you&apos;re in fashion, beauty, wellness, or
              beyond.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 max-lg:justify-center">
              <Button asChild size="lg">
                <Link href="#">Get Started Free</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="#">Explore Features</Link>
              </Button>
            </div>

            <div className="mt-12">
              <div className="grid grid-cols-3 gap-x-4 gap-y-4">
                {STATS.map(({ value, label }) => (
                  <div key={label} className="flex flex-col">
                    <h5 className="mb-2 text-2xl font-bold text-indigo-600">
                      {value}
                    </h5>
                    <p className="text-muted-foreground text-sm md:text-base">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="columns-2 space-y-4">
            {IMAGES.map(({ src, alt }, i) => (
              <div
                key={i}
                className={cn("break-inside-avoid", {
                  "lg:pt-14": i === 2,
                })}
              >
                <img
                  src={src}
                  alt={alt}
                  className={cn(
                    "h-full max-h-[300px] w-full object-cover object-top",
                    {
                      "rounded-tl-2xl rounded-tr-2xl": i === 0 || i === 2,
                      "rounded-br-2xl rounded-bl-2xl": i === 1 || i === 3,
                    },
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
