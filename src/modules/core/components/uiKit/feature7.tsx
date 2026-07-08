import {
  User,
  Palette,
  Monitor,
  Layers,
  Clock,
  Heart,
  ArrowRight,
  Cloud,
} from "lucide-react";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import Image from "next/image";

const features = [
  {
    icon: User,
    title: "User-centric approach",
    description:
      "Focusing on user experience to create functional and scalable cloud solutions.",
  },
  {
    icon: Palette,
    title: "Custom infrastructure solutions",
    description:
      "Tailored cloud setups that perfectly align with your business goals and technical requirements.",
  },
  {
    icon: Monitor,
    title: "Multi-platform compatibility",
    description:
      "Ensuring seamless performance across all devices and platforms, from servers to mobile clients.",
  },
  {
    icon: Layers,
    title: "Collaborative deployment",
    description:
      "Working together to transform your infrastructure needs into robust cloud architectures.",
  },
  {
    icon: Clock,
    title: "Timely deployment",
    description:
      "Committed to delivering high-quality infrastructure solutions on time, every time.",
  },
  {
    icon: Heart,
    title: "Ongoing support",
    description:
      "Providing continuous assistance to keep your cloud infrastructure optimized and secure.",
  },
];

export default function FeatureSectionSeven() {
  return (
    <section className="py-14 sm:py-16">
      <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-8">
          <div className="space-y-4">
            <Badge
              variant="outline"
              className="text-[10px] font-light tracking-wider uppercase"
            >
              <Cloud />
              Cloud Infrastructure
            </Badge>

            <h3 className="text-3xl leading-tight font-bold text-balance lg:text-4xl/tight">
              Building scalable solutions, engineered for your success
            </h3>
          </div>

          <div className="flex flex-col justify-center space-y-6">
            <p className="text-muted-foreground leading-relaxed sm:text-lg">
              Our cloud infrastructure transforms your business into a
              high-performance digital ecosystem. From deployment to
              optimization, we focus on innovative solutions that scale and
              drive growth.
            </p>

            <Button className="w-fit">
              Let&apos;s talk
              <ArrowRight />
            </Button>
          </div>
        </div>

        <div className="bg-muted overflow-hidden rounded-2xl">
          <div className="relative aspect-4/2 w-full">
            <div
              className="absolute inset-0 opacity-20 dark:opacity-10"
              style={{
                backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />

            <Image
              src="https://images.unsplash.com/photo-1708559348128-3cde89847e2b?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Cloud infrastructure"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-8">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card
                key={feature.title}
                className="bg-background border-0 py-0 shadow-none"
              >
                <CardContent className="p-0">
                  <div className="mb-4">
                    <div className="bg-primary/10 inline-flex size-10 items-center justify-center rounded-full">
                      <Icon className="text-foreground size-4" />
                    </div>
                  </div>
                  <h4 className="text-foreground mb-2 text-lg font-medium">
                    {feature.title}
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
