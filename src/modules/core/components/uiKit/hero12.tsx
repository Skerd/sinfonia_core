"use client";

import { useState } from "react";
import { Menu, Play, Star } from "lucide-react";
import { VisuallyHidden } from "radix-ui";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@coreModule/components/uiKit/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@coreModule/components/uiKit/ui/sheet";

const NAV_ITEMS = [
  { label: "Shop", href: "#" },
  { label: "Collections", href: "#" },
  { label: "Deals", href: "#" },
  { label: "About", href: "#" },
];

export default function HeroSection() {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full">
      <nav className="container mx-auto flex items-center justify-between px-4 py-6">
        <Link href="#" className="flex items-center gap-2">
          <Image
            src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMCIgd2lkdGg9IjMwMC4wMDAwMDBwdCIgaGVpZ2h0PSIzMDAuMDAwMDAwcHQiIHZpZXdCb3g9IjAgMCAzMDAuMDAwMDAwIDMwMC4wMDAwMDAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiPgoKPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4wMDAwMDAsMzAwLjAwMDAwMCkgc2NhbGUoMC4xMDAwMDAsLTAuMTAwMDAwKSIgZmlsbD0iIzAwMDAwMCIgc3Ryb2tlPSJub25lIj4KPHBhdGggZD0iTTAgMTUwMCBsMCAtMTUwMCAxNTAwIDAgMTUwMCAwIDAgMTUwMCAwIDE1MDAgLTE1MDAgMCAtMTUwMCAwIDAgLTE1MDB6IG02NDcgMTA2MCBjMzEgLTEyIDE4ODIgLTE4NTYgMTkxNCAtMTkwOCA1NCAtODUgMSAtMjA5IC05NyAtMjI4IC05MSAtMTcgLTMwIC03MSAtMTA1NyA5NTQgLTUzNyA1MzcgLTk1NCA5NjIgLTk2MyA5ODEgLTU2IDExNyA3NiAyNDggMjAzIDIwMXogbTg0NSAtMyBjMTUgLTcgMjYzIC0yNDcgNTUyIC01MzQgNDUxIC00NDkgNTI3IC01MjggNTM2IC01NjMgMTYgLTU4IC0xIC0xMTAgLTUwIC0xNTQgLTM1IC0zMSAtNDcgLTM2IC05MSAtMzYgLTI3IDAgLTYyIDYgLTc3IDE0IC0xNSA4IC0yNjMgMjUxIC01NTEgNTQwIGwtNTI1IDUyNSAtNCA1OCBjLTMgNDkgMCA2NCAyMCA5MyA0MSA2MiAxMjQgODYgMTkwIDU3eiBtODU2IC0xIGMxNSAtOCA3MCAtNTkgMTIzIC0xMTMgMTE2IC0xMTggMTMzIC0xNTQgMTA0IC0yMjkgLTMxIC04MCAtMTM2IC0xMjggLTIwMyAtOTEgLTQ5IDI4IC0yMTIgMTkxIC0yMzMgMjMzIC0zNCA3MiAtOCAxNTEgNjUgMTk1IDM3IDIyIDEwNiAyNSAxNDQgNXogbS0xNjgzIC04NTcgYzE3IC0xMCAyNjIgLTI1MSA1NDcgLTUzNiA1NDggLTU1MCA1MzkgLTUzOSA1MjQgLTYxOCAtMTggLTk2IC0xNDEgLTE1NSAtMjIxIC0xMDcgLTE2IDExIC0yNjUgMjUyIC01NTIgNTM4IC00NjUgNDYxIC01MjMgNTIzIC01MjkgNTU3IC0xNCA4MiAyNyAxNTYgMTAxIDE4MiA0NSAxNiA4NiAxMSAxMzAgLTE2eiBtLTI4IC04MzAgYzMyIC0xMiAyMTggLTE5MSAyMzkgLTIzMSAzMSAtNTkgOSAtMTQ2IC00NyAtMTg3IC0zNSAtMjYgLTkzIC0zNyAtMTM2IC0yNiAtMzAgNyAtMjI2IDE5NCAtMjQ5IDIzNyAtNjAgMTE1IDY5IDI1NCAxOTMgMjA3eiIvPgo8L2c+Cjwvc3ZnPg=="
            alt="Logo"
            className="rounded-sm dark:invert"
            width={24}
            height={24}
          />
          <span className="text-lg font-bold">shadcnuikit</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-muted-foreground hover:text-accent-foreground text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button className="rounded-full">Get started</Button>
          <Button variant="outline" className="rounded-full">
            Login
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex h-full flex-col px-4 py-6 sm:max-w-xs"
            >
              <SheetHeader className="p-0">
                <SheetTitle className="text-left font-medium">Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1 text-sm font-medium">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-accent-foreground hover:bg-accent rounded-md px-3 py-2.5 text-left"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2">
                <Button variant="outline" className="w-full rounded-full">
                  Login
                </Button>
                <Button className="w-full rounded-full">Get started</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="container mx-auto flex flex-col items-center px-4 py-20 text-center md:py-32">
        <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Avatar key={i} className="border-background size-8 border-2">
                <AvatarImage src={`https://i.pravatar.cc/100?img=${i + 10}`} />
                <AvatarFallback>U{i}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div className="flex flex-col items-start gap-0.5">
            <div className="flex gap-1 text-amber-600">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="size-4 fill-current" />
              ))}
            </div>
            <span className="text-muted-foreground text-xs">
              Loved by 10,000+ shoppers
            </span>
          </div>
        </div>

        <h1 className="mb-4 max-w-4xl text-4xl leading-tight font-bold text-balance lg:text-5xl">
          Discover products you will
          <span className="text-indigo-600"> actually love.</span>
        </h1>

        <p className="text-muted-foreground mb-10 max-w-2xl text-lg leading-relaxed text-balance md:text-xl">
          Shop thousands of curated products with fast delivery, easy returns,
          and unbeatable prices. Your next favorite find is one click away.
        </p>

        <div className="mb-24 flex items-center gap-3">
          <Button size="lg" className="rounded-full md:h-12">
            Shop Now
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full md:h-12"
            onClick={() => setVideoOpen(true)}
          >
            <Play /> Watch our story
          </Button>

          <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
            <DialogContent className="w-full max-w-5xl border-0 bg-black p-0 shadow-2xl">
              <VisuallyHidden.Root>
                <DialogTitle>Demo video</DialogTitle>
              </VisuallyHidden.Root>
              {videoOpen && (
                <iframe
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                  className="aspect-video w-full rounded-lg"
                />
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col items-center gap-8">
          <p className="text-muted-foreground text-sm">
            Featuring top brands you already know
          </p>
          <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale md:gap-16 dark:invert">
            <Logo1 />
            <Logo2 />
            <Logo3 />
            <Logo4 />
            <Logo5 />
          </div>
        </div>
      </div>
    </div>
  );
}

