import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";

export default function CTASection() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-32 lg:px-8">
        <div className="relative z-10 flex flex-col justify-between lg:flex-row">
          <div className="mb-5 space-y-2 text-center lg:mb-0 lg:text-left">
            <h2 className="text-3xl font-bold lg:text-4xl">Start using our app today.</h2>
            <p className="text-muted-foreground lg:text-lg">
              Contact us with any query or any idea.
            </p>
          </div>
          <div className="text-center lg:text-left">
            <Button size="lg" asChild>
              <Link href="#">
                Get Started
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </div>

        <div className="absolute inset-0 z-0 [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#6366f1_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,var(--background)_40%,var(--color-purple-700)_100%)]" />
      </div>
    </section>
  );
}
