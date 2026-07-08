import { Zap, DollarSign, Sparkles, Wand2, ArrowUpRight } from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";

const features = [
  {
    icon: Zap,
    title: "Rapid Generation",
    description:
      "Accelerate content creation instantly with workflows far faster than traditional writing methods.",
    color: "purple",
    highlighted: true,
  },
  {
    icon: DollarSign,
    title: "Cost Effective",
    description:
      "Significantly reduce production expenses with no need for professional writers tools.",
    color: "purple",
    highlighted: false,
  },
  {
    icon: Sparkles,
    title: "Premium Quality Output",
    description:
      "Produce natural, polished, and high-standard content automatically every single time you generate.",
    color: "purple",
    highlighted: false,
  },
  {
    icon: Wand2,
    title: "Flexible Customization",
    description:
      "Enjoy a fast, highly intuitive generation process using advanced, easy-to-control customization tools.",
    color: "purple",
    highlighted: false,
  },
];

export default function FeatureSectionThree() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-12 grid max-w-3xl gap-4 md:items-start lg:max-w-max lg:grid-cols-2 lg:gap-12">
          <h2 className="text-3xl leading-tight font-bold text-balance md:text-4xl">
            Generate{" "}
            <span className="bg-linear-to-r from-purple-500 to-blue-600 bg-clip-text text-transparent">
              exceptional
            </span>{" "}
            content instantly!
          </h2>

          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-balance md:text-lg">
              Transform Concepts into Content in Minutes: Empower Your Writing
              Process with Our AI Content Generator
            </p>
            <Button size="lg" className="w-fit">
              Try ContentAI
              <ArrowUpRight />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card
                key={feature.title}
                className="group hover:border-primary relative shadow-none transition-colors"
              >
                <CardContent>
                  <div className="mb-4">
                    <div className="bg-primary inline-flex size-12 items-center justify-center rounded-full">
                      <Icon className="text-primary-foreground size-5 transition-transform group-hover:rotate-12" />
                    </div>
                  </div>

                  <h4 className="text-foreground mb-2 md:text-lg font-medium">
                    {feature.title}
                  </h4>

                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                    {feature.description}
                  </p>

                  <Link
                    href="#"
                    className="text-foreground inline-flex items-center gap-1 text-sm font-medium transition-colors hover:underline"
                  >
                    Learn more
                    <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
