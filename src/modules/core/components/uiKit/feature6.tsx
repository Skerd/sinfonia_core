import { CheckCircle2, Layers, Lock, ThumbsUp } from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: CheckCircle2,
    title: "Data Protection",
    description:
      "Advanced privacy controls ensure your confidential information and personal details remain protected.",
  },
  {
    icon: Layers,
    title: "Zero Cost Transfers",
    description:
      "No transfer charges, allowing you to reduce expenses and optimize your financial returns.",
  },
  {
    icon: Lock,
    title: "Enhanced Protection",
    description:
      "Enjoy the confidence that comes with understanding your information is fully safeguarded.",
  },
  {
    icon: ThumbsUp,
    title: "Unified Platform",
    description:
      "Comprehensive platform guarantees that you can effortlessly handle all your business requirements.",
  },
];

export default function FeatureSectionSix() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-5xl space-y-8 px-4 md:space-y-12">
        <header className="max-w-xl space-y-4">
          <h2 className="text-3xl leading-tight font-bold text-balance md:text-4xl">
            Seamless collaboration tools for your team
          </h2>
          <p className="text-muted-foreground md:text-lg">
            Rely on the precision and clarity of our platform&apos;s
            collaboration features, which deliver instant synchronization and
            alerts on your team activities and project updates.
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-5 lg:items-center">
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="space-y-3">
                  <div className="inline-flex size-10 items-center justify-center rounded-lg border">
                    <Icon className="size-4" />
                  </div>
                  <h3 className="text-foreground font-medium md:text-lg">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          <figure className="relative lg:col-span-2">
            <Image
              src="https://images.unsplash.com/photo-1551721434-8b94ddff0e6d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Feature Section 5"
              width={300}
              height={1000}
              className="aspect-square w-full rounded-lg object-cover"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
