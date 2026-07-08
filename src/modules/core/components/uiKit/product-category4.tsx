import { ArrowRight } from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import Image from "next/image";

const categories = [
  {
    title: "Portrait Photography",
    description: "Great image quality and autofocus for portraits and bokeh.",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0",
  },
  {
    title: "Landscape Photography",
    description: "High resolution, weather-sealed, for any light.",
    image:
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0",
  },
  {
    title: "Sports & Action",
    description: "Fast autofocus and burst for action shots.",
    image:
      "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0",
  },
  {
    title: "Wildlife Photography",
    description: "Powerful zoom and silent shooting.",
    image:
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0",
  },
];

export default function FeatureSectionTen() {
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-end justify-between gap-4 sm:flex-row">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold lg:text-4xl">
              Shop By Categories
            </h2>
            <p className="text-muted-foreground max-w-2xl lg:text-lg">
              Find the perfect camera tailored to your photography style. We
              offer solutions designed to meet the specific needs of every
              photographer.
            </p>
          </div>
          <Button className="w-full sm:w-auto">
            Explore More
            <ArrowRight />
          </Button>
        </div>

        <div className="grid overflow-hidden rounded-xl sm:grid-cols-2">
          {categories.map((category) => (
            <div
              key={category.title}
              className="group relative aspect-4/3 w-full overflow-hidden"
            >
              <Image
                src={category.image}
                alt={category.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-4 lg:p-6">
                <div className="flex justify-between">
                  <h3 className="truncate text-lg font-medium text-white sm:text-xl">
                    {category.title}
                  </h3>
                  <Button className="w-fit rounded-none border-b bg-transparent px-0 text-xs text-white uppercase hover:bg-transparent">
                    Explore Now
                  </Button>
                </div>
                <p className="truncate text-sm leading-relaxed text-white/70">
                  {category.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
