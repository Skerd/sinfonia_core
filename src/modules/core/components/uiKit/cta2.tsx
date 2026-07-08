import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";

export default function CTASection() {
  return (
    <div className="relative px-4 py-16 sm:px-6 sm:py-32 lg:px-8">
      <div className="relative z-10 space-y-4 text-center">
        <h2 className="text-3xl font-bold text-balance lg:text-4xl/tight">
          Start using our app today.
        </h2>
        <p className="text-muted-foreground lg:text-lg">
          Contact us with any query or any idea.
        </p>
        <div className="flex justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="#">Get Started</Link>
          </Button>
          <Button variant="link" size="lg" asChild>
            <Link href="#">
              Learn more
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </div>

      <div
        className="absolute inset-0 z-0 dark:opacity-15"
        style={{
          backgroundImage: `
        linear-gradient(to right, #e7e5e4 1px, transparent 1px),
        linear-gradient(to bottom, #e7e5e4 1px, transparent 1px)
      `,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 0",
          maskImage: `
        repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)
      `,
          WebkitMaskImage: `
 repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)
      `,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />
    </div>
  );
}
