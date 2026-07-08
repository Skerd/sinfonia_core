import Image from "next/image";
import Link from "next/link";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { cn } from "@coreModule/components/lib/utils";

export default function CTASection() {
  const images = [
    {
      src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0",
      alt: "Developer working on laptop"
    },
    {
      src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0",
      alt: "Data analytics dashboard"
    },
    {
      src: "https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0",
      alt: "Mobile app development"
    },
    {
      src: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0",
      alt: "Team collaboration"
    },
    {
      src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0",
      alt: "Code review session"
    },
    {
      src: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0",
      alt: "Modern workspace"
    },
    {
      src: "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0",
      alt: "Software architecture"
    }
  ];

  return (
    <section>
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <header className="mb-10 space-y-4 text-center text-balance">
          <h2 className="text-3xl font-bold lg:text-4xl/tight">Great products begin with a vision.</h2>
          <p className="text-muted-foreground text-lg">
            Connect with us for web applications, mobile solutions and innovative digital
            experiences
          </p>
          <div className="flex justify-center pt-2">
            <Button size="lg" asChild>
              <Link href="#">Get in touch</Link>
            </Button>
          </div>
        </header>
      </div>
      <div className="flex justify-center overflow-hidden">
        {images.map((image, index) => (
          <figure
            key={index}
            className={cn(
              "relative aspect-3/4 w-32 shrink-0 overflow-hidden",
              index % 2 === 1 ? "translate-y-10 sm:w-40 lg:w-48" : "sm:w-48 lg:w-60"
            )}>
            <Image src={image.src} alt={image.alt} fill className="object-cover" />
          </figure>
        ))}
      </div>
    </section>
  );
}
