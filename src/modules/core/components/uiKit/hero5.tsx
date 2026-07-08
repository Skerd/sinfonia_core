import { Sun } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@coreModule/components/uiKit/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@coreModule/components/uiKit/ui/navigation-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@coreModule/components/uiKit/ui/sheet";
import { AlignJustify } from "lucide-react";

const NAV_LINKS = [
  { label: "Product", href: "#" },
  { label: "Use cases", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Templates", href: "#" },
];

export default function HeroSection() {
  return (
    <>
      <header>
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between p-4">
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
            <Button
              variant="outline"
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

      <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-14 lg:grid-cols-2 lg:py-24">
        <div className="space-y-6 text-center lg:space-y-8 lg:text-start">
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 rounded-full px-2 py-1"
          >
            <Sun className="size-4 animate-spin" />
            2.0 version is here
          </Badge>

          <div className="mx-auto max-w-xl space-y-4 text-center lg:mx-0 lg:text-start">
            <h1 className="text-4xl leading-tight font-bold lg:text-5xl">
              <span>Welcome to the</span> <br />
              <span className="text-muted-foreground italic">innovation</span>
              <span className="text-muted-foreground not-italic"> oasis</span>
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed">
              Step into our innovation oasis, where groundbreaking ideas bloom,
              and every click is a step into a world of endless possibilities.
            </p>
          </div>

          <div className="flex justify-center gap-3 lg:justify-start">
            <Button size="lg" className="rounded-full">
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="rounded-full">
              Watch Demo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
          <div className="space-y-6">
            <Card className="overflow-hidden border-none p-0 shadow-none lg:mt-8">
              <img
                src="https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Mobile app"
                className="aspect-video w-full object-cover lg:aspect-4/3"
              />
            </Card>
            <Card className="bg-muted aspect-video border-none shadow-none lg:aspect-4/3">
              <CardContent className="flex h-full flex-col justify-end">
                <div>
                  <div className="mb-2 text-2xl font-medium md:text-3xl">
                    27k+
                  </div>
                  <div className="text-muted-foreground">
                    Raised by startups
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 lg:space-y-6">
            <Card className="bg-muted aspect-video border-none shadow-none lg:aspect-4/3">
              <CardContent className="flex h-full flex-col justify-end">
                <div>
                  <div className="mb-2 text-2xl font-medium md:text-3xl">
                    $14B
                  </div>
                  <div className="text-muted-foreground">
                    Funds & Syndicates
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="aspect-video border-none bg-amber-50 shadow-none lg:aspect-4/3 dark:bg-amber-950">
              <CardContent className="flex h-full flex-col justify-end">
                <div className="mb-2 text-2xl font-medium md:text-3xl">80k</div>
                <div className="text-muted-foreground mb-3">Active members</div>
                <div className="flex -space-x-2">
                  <Avatar className="border-3 border-amber-50 lg:size-10 dark:border-amber-950">
                    <AvatarImage
                      src="https://i.pravatar.cc/80?img=11"
                      alt="User"
                    />
                    <AvatarFallback>U1</AvatarFallback>
                  </Avatar>
                  <Avatar className="border-3 border-amber-50 lg:size-10 dark:border-amber-950">
                    <AvatarImage
                      src="https://i.pravatar.cc/80?img=12"
                      alt="User"
                    />
                    <AvatarFallback>U2</AvatarFallback>
                  </Avatar>
                  <Avatar className="border-3 border-amber-50 lg:size-10 dark:border-amber-950">
                    <AvatarImage
                      src="https://i.pravatar.cc/80?img=13"
                      alt="User"
                    />
                    <AvatarFallback>U3</AvatarFallback>
                  </Avatar>
                  <Avatar className="border-3 border-amber-50 lg:size-10 dark:border-amber-950">
                    <AvatarImage
                      src="https://i.pravatar.cc/80?img=14"
                      alt="User"
                    />
                    <AvatarFallback>U4</AvatarFallback>
                  </Avatar>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
