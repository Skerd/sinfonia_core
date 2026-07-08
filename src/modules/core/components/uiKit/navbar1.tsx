"use client";

import { ChevronDown, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@coreModule/components/uiKit/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@coreModule/components/uiKit/ui/sheet";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="flex h-16 w-full items-center justify-between border-b p-4">
      {/* Logo */}
      <div className="flex items-center">
        <Link href="/" className="text-foreground text-xl font-bold">
          Logo
        </Link>
      </div>

      {/* Desktop Navigation - Center */}
      <div className="hidden items-center space-x-8 md:flex">
        <Link href="#" className="text-muted-foreground hover:text-foreground text-sm font-medium">
          Features
        </Link>
        <Link href="#" className="text-muted-foreground hover:text-foreground text-sm font-medium">
          Pricing
        </Link>
        <Link href="#" className="text-muted-foreground hover:text-foreground text-sm font-medium">
          About
        </Link>

        {/* Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground flex items-center space-x-1 text-sm font-medium">
            <span>Resources</span>
            <ChevronDown className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuItem>
              <Link href="#" className="w-full">
                Blog
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="#" className="w-full">
                Documentation
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="#" className="w-full">
                Support
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="#" className="w-full">
                API Reference
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
            </div>

            <div className="flex flex-col space-y-2">
              <span className="text-muted-foreground py-2 font-medium">Resources</span>
              <div className="flex flex-col">
                <Link href="#" className="py-2" onClick={() => setIsOpen(false)}>
                  Blog
                </Link>
                <Link href="#" className="py-2" onClick={() => setIsOpen(false)}>
                  Documentation
                </Link>
                <Link href="#" className="py-2" onClick={() => setIsOpen(false)}>
                  Support
                </Link>
                <Link href="#" className="py-2" onClick={() => setIsOpen(false)}>
                  API Reference
                </Link>
              </div>
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
    </nav>
  );
}
