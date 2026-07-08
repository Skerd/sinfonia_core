import {
  Layout,
  FolderOpen,
  History,
  Send,
  Palette,
  MessageCircle,
  Plug,
  Monitor,
  Star,
} from "lucide-react";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import { cn } from "@coreModule/components/lib/utils";

const features = [
  {
    icon: Layout,
    title: "Flexible Layouts",
    description:
      "Build pages with drag-and-drop sections and adaptive grids that look great on any device.",
    color: "red",
  },
  {
    icon: FolderOpen,
    title: "Asset Library",
    description:
      "Store and organize images, fonts, and media in one place with smart search and tags.",
    color: "blue",
  },
  {
    icon: History,
    title: "Version History",
    description: "Revert to any previous version with one click. Every change is saved automatically.",
    color: "green",
  },
  {
    icon: Send,
    title: "One-Click Publish",
    description: "Push updates live instantly. No build step, no deployment pipeline to configure.",
    color: "yellow",
  },
  {
    icon: Palette,
    title: "Custom Branding",
    description:
      "Apply your colors, logos, and typography across the whole site from a single style guide.",
    color: "purple",
  },
  {
    icon: MessageCircle,
    title: "Comments & Review",
    description: "Leave feedback directly on the canvas. Resolve threads and keep stakeholders in sync.",
    color: "orange",
  },
  {
    icon: Plug,
    title: "Integrations",
    description: "Connect to your CRM, analytics, and tools with ready-made plugins and webhooks.",
    color: "pink",
  },
  {
    icon: Monitor,
    title: "Live Preview",
    description: "See desktop, tablet, and mobile views side by side as you design and edit.",
    color: "gray",
  },
];

const colorClasses = {
  red: {
    bg: "bg-red-50 dark:bg-red-950/20",
    icon: "text-red-600 dark:text-red-400",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    icon: "text-blue-600 dark:text-blue-400",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-950/20",
    icon: "text-green-600 dark:text-green-400",
  },
  yellow: {
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
    icon: "text-yellow-600 dark:text-yellow-400",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/20",
    icon: "text-purple-600 dark:text-purple-400",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-950/20",
    icon: "text-orange-600 dark:text-orange-400",
  },
  pink: {
    bg: "bg-pink-50 dark:bg-pink-950/20",
    icon: "text-pink-600 dark:text-pink-400",
  },
  gray: {
    bg: "bg-gray-50 dark:bg-gray-950/20",
    icon: "text-gray-600 dark:text-gray-400",
  },
};

export default function FeatureSection() {
  return (
    <section className="px-4 py-14 sm:py-20">
      <header className="mx-auto mb-12 max-w-3xl space-y-4 text-center">
        <Badge variant="outline">
          <Star />
          Our Features
        </Badge>

        <h2 className="text-3xl md:text-4xl font-bold">
          Everything you need to ship faster.
        </h2>

        <p className="text-muted-foreground text-base text-balance md:text-lg">
          From layout and branding to review and publish—all in one place.
        </p>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          const colors =
            colorClasses[feature.color as keyof typeof colorClasses];

          return (
            <Card key={feature.title} className="shadow-none">
              <CardContent>
                <div className="mb-4">
                  <div
                    className={cn(
                      "inline-flex size-12 items-center justify-center rounded-lg",
                      colors.bg,
                    )}
                  >
                    <Icon className={cn("size-5", colors.icon)} />
                  </div>
                </div>
                <h4 className="text-foreground mb-2 md:text-lg font-medium">
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
    </section>
  );
}
