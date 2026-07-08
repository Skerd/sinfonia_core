"use client";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { ArrowRight } from "lucide-react";

const testimonials = [
  {
    quote:
      "Teamway is simply a great solution, quick to get started and find talent, easy to onboard and a perfect solution when you need real flexibility.",
    name: "Mathias Hany",
    role: "Co-founder & CEO Google",
    image: "https://i.pravatar.cc/100?img=33",
    tags: ["Category", "type", "Tag"],
    metric: "97%",
    metricLabel: "Match Rate",
    gradient: "from-pink-200/80 via-purple-200/50 to-transparent",
  },
  {
    quote:
      "If hiring great engineers feels tough and time-consuming, try Teamway. Intuitive, fast, and packed with top talent.",
    name: "Dennis C. Lieber",
    role: "Head of Product, Amazon",
    image: "https://i.pravatar.cc/100?img=47",
    tags: ["Category", "type", "Tag"],
    metric: "7x",
    metricLabel: "Faster than traditional hiring",
    gradient: "from-blue-200/80 via-cyan-200/50 to-transparent",
  },
] as const;

export default function TestimonialsIconic() {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <header className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
            Used by Iconic companies to hire their dream teams.
          </h2>
          <Button className="shrink-0" size="lg">
            Learn More
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </header>

        <div className="flex flex-col gap-6">
          {testimonials.map((t, i) => (
            <article
              key={i}
              className="relative flex overflow-hidden rounded-2xl border bg-muted/40 shadow-sm"
            >
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
                aria-hidden
              />
              <div className="relative flex w-full flex-col md:flex-row">
                <div className="flex shrink-0 p-6 md:p-8">
                  <img
                    src={t.image}
                    alt={t.name}
                    width={120}
                    height={120}
                    className="rounded-xl border border-border/60 object-cover size-24 md:size-28"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 px-6 pb-6 md:px-0 md:pb-0 md:pr-0 md:py-8">
                  <blockquote className="text-foreground text-sm leading-relaxed md:text-base">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-muted-foreground text-sm">{t.role}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {t.tags.map((tag, j) => (
                      <span
                        key={j}
                        className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  className={`flex shrink-0 flex-col justify-center bg-linear-to-l ${t.gradient} px-8 py-6 md:min-w-[140px] md:px-10`}
                >
                  <p className="text-2xl font-bold md:text-3xl">{t.metric}</p>
                  <p className="text-muted-foreground mt-1 text-sm font-medium">
                    {t.metricLabel}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
