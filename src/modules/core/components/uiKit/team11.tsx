import Image from "next/image";
import Link from "next/link";
import { Button } from "@coreModule/components/uiKit/ui/button";

export default function Component() {
  const photos = [
    {
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=687&auto=format&fit=crop",
      alt: "Team member",
      className: "row-span-2",
    },
    {
      src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=688&auto=format&fit=crop",
      alt: "Team member",
      className: "",
    },
    {
      src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=687&auto=format&fit=crop",
      alt: "Team member",
      className: "",
    },
    {
      src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=687&auto=format&fit=crop",
      alt: "Team member",
      className: "",
    },
    {
      src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop",
      alt: "Team member",
      className: "",
    },
  ];

  return (
    <section className="bg-muted/40 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight lg:text-5xl">
              Our leading, strong &amp; creative team
            </h2>
            <p className="text-muted-foreground text-base">
              These people work on making our product best.
            </p>
            <Button size="lg" asChild>
              <Link href="#" prefetch={false}>
                Join our team
              </Link>
            </Button>
          </div>

          <div className="grid h-[380px] grid-cols-3 grid-rows-2 gap-3 sm:h-[440px]">
            {photos.map((photo, index) => (
              <div
                key={index}
                className={`relative overflow-hidden rounded-2xl ${photo.className}`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover object-center"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
