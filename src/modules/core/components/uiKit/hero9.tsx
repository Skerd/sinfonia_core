"use client";

import { useState } from "react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@coreModule/components/uiKit/ui/navigation-menu";
import { Calendar } from "@coreModule/components/uiKit/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@coreModule/components/uiKit/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@coreModule/components/uiKit/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@coreModule/components/uiKit/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@coreModule/components/uiKit/ui/select";

const NAV_ITEMS = [
  { label: "Home", href: "#" },
  { label: "About us", href: "#" },
  {
    label: "Products",
    items: [
      { label: "Luxury suites", href: "#" },
      { label: "Beachfront villas", href: "#" },
      { label: "City escapes", href: "#" },
    ],
  },
  {
    label: "Features",
    items: [
      { label: "Concierge service", href: "#" },
      { label: "Private transfers", href: "#" },
      { label: "Premium experiences", href: "#" },
    ],
  },
];

function formatDate(date?: Date) {
  if (!date) return "Select date";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function HeroSection() {
  const [checkIn, setCheckIn] = useState<Date | undefined>(new Date());
  const [checkOut, setCheckOut] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d;
  });
  const [guests, setGuests] = useState("2");
  const [openCheckIn, setOpenCheckIn] = useState(false);
  const [openCheckOut, setOpenCheckOut] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minCheckOut = checkIn && checkIn > today ? checkIn : today;

  return (
    <>
      <header className="relative z-10">
        <nav className="container mx-auto flex items-center justify-between px-4 py-6 md:px-6">
          <Link href="#" className="flex shrink-0 items-center gap-2">
            <Image
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMCIgd2lkdGg9IjMwMC4wMDAwMDBwdCIgaGVpZ2h0PSIzMDAuMDAwMDAwcHQiIHZpZXdCb3g9IjAgMCAzMDAuMDAwMDAwIDMwMC4wMDAwMDAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiPgoKPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4wMDAwMDAsMzAwLjAwMDAwMCkgc2NhbGUoMC4xMDAwMDAsLTAuMTAwMDAwKSIgZmlsbD0iIzAwMDAwMCIgc3Ryb2tlPSJub25lIj4KPHBhdGggZD0iTTAgMTUwMCBsMCAtMTUwMCAxNTAwIDAgMTUwMCAwIDAgMTUwMCAwIDE1MDAgLTE1MDAgMCAtMTUwMCAwIDAgLTE1MDB6IG02NDcgMTA2MCBjMzEgLTEyIDE4ODIgLTE4NTYgMTkxNCAtMTkwOCA1NCAtODUgMSAtMjA5IC05NyAtMjI4IC05MSAtMTcgLTMwIC03MSAtMTA1NyA5NTQgLTUzNyA1MzcgLTk1NCA5NjIgLTk2MyA5ODEgLTU2IDExNyA3NiAyNDggMjAzIDIwMXogbTg0NSAtMyBjMTUgLTcgMjYzIC0yNDcgNTUyIC01MzQgNDUxIC00NDkgNTI3IC01MjggNTM2IC01NjMgMTYgLTU4IC0xIC0xMTAgLTUwIC0xNTQgLTM1IC0zMSAtNDcgLTM2IC05MSAtMzYgLTI3IDAgLTYyIDYgLTc3IDE0IC0xNSA4IC0yNjMgMjUxIC01NTEgNTQwIGwtNTI1IDUyNSAtNCA1OCBjLTMgNDkgMCA2NCAyMCA5MyA0MSA2MiAxMjQgODYgMTkwIDU3eiBtODU2IC0xIGMxNSAtOCA3MCAtNTkgMTIzIC0xMTMgMTE2IC0xMTggMTMzIC0xNTQgMTA0IC0yMjkgLTMxIC04MCAtMTM2IC0xMjggLTIwMyAtOTEgLTQ5IDI4IC0yMTIgMTkxIC0yMzMgMjMzIC0zNCA3MiAtOCAxNTEgNjUgMTk1IDM3IDIyIDEwNiAyNSAxNDQgNXogbS0xNjgzIC04NTcgYzE3IC0xMCAyNjIgLTI1MSA1NDcgLTUzNiA1NDggLTU1MCA1MzkgLTUzOSA1MjQgLTYxOCAtMTggLTk2IC0xNDEgLTE1NSAtMjIxIC0xMDcgLTE2IDExIC0yNjUgMjUyIC01NTIgNTM4IC00NjUgNDYxIC01MjMgNTIzIC01MjkgNTU3IC0xNCA4MiAyNyAxNTYgMTAxIDE4MiA0NSAxNiA4NiAxMSAxMzAgLTE2eiBtLTI4IC04MzAgYzMyIC0xMiAyMTggLTE5MSAyMzkgLTIzMSAzMSAtNTkgOSAtMTQ2IC00NyAtMTg3IC0zNSAtMjYgLTkzIC0zNyAtMTM2IC0yNiAtMzAgNyAtMjI2IDE5NCAtMjQ5IDIzNyAtNjAgMTE1IDY5IDI1NCAxOTMgMjA3eiIvPgo8L2c+Cjwvc3ZnPg=="
              alt="Logo"
              className="rounded-md"
              width={28}
              height={28}
            />
            <span className="text-base font-bold">Shadcnuikit</span>
          </Link>

          <NavigationMenu
            viewport={false}
            className="hidden max-w-none flex-1 justify-center md:flex"
          >
            <NavigationMenuList className="gap-2 text-sm font-medium">
              {NAV_ITEMS.map((item) =>
                !item.items ? (
                  <NavigationMenuItem key={item.label}>
                    <NavigationMenuLink asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ) : (
                  <NavigationMenuItem key={item.label}>
                    <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="min-w-[180px] space-y-1 text-sm">
                        {item.items.map((sub) => (
                          <li key={sub.label}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={sub.href}
                                className="block rounded-md px-3 py-1.5 hover:bg-gray-100"
                              >
                                {sub.label}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ),
              )}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-4">
            <Button size="lg" className="hidden rounded-full md:inline-flex">
              Sign up
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="bg-background flex h-full w-3/4 flex-col px-4 py-6 sm:max-w-xs"
              >
                <SheetHeader className="p-0">
                  <SheetTitle className="text-left font-normal">
                    Menu
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 space-y-2 text-sm font-medium">
                  <Accordion type="single" collapsible className="w-full">
                    {NAV_ITEMS.map((item) =>
                      !item.items ? (
                        <div
                          key={item.label}
                          className="border-b last:border-b-0"
                        >
                          <Link
                            href={item.href}
                            className="block py-3 text-left text-sm"
                          >
                            {item.label}
                          </Link>
                        </div>
                      ) : (
                        <AccordionItem key={item.label} value={item.label}>
                          <AccordionTrigger className="py-3 text-sm">
                            {item.label}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="flex flex-col space-y-1">
                              {item.items.map((sub) => (
                                <Link
                                  key={sub.label}
                                  href={sub.href}
                                  className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-1.5 py-1 text-sm"
                                >
                                  {sub.label}
                                </Link>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ),
                    )}
                  </Accordion>
                </nav>
                <div className="mt-auto pt-6">
                  <Button className="w-full rounded-full">Sign up</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>

      {/* Hero Content */}
      <div className="container">
        <div className="relative w-full overflow-hidden rounded-xl bg-[url('https://images.unsplash.com/photo-1568084680786-a84f91d1153c?q=80&w=1200')] bg-cover bg-center bg-no-repeat">
          <div className="absolute inset-0 bg-linear-to-t from-black/70 to-black/30"></div>

          {/* Centered Content */}
          <div className="relative inset-0 z-10 flex flex-col items-center justify-center space-y-8 py-20 text-center md:py-40">
            <h1 className="font-serif text-4xl leading-tight font-bold text-balance text-white md:text-6xl">
              The Best Luxury Hotels
            </h1>
            <p className="text-lg text-balance text-white/90 md:text-xl">
              Discover pure luxury in every corner of our hotel.
            </p>

            {/* Booking Form */}
            <div className="w-full max-w-4xl px-4">
              <div className="flex flex-col gap-2 rounded-2xl bg-white/30 px-4 py-4 backdrop-blur-md md:flex-row md:items-center md:gap-0 md:rounded-lg md:py-2">
                <div className="flex-1 border-b border-white/20 px-6 py-3 md:border-r md:border-b-0">
                  <label className="mb-1 block text-xs font-medium text-white/80">
                    Check in
                  </label>
                  <Popover open={openCheckIn} onOpenChange={setOpenCheckIn}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full cursor-pointer text-sm font-semibold text-white hover:text-white/90"
                      >
                        {formatDate(checkIn)}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={checkIn}
                        onSelect={(date) => {
                          setCheckIn(date);
                          if (date && checkOut && checkOut < date) {
                            setCheckOut(date);
                          }
                          setOpenCheckIn(false);
                          setOpenCheckOut(true);
                        }}
                        disabled={{ before: today }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1 border-b border-white/20 px-6 py-3 md:border-r md:border-b-0">
                  <label className="mb-1 block text-xs font-medium text-white/80">
                    Check Out
                  </label>
                  <Popover open={openCheckOut} onOpenChange={setOpenCheckOut}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full cursor-pointer text-sm font-semibold text-white hover:text-white/90"
                      >
                        {formatDate(checkOut)}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={checkOut}
                        onSelect={(date) => {
                          if (!date) return;
                          if (date < minCheckOut) return;
                          setCheckOut(date);
                          setOpenCheckOut(false);
                        }}
                        disabled={{ before: minCheckOut }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1 px-4">
                  <label className="mb-1 block text-xs font-medium text-white/80">
                    Guest
                  </label>
                  <Select value={guests} onValueChange={setGuests}>
                    <SelectTrigger className="h-auto w-full justify-center border-0 bg-transparent px-0 py-0 text-center text-sm font-semibold text-white shadow-none hover:bg-transparent focus-visible:border-white/60 focus-visible:ring-white/40">
                      <SelectValue
                        placeholder="Select guests"
                        aria-label={`${guests} Adults`}
                      >
                        {guests} Adults
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white text-black">
                      <SelectItem value="1">1 Adult</SelectItem>
                      <SelectItem value="2">2 Adults</SelectItem>
                      <SelectItem value="3">3 Adults</SelectItem>
                      <SelectItem value="4">4 Adults</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-white/90"
                >
                  Book Now
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom Stats & Text */}
          <div className="relative right-0 bottom-0 left-0 z-0 flex flex-col items-end justify-between px-4 pt-20 pb-10 md:flex-row md:items-end md:gap-10 md:px-12">
            <p className="mb-8 text-sm leading-relaxed text-balance text-white/80 md:mb-0 md:max-w-lg">
              We embrace the allure of wanderlust, recognizing that everyone
              deserves the chance to embark on their own hotel adventure,
              discovering comfort and style amidst new surroundings.
            </p>

            <div className="flex w-full items-center justify-between gap-4 md:w-auto md:justify-end md:gap-16">
              <div>
                <div className="text-3xl font-bold text-white md:text-4xl">
                  121+
                </div>
                <div className="mt-2 text-sm font-medium text-white/80">
                  Capital Raised
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white md:text-4xl">
                  90+
                </div>
                <div className="mt-2 text-sm font-medium text-white/80">
                  Happy Customer
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white md:text-4xl">
                  1.5K+
                </div>
                <div className="mt-2 text-sm font-medium text-white/80">
                  Property Option
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
