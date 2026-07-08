import Link from "next/link";
import { Separator } from "@coreModule/components/uiKit/ui/separator";
import { Facebook, Twitter, Instagram, Linkedin, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-12">
      <div className="mx-auto max-w-7xl space-y-6 px-4">
        <div className="flex flex-col items-center justify-between lg:flex-row space-y-4 lg:space-y-0">
          {/* Logo */}
          <Link href="/" className="text-center">
            <h4 className="text-foreground text-xl">Shadcn UI Kit</h4>
          </Link>

          {/* Navigation Links */}
          <nav className="text-muted-foreground [&_a]:hover:text-primary flex flex-wrap justify-center gap-4 [&_a]:text-sm">
            <Link href="#">About</Link>
            <Link href="#">Services</Link>
            <Link href="#">Products</Link>
            <Link href="#">Contact</Link>
            <Link href="#">Blog</Link>
          </nav>

          <div className="text-muted-foreground [&_a]:hover:text-primary flex justify-center space-x-6 [&_a]:text-sm">
            <Link href="https://facebook.com" aria-label="Facebook">
              <Facebook className="size-4" />
            </Link>
            <Link href="https://twitter.com" aria-label="Twitter">
              <Twitter className="size-4" />
            </Link>
            <Link href="https://instagram.com" aria-label="Instagram">
              <Instagram className="size-4" />
            </Link>
            <Link href="https://linkedin.com" aria-label="LinkedIn">
              <Linkedin className="size-4" />
            </Link>
            <Link href="https://github.com" aria-label="GitHub">
              <Github className="size-4" />
            </Link>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          {/* Copyright */}
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Shadcn UI Kit. All rights reserved.
          </p>

          {/* Legal Links */}
          <div className="flex gap-4">
            <Link
              href="#"
              className="text-muted-foreground hover:text-primary text-xs hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-primary text-xs hover:underline"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-primary text-xs hover:underline"
            >
              Cookie Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
