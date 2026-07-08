import { Badge } from "@coreModule/components/uiKit/ui/badge";

const FEATURES = [
  {
    step: "01",
    title: "Intuitive interface",
    description:
      "Clean and straightforward design that anyone can master in minutes, not hours or days.",
  },
  {
    step: "02",
    title: "Lightning speed",
    description:
      "Optimized performance with smart caching and CDN delivery for seamless user experience.",
  },
  {
    step: "03",
    title: "Bank-level security",
    description:
      "Industry-standard encryption, regular security audits, and compliance certifications you can trust.",
  },
  {
    step: "04",
    title: "Fair pricing",
    description:
      "Simple, transparent pricing with no surprises. Choose the plan that fits your needs.",
  },
  {
    step: "05",
    title: "Dedicated support",
    description:
      "Expert support team ready to help whenever you need assistance. We're here for you.",
  },
  {
    step: "06",
    title: "Flexible integrations",
    description:
      "Connect with your favorite tools through robust APIs and seamless third-party integrations.",
  },
] as const;

export default function FeatureSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <header className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <div className="mb-2 flex justify-center">
            <Badge variant="outline">Features</Badge>
          </div>
          <h2 className="text-3xl leading-tight font-bold text-balance md:text-4xl">
            Everything you need to succeed
          </h2>
          <p className="text-muted-foreground mt-4 text-base text-balance md:text-lg">
            Powerful features designed to help your team work smarter and
            deliver results faster.
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:gap-10">
          {FEATURES.map((feature) => (
            <div key={feature.step} className="flex gap-3 sm:gap-4">
              <div className="text-primary flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium sm:size-12 sm:text-lg">
                {feature.step}
              </div>
              <div className="space-y-1.5">
                <h3 className="font-medium md:text-lg">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