const Logo1 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="120" height="60">
    <g transform="matrix(.173865 0 0 .173865 7.501548 18.78565)">
      <path
        d="M213.2 74.3l-3.6 10.2h-.3c-.6-2.3-1.7-5.8-3.5-10L186.5 26h-18.9v77.3h12.5V55.6L180 45c-.1-2.1-.3-3.7-.4-4.9h.3c.6 3 1.3 5.2 1.8 6.6l23.2 56.4h8.8l23-56.9c.5-1.3 1-3.9 1.5-6.1h.3l-.6 13.9v49h13.3V25.8H233zm50.6-26.7h13V103h-13zm6.6-23.4c-2.2 0-4 .8-5.5 2.2s-2.3 3.2-2.3 5.4a7.03 7.03 0 0 0 2.3 5.3c1.5 1.4 3.3 2.1 5.5 2.1s4.1-.8 5.5-2.1a7.03 7.03 0 0 0 2.3-5.3c0-2.1-.8-3.9-2.3-5.4-1.3-1.4-3.2-2.2-5.5-2.2m52.5 22.9c-2.4-.5-4.9-.8-7.3-.8-5.9 0-11.3 1.3-15.8 3.9s-8.1 6.2-10.4 10.7c-2.4 4.6-3.6 9.9-3.6 16 0 5.3 1.2 10 3.5 14.3 2.3 4.2 5.5 7.6 9.8 9.9 4.1 2.3 8.9 3.5 14.3 3.5 6.2 0 11.5-1.3 15.7-3.7l.1-.1v-12l-.5.4c-1.9 1.4-4.1 2.6-6.3 3.3-2.3.8-4.4 1.2-6.2 1.2-5.2 0-9.3-1.5-12.2-4.8-3-3.2-4.5-7.6-4.5-13.1 0-5.7 1.5-10.2 4.6-13.5s7.2-5 12.2-5c4.2 0 8.5 1.4 12.4 4.2l.5.4V49.2l-.1-.1c-1.7-.7-3.6-1.5-6.2-2m42.9-.4c-3.2 0-6.2 1-8.8 3.1-2.2 1.8-3.7 4.4-5 7.5h-.1v-9.7h-13V103h13V74.7c0-4.8 1-8.8 3.2-11.7 2.2-3 5-4.5 8.4-4.5 1.2 0 2.4.3 3.9.5 1.4.4 2.4.8 3.1 1.3l.5.4v-13l-.3-.1c-.9-.6-2.7-.9-4.9-.9m35.4-.3c-9.1 0-16.4 2.7-21.5 8-5.2 5.3-7.7 12.6-7.7 21.8 0 8.6 2.6 15.6 7.6 20.7 5 5 11.8 7.6 20.3 7.6 8.9 0 16-2.7 21.1-8.1 5.2-5.4 7.7-12.6 7.7-21.5 0-8.8-2.4-15.8-7.3-20.9-4.7-5.1-11.6-7.6-20.2-7.6M411.6 89c-2.4 3.1-6.2 4.6-10.9 4.6s-8.5-1.5-11.2-4.8c-2.7-3.1-4-7.6-4-13.3 0-5.9 1.4-10.4 4-13.6 2.7-3.2 6.4-4.8 11.1-4.8 4.6 0 8.2 1.5 10.8 4.6s4 7.6 4 13.5c-.2 6-1.3 10.7-3.8 13.8m46.1-18.4c-4.1-1.7-6.7-3-7.9-4.1-1-1-1.5-2.4-1.5-4.2 0-1.5.6-3 2.1-4s3.2-1.5 5.7-1.5c2.2 0 4.5.4 6.7 1s4.2 1.5 5.8 2.7l.5.4V48.7l-.3-.1c-1.5-.6-3.5-1.2-5.9-1.7-2.4-.4-4.6-.6-6.4-.6-6.2 0-11.3 1.5-15.3 4.8-4 3.1-5.9 7.3-5.9 12.2 0 2.6.4 4.9 1.3 6.8s2.2 3.7 4 5.2c1.8 1.4 4.4 3 8 4.5 3 1.3 5.3 2.3 6.7 3.1s2.3 1.7 3 2.4c.5.8.8 1.8.8 3.1 0 3.7-2.8 5.5-8.5 5.5-2.2 0-4.5-.4-7.2-1.3s-5.2-2.2-7.3-3.7l-.5-.4v12.7l.3.1c1.9.9 4.2 1.5 7 2.2 2.8.5 5.3.9 7.5.9 6.7 0 12.2-1.5 16.1-4.8 4-3.2 6.1-7.3 6.1-12.6 0-3.7-1-7-3.2-9.5-2.9-2.4-6.5-4.9-11.7-6.9m49.2-24.2c-9.1 0-16.4 2.7-21.5 8s-7.7 12.6-7.7 21.8c0 8.6 2.6 15.6 7.6 20.7 5 5 11.8 7.6 20.3 7.6 8.9 0 16-2.7 21.1-8.1 5.2-5.4 7.7-12.6 7.7-21.5 0-8.8-2.4-15.8-7.3-20.9-4.7-5.1-11.6-7.6-20.2-7.6M517.2 89c-2.4 3.1-6.2 4.6-10.9 4.6-4.8 0-8.5-1.5-11.2-4.8-2.7-3.1-4-7.6-4-13.3 0-5.9 1.4-10.4 4-13.6 2.7-3.2 6.4-4.8 11.1-4.8 4.5 0 8.2 1.5 10.8 4.6s4 7.6 4 13.5c0 6-1.3 10.7-3.8 13.8m86.7-30.7V47.6h-13.1V31.2l-.4.1L578 35l-.3.1v12.5h-19.6v-7c0-3.2.8-5.7 2.2-7.3s3.5-2.4 6.1-2.4c1.8 0 3.7.4 5.8 1.3l.5.3V21.2l-.3-.1c-1.8-.6-4.2-1-7.3-1-3.9 0-7.3.9-10.4 2.4-3.1 1.7-5.4 4-7.1 7.1-1.7 3-2.6 6.4-2.6 10.3v7.7h-9.1v10.6h9.1V103h13.1V58.3h19.6v28.5c0 11.7 5.5 17.6 16.5 17.6 1.8 0 3.7-.3 5.5-.6 1.9-.4 3.3-.9 4.1-1.3l.1-.1V91.7l-.5.4c-.8.5-1.5.9-2.7 1.2-1 .3-1.9.4-2.6.4-2.6 0-4.4-.6-5.7-2.1-1.2-1.4-1.8-3.7-1.8-7.1V58.3z"
        fill="#737373"
      />
      <path d="M0 0h61.3v61.3H0z" fill="#f25022" />
      <path d="M67.7 0H129v61.3H67.7z" fill="#7fba00" />
      <path d="M0 67.7h61.3V129H0z" fill="#00a4ef" />
      <path d="M67.7 67.7H129V129H67.7z" fill="#ffb900" />
    </g>
  </svg>
);

