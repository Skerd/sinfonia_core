"use client";

import Link from "next/link";
import { AlignJustify, Plus, Send } from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Textarea } from "@coreModule/components/uiKit/ui/textarea";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@coreModule/components/uiKit/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@coreModule/components/uiKit/ui/navigation-menu";
import Image from "next/image";

const NAV_LINKS = [
  { label: "Product", href: "#" },
  { label: "Use cases", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Templates", href: "#" },
];

const SUGGESTIONS = [
  "SaaS finance dashboard layout.",
  "Marketing site for an AI startup.",
  "Mobile UI for a fitness app.",
  "Dark mode landing for an agency.",
];

export default function HeroSection() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-between bg-[radial-gradient(125%_125%_at_50%_90%,#ffffff_40%,var(--color-purple-200)_100%)] bg-cover bg-center text-center text-sm max-md:px-4 dark:bg-[radial-gradient(125%_125%_at_50%_90%,var(--color-background)_40%,var(--color-purple-800)_100%)]">
      <nav className="flex w-full items-center justify-between py-4 md:px-16 lg:px-24 xl:px-32">
        <Link href="#" className="shrink-0">
          <Image
            src="/logo.svg"
            alt="shadcn ui kit svg logo"
            width={40}
            height={40}
            className="size-7 rounded-sm"
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

        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-full" size="lg" asChild>
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

      <div className="flex w-full max-w-xl flex-1 flex-col items-center justify-center space-y-4">
        <header className="space-y-3">
          <h1 className="text-3xl leading-tight font-bold lg:text-4xl">Design interfaces with AI.</h1>
          <p className="text-muted-foreground text-base">
            Turn a short prompt into polished, production-ready layouts in
            seconds.
          </p>
        </header>
        <div className="bg-muted mt-4 w-full space-y-4 overflow-hidden rounded-xl focus-within:ring-2 focus-within:ring-white/40">
          <Textarea
            placeholder="Describe the interface you want to design"
            rows={3}
            className="min-h-16 resize-none border-0 bg-transparent! p-4 pb-0 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center justify-between px-3 pb-3">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Add"
              className="rounded-full"
            >
              <Plus />
            </Button>
            <Button size="icon-sm" aria-label="Send" className="rounded-full">
              <Send />
            </Button>
          </div>
        </div>

        <div className="grid w-full gap-2 md:mt-4 md:grid-cols-2 md:gap-3">
          {SUGGESTIONS.map((text, i) => (
            <Link
              key={i}
              href="#"
              className="hover:text-primary hover:bg-accent/50 block rounded-full border p-2 text-sm"
            >
              {text}
            </Link>
          ))}
        </div>
      </div>

      <p className="text-muted-foreground pb-3 text-xs">
        By messaging us, you agree to our{" "}
        <Link href="#" className="hover:text-primary underline">
          Terms of Use
        </Link>{" "}
        and confirm you&apos;ve read our{" "}
        <Link href="#" className="hover:text-primary underline">
          Privacy Policy
        </Link>
        .
      </p>
    </section>
  );
}
