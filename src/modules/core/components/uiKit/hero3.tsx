import { ArrowRightIcon, PlayCircleIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Button } from "@coreModule/components/uiKit/ui/button";

export default function HeroSection() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20 lg:max-w-7xl lg:px-8">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <div className="hidden sm:mb-4 sm:flex sm:justify-center">
            <Link
              href="#"
              className="hover:bg-muted/50 flex items-center gap-2 rounded-full border px-2 py-1 text-sm"
            >
              <Badge>New</Badge>v2.2 is out now!
              <Link href="#" className="block">
                <ArrowRightIcon className="ms-1 size-4" />
              </Link>
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-foreground text-4xl leading-tight font-bold md:text-5xl">
              Empower Your Creativity with{" "}
              <span className="relative inline-block before:absolute before:-inset-1 before:block before:-skew-y-3 before:bg-purple-600">
                <span className="relative text-white">Innovative</span>
              </span>{" "}
              Tools
            </h1>
            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
              Unlock your potential with a suite of tools designed to transform
              your ideas into reality. Create, build, and inspire with ease
              while achieving stunning results that truly stand out.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-3">
              <Button size="lg" asChild>
                <Link href="#">Get started</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="#">
                  <PlayCircleIcon /> Watch video
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
