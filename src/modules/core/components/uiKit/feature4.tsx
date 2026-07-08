import {
  FileText,
  Calendar,
  Puzzle,
  BookOpen,
  BarChart3,
  Presentation,
} from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: FileText,
    title: "Performance Metrics",
    description: "Discover the impact of our platform's analytics and outcomes",
    side: "left",
  },
  {
    icon: Calendar,
    title: "Scheduled Events",
    description:
      "Structured to deliver the tools and networking opportunities you require",
    side: "left",
  },
  {
    icon: Puzzle,
    title: "Third-Party Connections",
    description:
      "Unify your applications and information. Connect with numerous external services.",
    side: "left",
  },
  {
    icon: BookOpen,
    title: "Expert Documentation",
    description:
      "Comprehensive guide covering all capabilities to maximize platform utilization",
    side: "right",
  },
  {
    icon: BarChart3,
    title: "Live Analytics",
    description:
      "Access instant visibility into performance and enable teams to monitor their progress",
    side: "right",
  },
  {
    icon: Presentation,
    title: "Project Planning",
    description:
      "Design and arrange workflows as needed. Efficiently managing assignments.",
    side: "right",
  },
];

export default function FeatureSectionFour() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <header className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="text-foreground mb-4 text-3xl md:text-4xl font-bold">
            Our Advanced Capabilities
          </h2>
          <p className="text-muted-foreground md:text-lg">
            Leveraging innovation to make analytics clearer, more intelligent
            and more valuable.
          </p>
        </header>

        <div className="relative">
          <div className="grid justify-center gap-4 lg:gap-12 lg:grid-cols-12 lg:items-center">
            <div className="space-y-8 lg:col-span-3">
              {features
                .filter((f) => f.side === "left")
                .map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title} className="space-y-2 md:space-y-3">
                      <div className="bg-primary/10 inline-flex size-12 items-center justify-center rounded-full">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="text-foreground md:text-lg font-medium">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
            </div>

            <figure className="w-full flex-1 lg:col-span-6">
              <Image
                src="https://images.unsplash.com/photo-1551721434-8b94ddff0e6d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Feature Section 4"
                width={500}
                height={1000}
                className="w-full aspect-square object-cover rounded-lg"
              />
            </figure>

            <div className="space-y-8 lg:col-span-3">
              {features
                .filter((f) => f.side === "right")
                .map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title} className="space-y-2 md:space-y-3">
                      <div className="bg-primary/10 inline-flex size-12 items-center justify-center rounded-full">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="text-foreground md:text-lg font-medium">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