const Logo2 = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    id="Layer_1"
    x="0px"
    y="0px"
    viewBox="0 0 120 60"
    width={120}
    height={60}
    xmlSpace="preserve"
  >
    <style type="text/css">
      {
        "\n\t.st0{fill-rule:evenodd;clip-rule:evenodd;fill:#67DBFF;}\n\t.st1{fill-rule:evenodd;clip-rule:evenodd;fill:#01A3FF;}\n\t.st2{fill-rule:evenodd;clip-rule:evenodd;fill:#0162FF;}\n\t.st3{fill:#191D26;}\n"
      }
    </style>
    <g>
      <path className="st0" d="M24.2,26.1h10v-9.8H14.4v0.1L24.2,26.1z" />
      <path
        className="st1"
        d="M24.2,26.1h-10v9.8H34v-0.1L24.2,26.1L24.2,26.1z"
      />
      <path className="st2" d="M14.3,35.8h9.9v9.9L14.3,35.8z" />
      <path
        className="st3"
        d="M47.8,35.8v-5.4h5.9v-2.5h-5.9v-3.6h6.4v-2.6h-9.3v14H47.8z"
      />
      <path
        className="st3"
        d="M61.6,25.6c-0.2-0.1-0.6-0.2-1.1-0.2c-1,0-1.8,0.5-2.3,1.2v-1h-2.8v10.2h2.8v-6.3c0.2-0.9,1-1.4,1.9-1.4   c0.5,0,1,0.1,1.4,0.3V25.6z"
      />
      <path
        className="st3"
        d="M71,35.8v-6.5c0-2.4-1.6-3.9-4.3-3.9c-2.3,0-4,1.4-4.3,3.3h2.7c0.2-0.6,0.7-1,1.5-1c1.1,0,1.7,0.7,1.7,1.6V30   c-0.4-0.3-1.4-0.6-2.3-0.6c-2.2,0-3.9,1.3-3.9,3.3c0,2.1,1.7,3.3,3.8,3.3c1.1,0,2.1-0.4,2.5-0.7v0.5H71z M68.3,33   c-0.3,0.5-1,0.9-1.8,0.9c-0.9,0-1.8-0.4-1.8-1.3c0-0.9,0.9-1.3,1.8-1.3c0.8,0,1.6,0.3,1.8,0.9V33z"
      />
      <path
        className="st3"
        d="M81,26.7c-0.6-0.8-1.5-1.3-2.7-1.3c-1.1,0-2.1,0.4-2.6,1.1v-0.8h-2.8v10.2h2.8v-6.6c0.2-0.9,0.9-1.3,1.6-1.3   c1,0,1.4,0.7,1.4,1.8v6.1h2.8v-6.6c0.2-0.9,0.8-1.3,1.6-1.3c1,0,1.5,0.7,1.5,1.8v6.1h2.8v-6.7c0-2.3-1.3-3.8-3.4-3.8   C82.7,25.4,81.7,26,81,26.7z"
      />
      <path
        className="st3"
        d="M95.5,32.5c-0.2,0.9-0.9,1.3-1.9,1.3c-1.3,0-2.1-0.9-2.2-2.4h6.8v-0.9c0-3-1.6-5.1-4.6-5.1   c-2.8,0-4.9,2.3-4.9,5.3c0,3.1,2,5.3,4.9,5.3c2.6,0,4.1-1.4,4.5-3.6H95.5z M93.6,27.7c1.2,0,1.8,0.8,1.8,1.9h-3.9   C91.8,28.4,92.5,27.7,93.6,27.7z"
      />
      <path
        className="st3"
        d="M105.7,25.6c-0.2-0.1-0.6-0.2-1.1-0.2c-1,0-1.8,0.5-2.3,1.2v-1h-2.8v10.2h2.8v-6.3c0.2-0.9,1-1.4,1.9-1.4   c0.5,0,1,0.1,1.4,0.3V25.6z"
      />
    </g>
  </svg>
);

