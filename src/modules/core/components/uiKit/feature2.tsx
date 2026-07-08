import {
  Maximize2,
  RectangleVertical,
  Layers,
  FileCheck,
  Grid3x3,
  Target,
} from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { cn } from "@coreModule/components/lib/utils";

const features = [
  {
    icon: RectangleVertical,
    title: "Theme Customization",
    description:
      "Choose from preset themes or design your own color palette and typography system.",
    color: "red",
  },
  {
    icon: Layers,
    title: "Component Library",
    description:
      "Extensive collection of pre-built components ready to use in your projects.",
    color: "green",
  },
  {
    icon: FileCheck,
    title: "Unified Workspace",
    description:
      "Access all design resources and tools within a single integrated environment.",
    color: "blue",
  },
  {
    icon: Grid3x3,
    title: "Complete Design System",
    description:
      "Utilize comprehensive design elements for websites, applications, and presentations.",
    color: "orange",
  },
];

const colorClasses = {
  purple: {
    bg: "bg-purple-100 dark:bg-purple-950/30",
    icon: "text-purple-600 dark:text-purple-400",
  },
  "light-purple": {
    bg: "bg-purple-50 dark:bg-purple-950/20",
    icon: "text-purple-700 dark:text-purple-300",
  },
  red: {
    bg: "bg-red-100 dark:bg-red-950/30",
    icon: "text-red-600 dark:text-red-400",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-950/30",
    icon: "text-green-600 dark:text-green-400",
  },
  blue: {
    bg: "bg-blue-100 dark:bg-blue-950/30",
    icon: "text-blue-600 dark:text-blue-400",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-950/30",
    icon: "text-orange-600 dark:text-orange-400",
  },
};

export default function FeatureSectionTwo() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16">
        <header className="max-w-3xl space-y-4">
          <div className="text-muted-foreground inline-flex font-medium items-center gap-2 text-xs tracking-wider uppercase">
            <span className="size-2 rounded-full bg-primary/50"></span>
            COMPLETE SOLUTION
          </div>
          <h2 className="text-3xl text-balance md:text-4xl leading-tight font-bold">
            The comprehensive design platform and component library
          </h2>
          <p className="text-muted-foreground text-base text-balance md:text-lg">
            Advanced platform for building landing pages, web applications and
            admin panels. Includes Component Library (Web), Data Visualization
            Tools, Icon Collection.
          </p>
          <Button size="lg">Get Started</Button>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const colors =
              colorClasses[feature.color as keyof typeof colorClasses];

            return (
              <div key={feature.title} className="space-y-3">
                <div
                  className={cn(
                    "inline-flex size-12 items-center justify-center rounded-lg",
                    colors.bg,
                  )}
                >
                  <Icon className={cn("size-5", colors.icon)} />
                </div>
                <h4 className="text-foreground md:text-lg font-medium">{feature.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
