"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@coreModule/components/uiKit/ui/sheet";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-muted h-full pt-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-background flex h-16 items-center justify-between rounded-lg border px-4">
          <div className="flex items-center">
            <Link href="/" className="text-foreground text-xl font-bold">
              Logo
            </Link>
          </div>

          <div className="hidden items-center space-x-8 md:flex">
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground text-sm font-medium">
              Features
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground text-sm font-medium">
              Pricing
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground text-sm font-medium">
              About
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground text-sm font-medium">
              Resources
            </Link>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden items-center space-x-3 md:flex">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
            <Button size="sm">Get Started</Button>
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
                <div className="flex flex-col">
                  <Link href="#" className="py-2" onClick={() => setIsOpen(false)}>
                    Features
                  </Link>
                  <Link href="#" className="py-2" onClick={() => setIsOpen(false)}>
                    Pricing
                  </Link>
                  <Link href="#" className="py-2" onClick={() => setIsOpen(false)}>
                    About
                  </Link>
                  <Link href="#" className="py-2" onClick={() => setIsOpen(false)}>
                    Resources
                  </Link>
                </div>
              </div>
              <div className="flex flex-col space-y-3">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Sign In
                </Button>
                <Button onClick={() => setIsOpen(false)}>Get Started</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