const Logo3 = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="120"
    height="60"
    preserveAspectRatio="xMidYMid"
  >
    <path d="M40.554 27.4c1.144 0 2.072-.928 2.072-2.073s-.928-2.073-2.072-2.073-2.072.928-2.072 2.073.928 2.073 2.072 2.073zm68.4 7.082c-.315-.222-.56-.258-.76.172-3.48 7.538-9.346 3.777-8.763 4.108 1.3-.595 4.722-3.34 4.205-7.128-.314-2.316-2.302-3.343-4.4-2.975-3.682.642-5.037 4.614-4.347 8.13.12.604.336 1.102.552 1.6-4.16 3.384-5.814-3.03-6-3.796-.007-.04 3.213-2.725 4.1-9.122.94-6.704-1.2-7.925-3.387-7.887-4.047.07-5.14 8.526-3.67 15.573-.123.032-.696.35-1.616.385-.662-2.083-3.5-3.9-4.232-3.206-1.853 1.76.45 5.202 2.07 5.472-.973 5.994-7.06 4.5-5.927-3 1.982-3.68 3.5-9.153 3.22-12.457-.095-1.17-.96-2.737-2.916-2.66-3.762.15-4.17 8.607-3.73 14.6-.022-.148-.23.73-1.773 1.166-.365-2.024-3.624-4.056-4.4-3.08-1.436 1.828 1.053 5.088 2.232 5.315-.973 5.994-7.06 4.5-5.926-3 1.982-3.68 3.5-9.153 3.22-12.457-.095-1.17-.96-2.737-2.916-2.66-3.762.15-4.17 8.607-3.73 14.6-.022-.15-.236.756-1.84 1.185-.054-2.626-3.325-3.83-4.1-2.992-1.4 1.493.32 4.558 1.913 5.315-.973 5.994-7.06 4.5-5.926-3 1.982-3.68 3.5-9.153 3.22-12.457-.095-1.17-.96-2.737-2.916-2.66-3.762.15-4.064 9.032-3.623 15.035-1.24 5.3-5.394 11.94-4.855-1.342.053-.932.112-1.285-.353-1.634-.348-.27-1.14-.14-1.572-.13-.526.02-.658.33-.774.794-.27 1.2-.32 2.365-.358 3.953-.025.743-.085 1.1-.37 2.103s-1.916 2.864-2.8 2.555c-1.238-.426-.832-3.922-.6-6.323.193-1.898-.426-2.75-2.012-3.06-.93-.194-1.493-.164-2.46-.47-.915-.288-1.122-2.02-3.072-1.442-1.067.316-.38 2.576-.638 4.252-1.26 8.242-3.884 8.47-5.1 4.465 5.48-13.424 1.586-18.716-.694-18.716-2.375 0-5.1 1.636-3.94 12.103-.56-.163-.73-.25-1.343-.25-3.46 0-5.82 2.798-5.82 6.25s2.358 6.25 5.82 6.25c2.043 0 3.477-.93 4.564-2.366.7 1.015 1.572 2.382 3.15 2.32 4.704-.183 6.073-9.834 6.234-10.372.503.077.98.224 1.443.302.774.116.83.423.813 1.2-.205 6.563 1.006 8.86 3.753 8.86 1.53 0 2.895-1.504 3.835-2.58.702 1.45 1.82 2.535 3.32 2.58 3.636.1 5.028-5.705 4.9-4.942-.1.598 1.18 4.9 4.923 4.925 4.637.02 5.5-5.08 5.602-5.934.013-.17.018-.152 0 0l-.004.052c1.472-.274 2.232-1.063 2.232-1.063s1.182 7.025 5.56 6.945c4.547-.082 5.404-4.692 5.517-5.6.015-.213.024-.188 0 0l-.002.026c1.75-.636 2.208-1.275 2.208-1.275S74.8 41.94 79.43 42c4.118.054 5.644-4.163 5.653-5.928.695.007 1.98-.412 1.95-.436 0 0 1.508 6.02 5.72 6.33 1.978.145 3.46-1.113 4.307-1.687 1.988 1.6 8.606 3.665 12.785-3.42.6-1.017-.678-2.218-.9-2.375zM15.65 39.626c-2.02 0-3.314-1.867-3.314-3.88s1.188-3.88 3.208-3.88c.9 0 1.414.1 2.122.716a44.69 44.69 0 0 0 .669 2.202c.237.7.52 1.312.803 1.97-.406 1.684-1.738 2.874-3.488 2.874zm4.92-6.985c-.084-.134-.066-.052-.16-.178-.37-1.007-1.083-3.254-1.166-5.807-.093-2.887.388-6.272 1.807-6.272.96 0 1.983 6.86-.48 12.257zM49 29.633c-.228-1.714-.24-9.352 1.594-9.142 1.012.4-.642 7.618-1.594 9.142zm13.4 0c-.228-1.714-.24-9.352 1.594-9.142 1.012.4-.642 7.618-1.594 9.142zm13.284.106c-.228-1.714-.24-9.352 1.594-9.142 1.013.4-.642 7.618-1.594 9.142zm14.666-9.695c1.677-.174 1.607 7.148-1.758 11.77-.434-1.67-1.1-11.196 1.758-11.77zM97.398 35.8c-.54-2.72.853-4.507 2.287-4.703.5-.08 1.228.245 1.373.852.238 1.144-.035 2.842-3.245 4.996a4.46 4.46 0 0 1-.415-1.145z" />
  </svg>
);

