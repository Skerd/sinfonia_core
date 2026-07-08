import { ArrowUpRight } from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import Image from "next/image";

export default function FeatureSectionNine() {
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:space-y-4 lg:px-8">
        <div className="grid items-start gap-4 sm:gap-4 lg:grid-cols-2 lg:gap-10">
          <figure className="relative aspect-4/3 w-full overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1708559348128-3cde89847e2b?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0"
              fill
              className="object-cover"
              alt="Productivity tracking dashboard"
            />
          </figure>

          <div className="space-y-4 lg:space-y-6">
            <div className="space-y-2">
              <div className="text-muted-foreground text-xs tracking-wider uppercase">
                <span className="me-2 inline-block size-2 rounded-full bg-blue-500"></span>
                Track Productivity
              </div>

              <h3 className="text-2xl leading-tight font-bold text-balance sm:text-3xl lg:text-4xl/tight">
                Easily monitor what your team is working on
              </h3>
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed sm:text-base lg:text-lg">
              Easily monitor team activities with built-in progress tracking and
              real-time updates — giving you clarity, control, and peace of mind
              over every project milestone.
            </p>

            <Button variant="outline" size="lg">
              Get Started
              <ArrowUpRight />
            </Button>
          </div>
        </div>

        <div className="grid items-end gap-4 sm:gap-4 lg:grid-cols-2 lg:gap-10">
          <div className="order-2 space-y-4 lg:order-1 lg:space-y-6">
            <div className="space-y-2">
              <div className="text-muted-foreground text-xs tracking-wider uppercase">
                <span className="me-2 inline-block size-2 rounded-full bg-blue-500"></span>
                Analytics & Insights
              </div>

              <h3 className="text-2xl leading-tight font-bold text-balance sm:text-3xl lg:text-4xl/tight">
                Get detailed insights into your team&apos;s performance
              </h3>
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed sm:text-base lg:text-lg">
              Access comprehensive analytics and performance metrics that help
              you make data-driven decisions. Track key indicators, identify
              trends, and optimize your workflow for better results.
            </p>

            <Button variant="outline" size="lg">
              Learn More
              <ArrowUpRight />
            </Button>
          </div>

          <figure className="relative order-1 aspect-4/3 w-full overflow-hidden lg:order-2">
            <Image
              src="https://images.unsplash.com/photo-1763986665850-6e66549aa8e0?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              fill
              className="object-cover"
              alt="Team productivity dashboard"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
