import Link from "next/link";
import { Facebook, Instagram, Twitter, Linkedin, Youtube } from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Input } from "@coreModule/components/uiKit/ui/input";
import { Separator } from "@coreModule/components/uiKit/ui/separator";

export default function Footer() {
  return (
    <footer>
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[400px_1fr]">
          <div className="lg:col-span-1">
            <h2 className="text-foreground mb-2 text-xl">Shadcn UI Kit</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Join our newsletter to stay up to date on features and releases.
            </p>

            <div className="max-w-2xl space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="grow"
                />
                <Button variant="outline">Subscribe</Button>
              </div>
              <p className="text-muted-foreground text-xs">
                By subscribing you agree to with our{" "}
                <Link
                  href="/privacy"
                  className="hover:text-foreground underline"
                >
                  Privacy Policy
                </Link>{" "}
                and provide consent to receive updates from our company.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 lg:ps-20">
            {/* Column One */}
            <div>
              <h5 className="text-foreground mb-4 font-semibold">Company</h5>
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

            {/* Column Two */}
            <div>
              <h5 className="text-foreground mb-4 font-semibold">Products</h5>
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

            {/* Follow Us Section */}
            <div>
              <h5 className="text-foreground mb-4 font-semibold">Follow us</h5>
              <ul className="text-muted-foreground [&_a]:hover:text-foreground space-y-2 [&_a]:text-sm [&_a]:hover:underline [&_a]:flex [&_a]:items-center [&_a]:gap-2">
                <li>
                  <Link href="https://facebook.com">
                    <span className="bg-primary flex size-6 items-center justify-center rounded-md">
                      <Facebook className="text-primary-foreground size-3" />
                    </span>
                    Facebook
                  </Link>
                </li>
                <li>
                  <Link href="https://instagram.com">
                    <span className="bg-primary flex size-6 items-center justify-center rounded-md">
                      <Instagram className="text-primary-foreground size-3" />
                    </span>
                    Instagram
                  </Link>
                </li>
                <li>
                  <Link href="https://twitter.com">
                    <span className="bg-primary flex size-6 items-center justify-center rounded-md">
                      <Twitter className="text-primary-foreground size-3" />
                    </span>
                    Twitter
                  </Link>
                </li>
                <li>
                  <Link href="https://linkedin.com">
                    <span className="bg-primary flex size-6 items-center justify-center rounded-md">
                      <Linkedin className="text-primary-foreground size-3" />
                    </span>
                    LinkedIn
                  </Link>
                </li>
                <li>
                  <Link href="https://youtube.com">
                    <span className="bg-primary flex size-6 items-center justify-center rounded-md">
                      <Youtube className="text-primary-foreground size-3" />
                    </span>
                    Youtube
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          {/* Copyright */}
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Shadcn UI Kit. All rights reserved.
          </p>

          {/* Legal Links */}
          <div className="flex space-x-3 text-xs">
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              Cookies Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