const Logo4 = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    height={60}
    width={120}
  >
    <path
      d="M32.377 26.446h-12.52v3.715h8.88c-.44 5.2-4.773 7.432-8.865 7.432a9.76 9.76 0 0 1-9.802-9.891c0-5.624 4.354-9.954 9.814-9.954 4.212 0 6.694 2.685 6.694 2.685l2.6-2.694s-3.34-3.717-9.43-3.717c-7.755 0-13.754 6.545-13.754 13.614 0 6.927 5.643 13.682 13.95 13.682 7.307 0 12.656-5.006 12.656-12.408 0-1.562-.227-2.464-.227-2.464z"
      fill="#4885ed"
    />
    <use xlinkHref="#A" fill="#db3236" />
    <use xlinkHref="#A" x={19.181} fill="#f4c20d" />
    <path
      d="M80.628 23.765c-4.716 0-8.422 4.13-8.422 8.766 0 5.28 4.297 8.782 8.34 8.782 2.5 0 3.83-.993 4.8-2.132v1.73c0 3.027-1.838 4.84-4.612 4.84-2.68 0-4.024-1.993-4.5-3.123l-3.372 1.4c1.196 2.53 3.604 5.167 7.9 5.167 4.7 0 8.262-2.953 8.262-9.147V24.292H85.36v1.486c-1.13-1.22-2.678-2.013-4.73-2.013zm.34 3.44c2.312 0 4.686 1.974 4.686 5.345 0 3.427-2.37 5.315-4.737 5.315-2.514 0-4.853-2.04-4.853-5.283 0-3.368 2.43-5.378 4.904-5.378z"
      fill="#4885ed"
    />
    <path
      d="M105.4 23.744c-4.448 0-8.183 3.54-8.183 8.76 0 5.526 4.163 8.803 8.6 8.803 3.712 0 6-2.03 7.35-3.85l-3.033-2.018c-.787 1.22-2.103 2.415-4.298 2.415-2.466 0-3.6-1.35-4.303-2.66l11.763-4.88-.6-1.43c-1.136-2.8-3.787-5.14-7.295-5.14zm.153 3.374c1.603 0 2.756.852 3.246 1.874l-7.856 3.283c-.34-2.542 2.07-5.157 4.6-5.157z"
      fill="#db3236"
    />
    <path d="M91.6 40.787h3.864V14.93H91.6z" fill="#3cba54" />
    <defs>
      <path
        id="A"
        d="M42.634 23.755c-5.138 0-8.82 4.017-8.82 8.7 0 4.754 3.57 8.845 8.88 8.845 4.806 0 8.743-3.673 8.743-8.743 0-5.8-4.58-8.803-8.803-8.803zm.05 3.446c2.526 0 4.92 2.043 4.92 5.334 0 3.22-2.384 5.322-4.932 5.322-2.8 0-5-2.242-5-5.348 0-3.04 2.18-5.308 5.02-5.308z"
      />
    </defs>
  </svg>
);

