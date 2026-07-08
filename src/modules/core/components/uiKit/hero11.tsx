"use client";

import { motion } from "motion/react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@coreModule/components/uiKit/ui/sheet";
import { ArrowRight, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const IMAGES = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=600&auto=format&fit=crop",
];

const COPIES = 4;

const NAV_ITEMS = [
  { label: "Products", href: "#" },
  { label: "Stories", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Docs", href: "#" },
];

export default function HeroSection() {
  return (
    <main
      className="relative w-full overflow-hidden"
      style={
        {
          "--_accent": "#523f71",
          "--_base": "color-mix(in srgb, var(--_accent) 25%, black)",
          "--_gradient-blend-mode": "normal",
          "--_gradient-blur": "30px",
          background:
            "radial-gradient(at 88.9% 55.5%, var(--_accent) 0px, transparent 50%), radial-gradient(at 19.3% 21.6%, var(--_accent) 0px, transparent 50%) var(--_base)",
          mixBlendMode:
            "var(--_gradient-blend-mode)" as React.CSSProperties["mixBlendMode"],
        } as React.CSSProperties
      }
    >
      <header className="p-4">
        <div
          className="relative z-10 mx-auto grid max-w-7xl grid-cols-2 items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 lg:grid-cols-3"
          style={{
            backdropFilter:
              "blur(var(--_gradient-blur)) contrast(100%) brightness(100%)",
            WebkitBackdropFilter:
              "blur(var(--_gradient-blur)) contrast(100%) brightness(100%)",
          }}
        >
          <Link href="#" className="flex shrink-0 items-center gap-2">
            <Image
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMCIgd2lkdGg9IjMwMC4wMDAwMDBwdCIgaGVpZ2h0PSIzMDAuMDAwMDAwcHQiIHZpZXdCb3g9IjAgMCAzMDAuMDAwMDAwIDMwMC4wMDAwMDAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiPgoKPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4wMDAwMDAsMzAwLjAwMDAwMCkgc2NhbGUoMC4xMDAwMDAsLTAuMTAwMDAwKSIgZmlsbD0iIzAwMDAwMCIgc3Ryb2tlPSJub25lIj4KPHBhdGggZD0iTTAgMTUwMCBsMCAtMTUwMCAxNTAwIDAgMTUwMCAwIDAgMTUwMCAwIDE1MDAgLTE1MDAgMCAtMTUwMCAwIDAgLTE1MDB6IG02NDcgMTA2MCBjMzEgLTEyIDE4ODIgLTE4NTYgMTkxNCAtMTkwOCA1NCAtODUgMSAtMjA5IC05NyAtMjI4IC05MSAtMTcgLTMwIC03MSAtMTA1NyA5NTQgLTUzNyA1MzcgLTk1NCA5NjIgLTk2MyA5ODEgLTU2IDExNyA3NiAyNDggMjAzIDIwMXogbTg0NSAtMyBjMTUgLTcgMjYzIC0yNDcgNTUyIC01MzQgNDUxIC00NDkgNTI3IC01MjggNTM2IC01NjMgMTYgLTU4IC0xIC0xMTAgLTUwIC0xNTQgLTM1IC0zMSAtNDcgLTM2IC05MSAtMzYgLTI3IDAgLTYyIDYgLTc3IDE0IC0xNSA4IC0yNjMgMjUxIC01NTEgNTQwIGwtNTI1IDUyNSAtNCA1OCBjLTMgNDkgMCA2NCAyMCA5MyA0MSA2MiAxMjQgODYgMTkwIDU3eiBtODU2IC0xIGMxNSAtOCA3MCAtNTkgMTIzIC0xMTMgMTE2IC0xMTggMTMzIC0xNTQgMTA0IC0yMjkgLTMxIC04MCAtMTM2IC0xMjggLTIwMyAtOTEgLTQ5IDI4IC0yMTIgMTkxIC0yMzMgMjMzIC0zNCA3MiAtOCAxNTEgNjUgMTk1IDM3IDIyIDEwNiAyNSAxNDQgNXogbS0xNjgzIC04NTcgYzE3IC0xMCAyNjIgLTI1MSA1NDcgLTUzNiA1NDggLTU1MCA1MzkgLTUzOSA1MjQgLTYxOCAtMTggLTk2IC0xNDEgLTE1NSAtMjIxIC0xMDcgLTE2IDExIC0yNjUgMjUyIC01NTIgNTM4IC00NjUgNDYxIC01MjMgNTIzIC01MjkgNTU3IC0xNCA4MiAyNyAxNTYgMTAxIDE4MiA0NSAxNiA4NiAxMSAxMzAgLTE2eiBtLTI4IC04MzAgYzMyIC0xMiAyMTggLTE5MSAyMzkgLTIzMSAzMSAtNTkgOSAtMTQ2IC00NyAtMTg3IC0zNSAtMjYgLTkzIC0zNyAtMTM2IC0yNiAtMzAgNyAtMjI2IDE5NCAtMjQ5IDIzNyAtNjAgMTE1IDY5IDI1NCAxOTMgMjA3eiIvPgo8L2c+Cjwvc3ZnPg=="
              alt="Logo"
              className="rounded-sm invert"
              width={28}
              height={28}
            />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-white/80 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              size="lg"
              className="dark rounded-full border border-white/20 text-white hover:bg-white/10"
            >
              Contact
            </Button>
            <Button
              size="lg"
              className="rounded-full bg-white text-black"
              variant="secondary"
            >
              Get Started
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white lg:hidden"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex h-full flex-col border-white/10"
              >
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle className="font-normal">Menu</SheetTitle>
                  </SheetHeader>
                  <nav className="mt-auto flex flex-col gap-1 p-4">
                    {NAV_ITEMS.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="rounded-md py-2.5 text-center"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                  <div className="mt-auto flex flex-col gap-2 p-4">
                    <Button variant="outline">Contact</Button>
                    <Button>Get Started</Button>
                  </div>
                </SheetContent>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto flex flex-col items-center px-4 pt-20 text-center md:pt-32">
        <div className="max-w-4xl">
          <Link
            href="#"
            className="group mb-4 inline-flex items-center md:mb-6"
          >
            <Badge
              variant="outline"
              className="inline-flex items-center gap-2 rounded-full border-white/10 bg-white/5 px-4 py-1.5 font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white md:text-sm"
            >
              Explore how we help grow brands.{" "}
              <span className="underline">Read more</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Badge>
          </Link>

          <h1 className="mb-4 text-4xl leading-tight font-bold text-balance text-white lg:text-5xl">
            Solutions to Elevate Your Business Growth
          </h1>

          <p className="mb-10 leading-relaxed text-balance text-white/80 lg:text-xl">
            Unlock potential with tailored strategies designed for success.
            Simplify challenges, maximize results, and stay ahead in the
            competitive market.
          </p>

          <div className="mb-24 flex items-center justify-center gap-3">
            <Button size="lg" className="dark rounded-full bg-white text-black">
              Get Started
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="dark flex rounded-full border border-white/20 text-white hover:bg-white/10"
            >
              Learn More
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        <div
          className="w-full overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
          }}
        >
          <motion.div
            className="flex gap-4"
            style={{ width: "fit-content" }}
            animate={{ x: `-${100 / COPIES}%` }}
            transition={{ duration: 10, ease: "linear", repeat: Infinity }}
          >
            {Array.from({ length: COPIES })
              .flatMap(() => IMAGES)
              .map((src, index) => (
                <div
                  key={index}
                  className="relative aspect-square max-w-36 shrink-0 overflow-hidden rounded-2xl md:max-w-xs"
                >
                  <img
                    src={src}
                    alt={`Team member ${(index % IMAGES.length) + 1}`}
                    className="h-full w-full object-cover opacity-80 transition-opacity hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                </div>
              ))}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
