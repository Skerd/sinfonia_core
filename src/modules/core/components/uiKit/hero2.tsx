import Link from "next/link";
import { ArrowRightIcon, StarIcon } from "lucide-react";

import { Avatar, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Badge } from "@coreModule/components/uiKit/ui/badge";

export default function HeroSection() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20 lg:max-w-7xl lg:px-8">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <div className="hidden sm:mb-4 sm:flex sm:justify-center">
            <Link
              href="#"
              className="hover:bg-muted/50 relative space-x-2 rounded-full border px-2 py-1 text-sm"
            >
              <Badge className="rounded-full">New</Badge>
              <span className="text-muted-foreground">
                Announcing our next round of funding.
              </span>
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-foreground text-4xl leading-tight font-bold md:text-5xl">
              Empower Your Creativity with Innovative Tools
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
              <Button
                size="lg"
                variant="ghost"
                className="font-semibold"
                asChild
              >
                <Link href="#">
                  Learn more <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="mx-auto mt-10 flex w-fit flex-col items-center gap-4 sm:flex-row">
              <span className="inline-flex items-center -space-x-3">
                <Avatar className="ring-background rounded-full ring-2">
                  <AvatarImage
                    src="https://i.pravatar.cc/80?img=1"
                    alt="User avatar"
                  />
                </Avatar>
                <Avatar className="ring-background rounded-full ring-2">
                  <AvatarImage
                    src="https://i.pravatar.cc/80?img=2"
                    alt="User avatar"
                  />
                </Avatar>
                <Avatar className="ring-background rounded-full ring-2">
                  <AvatarImage
                    src="https://i.pravatar.cc/80?img=3"
                    alt="User avatar"
                  />
                </Avatar>
                <Avatar className="ring-background rounded-full ring-2">
                  <AvatarImage
                    src="https://i.pravatar.cc/80?img=4"
                    alt="User avatar"
                  />
                </Avatar>
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <StarIcon className="size-4 fill-yellow-400 text-yellow-400" />
                  <StarIcon className="size-4 fill-yellow-400 text-yellow-400" />
                  <StarIcon className="size-4 fill-yellow-400 text-yellow-400" />
                  <StarIcon className="size-4 fill-yellow-400 text-yellow-400" />
                  <StarIcon className="size-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-muted-foreground text-xs">5.0</span>
                </div>
                <div className="text-muted-foreground text-left text-xs">
                  from 200+ reviews
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