const Logo5 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="120" height="60">
    <path d="M12.005 40.177c-2.275-.565-4.078-2.536-4.442-4.857-.077-.493-.136-3.465-.136-6.936l-.001-6.073h3.45v6.89l.515-.27c1.68-.876 4.123-.546 5.826.787.778.6 1.603 1.833 1.904 2.825.227.747.27 1.168.225 2.2-.047 1.1-.113 1.408-.48 2.168-1.224 2.54-4.14 3.92-6.863 3.245zm2.493-3.3c.6-.252 1.4-1.17 1.498-1.745.163-.87-.002-1.76-.43-2.295-1.02-1.284-2.774-1.426-3.94-.32-.565.537-.792 1.073-.804 1.897-.026 1.866 1.944 3.187 3.674 2.463zm10.064 3.287c-1.06-.285-1.918-.803-2.718-1.642-.813-.852-1.193-1.526-1.478-2.62-1.08-4.143 2.5-8.057 6.713-7.36 4.643.767 6.616 6.42 3.447 9.872-1.523 1.66-3.806 2.328-5.964 1.748zm3.058-3.58c1.524-1.077 1.503-3.32-.04-4.4-.474-.328-.676-.382-1.447-.382-.78 0-.97.05-1.472.4-1.7 1.188-1.526 3.604.353 4.63.65.355 1.918.23 2.607-.258zm9.685 3.58c-1.06-.285-1.918-.803-2.718-1.642-.813-.852-1.193-1.526-1.478-2.62-1.08-4.143 2.5-8.057 6.713-7.36 4.643.767 6.616 6.42 3.447 9.872-1.523 1.66-3.806 2.328-5.964 1.748zm3.058-3.58c1.524-1.077 1.503-3.32-.04-4.4-.474-.328-.676-.382-1.447-.382-.78 0-.97.05-1.472.4-1.7 1.188-1.526 3.604.353 4.63.65.355 1.918.23 2.607-.258zm13.852 3.6a10.02 10.02 0 0 1-1.294-.454l-.63-.282v-3.172l1.072.548c.914.467 1.22.555 2.064.598 1.1.056 1.5-.14 1.5-.727 0-.397-.385-.64-1.452-.912-1.1-.285-1.688-.6-2.3-1.216-.664-.688-.927-1.376-.934-2.442-.01-1.48.8-2.642 2.348-3.32 1.165-.515 3.18-.47 4.613.104l.503.2v1.526c0 1.17-.04 1.5-.166 1.453-1.218-.536-1.934-.766-2.578-.826-.988-.092-1.422.113-1.48.7-.036.372.02.452.465.678a4.96 4.96 0 0 0 .965.355c1.865.403 3.022 1.622 3.16 3.33.13 1.62-.646 2.898-2.2 3.604-.886.406-2.64.527-3.686.255zm9.52-.095c-.93-.474-1.088-.894-2.342-6.224l-1.138-5c0-.133.38-.173 1.64-.173h1.64l.495 2.5c.67 3.368.758 3.775.806 3.726.023-.023.288-1.205.6-2.627s.652-2.765.78-2.987c.486-.842 1.852-1.132 2.68-.568.76.518.898.85 1.478 3.584.306 1.442.584 2.594.617 2.56.053-.053 1.084-5.813 1.088-6.078.001-.055.748-.1 1.66-.1s1.66.05 1.66.113c0 .223-1.998 9.52-2.137 9.945-.46 1.4-2.422 2.098-3.553 1.26-.696-.515-.873-.97-1.33-3.404-.243-1.295-.466-2.33-.494-2.303s-.258 1.075-.5 2.326-.55 2.45-.662 2.666c-.496.96-1.907 1.342-2.964.803zm15.902.07c-.97-.272-1.718-.727-2.496-1.517-2.412-2.45-2.32-6.32.203-8.637 3.403-3.124 8.988-1.248 9.853 3.3.075.393.135 2.08.135 3.75V40.1h-1.66c-1.555 0-1.66-.016-1.66-.258s-.035-.242-.743.082c-.947.433-2.56.54-3.635.237zm3.205-3.587c1.52-1.074 1.498-3.32-.045-4.388-.474-.328-.676-.382-1.447-.382-.78 0-.97.05-1.472.4-1.394.968-1.57 3.007-.356 4.14.875.816 2.346.918 3.32.23zM49.54 39.96c-1.975-.4-3.32-1.875-3.627-4-.066-.456-.12-3.442-.122-6.636l-.003-5.807h3.45v5.177h2.124v3.186h-2.124v1.87c0 2.564.22 2.982 1.653 3.157l.67.082.075 3.12-.767-.015c-.422-.01-1.02-.064-1.33-.125zm42.6 0c-1.975-.4-3.32-1.875-3.627-4-.066-.456-.12-3.442-.123-6.636l-.003-5.807h3.45v5.177h2.124v3.186h-2.124v1.87c0 2.564.22 2.982 1.653 3.157l.67.082.075 3.12-.767-.015c-.422-.01-1.02-.064-1.33-.125zm6.933.01c-3.1-.616-4.932-3.012-4.675-6.078.148-1.76.94-3.176 2.278-4.064 1.088-.722 2.053-1.015 3.625-1.102l1.36-.075v3.224h-.954c-1.256 0-1.982.34-2.522 1.18-.352.55-.388.7-.347 1.5.083 1.58 1.03 2.366 2.86 2.372h.962V40.1l-1.03-.014c-.566-.01-1.268-.062-1.56-.12zm3.65-8.76v-8.893h3.45v3.266c0 3.06.015 3.26.232 3.17 1.07-.442 2.7-.394 3.808.113 1.426.653 2.333 1.963 2.6 3.742.073.5.135 2.403.136 4.2l.003 3.285h-3.45l-.003-3.352c-.002-1.843-.058-3.6-.126-3.883-.247-1.07-1.387-1.582-2.382-1.068-.747.386-.808.74-.808 4.705v3.597h-3.45V31.2z" />
  </svg>
);
