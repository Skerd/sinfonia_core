import Link from "next/link";
import { Facebook, Instagram, Twitter, Linkedin, Youtube } from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Input } from "@coreModule/components/uiKit/ui/input";
import { Separator } from "@coreModule/components/uiKit/ui/separator";

export default function Footer() {
  return (
    <footer>
      <div className="mx-auto max-w-7xl space-y-4 py-10 lg:py-16 lg:space-y-8 px-4">
        <div className="flex flex-col items-start justify-between md:flex-row md:items-center">
          <div className="mb-8 lg:mb-0 lg:max-w-md">
            <h3 className="text-foreground mb-2 text-xl">
              Join our newsletter
            </h3>
            <p className="text-muted-foreground text-sm text-balance">
              Stay updated with the latest news, insights, and exclusive offers
              delivered straight to your inbox.
            </p>
          </div>

          <div className="w-full lg:w-auto">
            <div className="mb-2 flex flex-col gap-3 sm:flex-row">
              <Input
                type="email"
                placeholder="Enter your email"
                className="min-w-[280px] flex-1"
              />
              <Button className="whitespace-nowrap">Subscribe</Button>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-8 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <h2 className="text-foreground mb-6 text-xl">Shadcn UI Kit</h2>
          </div>

          <div>
            <h5 className="text-foreground mb-3 font-semibold">Company</h5>
            <ul className="text-muted-foreground [&_a]:hover:text-foreground space-y-1 [&_a]:text-sm [&_a]:hover:underline">
              <li>
                <Link href="/about">About Us</Link>
              </li>
              <li>
                <Link href="/careers">Careers</Link>
              </li>
              <li>
                <Link href="/team">Our Team</Link>
              </li>
              <li>
                <Link href="/investors">Investors</Link>
              </li>
              <li>
                <Link href="/news">News</Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-foreground mb-3 font-semibold">Products</h5>
            <ul className="text-muted-foreground [&_a]:hover:text-foreground space-y-1 [&_a]:text-sm [&_a]:hover:underline">
              <li>
                <Link href="/platform">Platform</Link>
              </li>
              <li>
                <Link href="/analytics">Analytics</Link>
              </li>
              <li>
                <Link href="/automation">Automation</Link>
              </li>
              <li>
                <Link href="/integrations">Integrations</Link>
              </li>
              <li>
                <Link href="/api">API</Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-foreground mb-3 font-semibold">Resources</h5>
            <ul className="text-muted-foreground [&_a]:hover:text-foreground space-y-1 [&_a]:text-sm [&_a]:hover:underline">
              <li>
                <Link href="/blog">Blog</Link>
              </li>
              <li>
                <Link href="/documentation">Documentation</Link>
              </li>
              <li>
                <Link href="/tutorials">Tutorials</Link>
              </li>
              <li>
                <Link href="/case-studies">Case Studies</Link>
              </li>
              <li>
                <Link href="/webinars">Webinars</Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-foreground mb-4 font-semibold">Support</h5>
            <ul className="text-muted-foreground [&_a]:hover:text-foreground space-y-1 [&_a]:text-sm [&_a]:hover:underline">
              <li>
                <Link href="/help">Help Center</Link>
              </li>
              <li>
                <Link href="/contact">Contact Us</Link>
              </li>
              <li>
                <Link href="/community">Community</Link>
              </li>
              <li>
                <Link href="/status">System Status</Link>
              </li>
              <li>
                <Link href="/feedback">Feedback</Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Shadcn UI Kit. All rights reserved.
          </p>

          <div className="[&_a]:text-muted-foreground flex space-x-4 [&_a]:text-xs [&_a]:hover:underline">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/cookies">Cookies Settings</Link>
          </div>

          <div className="[&_a]:hover:text-foreground [&_a]:text-muted-foreground flex space-x-4 [&_a]:text-sm [&_a]:hover:transition-colors">
            <Link href="https://facebook.com" aria-label="Facebook">
              <Facebook className="size-4" />
            </Link>
            <Link href="https://instagram.com" aria-label="Instagram">
              <Instagram className="size-4" />
            </Link>
            <Link href="https://twitter.com" aria-label="Twitter">
              <Twitter className="size-4" />
            </Link>
            <Link href="https://linkedin.com" aria-label="LinkedIn">
              <Linkedin className="size-4" />
            </Link>
            <Link href="https://youtube.com" aria-label="YouTube">
              <Youtube className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
