import { Button } from "@coreModule/components/uiKit/ui/button";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import {
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenu,
} from "@coreModule/components/uiKit/ui/navigation-menu";
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

const NAV_ITEMS = [
  { label: "Product", href: "#" },
  { label: "Use cases", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Docs", href: "#" },
  { label: "Customers", href: "#" },
];

export default function HeroSection() {
  return (
    <>
      <header className="relative z-10">
        <nav className="container mx-auto flex items-center justify-between px-4 py-6 md:px-6">
          <Link href="#" className="flex shrink-0 items-center gap-2">
            <Image
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMCIgd2lkdGg9IjMwMC4wMDAwMDBwdCIgaGVpZ2h0PSIzMDAuMDAwMDAwcHQiIHZpZXdCb3g9IjAgMCAzMDAuMDAwMDAwIDMwMC4wMDAwMDAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiPgoKPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4wMDAwMDAsMzAwLjAwMDAwMCkgc2NhbGUoMC4xMDAwMDAsLTAuMTAwMDAwKSIgZmlsbD0iIzAwMDAwMCIgc3Ryb2tlPSJub25lIj4KPHBhdGggZD0iTTAgMTUwMCBsMCAtMTUwMCAxNTAwIDAgMTUwMCAwIDAgMTUwMCAwIDE1MDAgLTE1MDAgMCAtMTUwMCAwIDAgLTE1MDB6IG02NDcgMTA2MCBjMzEgLTEyIDE4ODIgLTE4NTYgMTkxNCAtMTkwOCA1NCAtODUgMSAtMjA5IC05NyAtMjI4IC05MSAtMTcgLTMwIC03MSAtMTA1NyA5NTQgLTUzNyA1MzcgLTk1NCA5NjIgLTk2MyA5ODEgLTU2IDExNyA3NiAyNDggMjAzIDIwMXogbTg0NSAtMyBjMTUgLTcgMjYzIC0yNDcgNTUyIC01MzQgNDUxIC00NDkgNTI3IC01MjggNTM2IC01NjMgMTYgLTU4IC0xIC0xMTAgLTUwIC0xNTQgLTM1IC0zMSAtNDcgLTM2IC05MSAtMzYgLTI3IDAgLTYyIDYgLTc3IDE0IC0xNSA4IC0yNjMgMjUxIC01NTEgNTQwIGwtNTI1IDUyNSAtNCA1OCBjLTMgNDkgMCA2NCAyMCA5MyA0MSA2MiAxMjQgODYgMTkwIDU3eiBtODU2IC0xIGMxNSAtOCA3MCAtNTkgMTIzIC0xMTMgMTE2IC0xMTggMTMzIC0xNTQgMTA0IC0yMjkgLTMxIC04MCAtMTM2IC0xMjggLTIwMyAtOTEgLTQ5IDI4IC0yMTIgMTkxIC0yMzMgMjMzIC0zNCA3MiAtOCAxNTEgNjUgMTk1IDM3IDIyIDEwNiAyNSAxNDQgNXogbS0xNjgzIC04NTcgYzE3IC0xMCAyNjIgLTI1MSA1NDcgLTUzNiA1NDggLTU1MCA1MzkgLTUzOSA1MjQgLTYxOCAtMTggLTk2IC0xNDEgLTE1NSAtMjIxIC0xMDcgLTE2IDExIC0yNjUgMjUyIC01NTIgNTM4IC00NjUgNDYxIC01MjMgNTIzIC01MjkgNTU3IC0xNCA4MiAyNyAxNTYgMTAxIDE4MiA0NSAxNiA4NiAxMSAxMzAgLTE2eiBtLTI4IC04MzAgYzMyIC0xMiAyMTggLTE5MSAyMzkgLTIzMSAzMSAtNTkgOSAtMTQ2IC00NyAtMTg3IC0zNSAtMjYgLTkzIC0zNyAtMTM2IC0yNiAtMzAgNyAtMjI2IDE5NCAtMjQ5IDIzNyAtNjAgMTE1IDY5IDI1NCAxOTMgMjA3eiIvPgo8L2c+Cjwvc3ZnPg=="
              alt="Logo"
              className="rounded-sm"
              width={28}
              height={28}
            />
            <span className="text-base font-semibold">Shadcnuikit</span>
          </Link>

          <NavigationMenu
            viewport={false}
            className="hidden max-w-none flex-1 justify-center md:flex"
          >
            <NavigationMenuList className="gap-3 text-sm font-medium">
              {NAV_ITEMS.map((item) => (
                <NavigationMenuItem key={item.label}>
                  <NavigationMenuLink
                    asChild
                    className="text-muted-foreground hover:text-foreground text-sm font-medium"
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-2">
            <Button size="lg" variant="outline" className="rounded-full">
              Login
            </Button>
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
                className="flex h-full w-3/4 flex-col px-4 py-6 sm:max-w-xs"
              >
                <SheetHeader className="p-0">
                  <SheetTitle className="text-left font-normal">
                    Menu
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 space-y-2 text-sm font-medium">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      href={item.href}
                      className="block py-3 text-left text-sm"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>

      {/* Hero Content */}
      <div className="container mx-auto flex flex-col items-center space-y-14 px-4 pt-16 text-center md:pt-24">
        <div className="max-w-3xl">
          <Link
            href="#"
            className="mb-4 inline-flex items-center justify-center"
          >
            <Badge
              variant="outline"
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-medium text-indigo-600 dark:text-indigo-400 hover:bg-muted md:text-sm"
            >
              New AI powered customer analytics for SaaS teams
              <ArrowRight className="size-4" />
            </Badge>
          </Link>

          <h1 className="mb-3 text-4xl leading-tight font-bold text-balance md:text-5xl">
            Turn product data into{" "}
            <span className="bg-linear-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400">
              revenue growing decisions
            </span>
          </h1>

          <p className="text-muted-foreground text-lg leading-relaxed text-balance md:text-xl">
            Connect your SaaS, billing, and marketing tools into a single
            workspace. Understand trials, churn, and expansion revenue in
            minutes not days.
          </p>

          <div className="mt-10">
            <Button size="lg">
              Start Free Trial
              <ArrowRight />
            </Button>
          </div>
        </div>

        <figure className="relative w-full max-w-5xl overflow-hidden rounded-t-xl">
          <img
            src="https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=1600&auto=format&fit=crop"
            alt="SaaS analytics dashboard on laptop"
            className="aspect-video w-full object-cover"
          />
        </figure>
      </div>
    </>
  );
}
