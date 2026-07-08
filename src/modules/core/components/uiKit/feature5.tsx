import { Link2, ThumbsUp, Grid2x2, Clock } from "lucide-react";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import Image from "next/image";

const features = [
  {
    icon: Link2,
    title: "Streamline Profile Updates",
    description:
      "Enjoy the straightforward approach of our platform's profile management system.",
  },
  {
    icon: ThumbsUp,
    title: "Highly Adaptable",
    description:
      "System is built to be versatile and configurable, allowing you to customize it according to your specific requirements.",
  },
  {
    icon: Grid2x2,
    title: "Diverse Solutions",
    description:
      "Offers you numerous choices of industry solutions to enhance your experience with our platform",
  },
  {
    icon: Clock,
    title: "Rapid Processing",
    description:
      "Enhance your productivity and increase your efficiency with our high-performance infrastructure",
  },
];

export default function FeatureSectionFive() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto mb-12 max-w-xl space-y-2 text-center">
          <Badge variant="outline">Our 300+ Integration Options</Badge>
          <h2 className="text-foreground text-3xl leading-tight font-bold text-balance lg:text-4xl">
            Build Better Customer Relationships
          </h2>
        </header>

        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="space-y-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex gap-4">
                  <div className="shrink-0">
                    <div className="bg-primary/10 mt-1 inline-flex size-10 items-center justify-center rounded-lg">
                      <Icon className="size-4" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <h3 className="font-medium">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed text-balance">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <figure className="relative">
            <Image
              src="https://images.unsplash.com/photo-1551721434-8b94ddff0e6d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Feature Section 5"
              width={500}
              height={1000}
              className="aspect-square rounded-lg object-cover"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
