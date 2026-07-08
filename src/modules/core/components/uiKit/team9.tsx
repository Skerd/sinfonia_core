import Image from "next/image";
import Link from "next/link";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Twitter, Instagram } from "lucide-react";

export default function Component() {
  const teamMembers = [
    {
      name: "Nikita Xing",
      title: "HR Manager",
      image:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=688&auto=format&fit=crop",
      twitter: "#",
      instagram: "#",
    },
    {
      name: "Leslie Alexander",
      title: "Co-Founder",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=688&auto=format&fit=crop",
      twitter: "#",
      instagram: "#",
    },
    {
      name: "Wade Warren",
      title: "UI Designer",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=688&auto=format&fit=crop",
      twitter: "#",
      instagram: "#",
    },
    {
      name: "Guy Hawkins",
      title: "Product Designer",
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=688&auto=format&fit=crop",
      twitter: "#",
      instagram: "#",
    },
    {
      name: "Ronald Richards",
      title: "Customer Support",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=688&auto=format&fit=crop",
      twitter: "#",
      instagram: "#",
    },
  ];

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-primary text-primary-foreground flex flex-col justify-between rounded-2xl p-8 sm:row-span-2">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold leading-snug">
                Our fantastic team
              </h2>
              <p className="text-primary-foreground/70 text-sm leading-relaxed">
                These people work on making our product best.
              </p>
            </div>
            <Button variant="secondary" size="sm" className="w-fit" asChild>
              <Link href="#" prefetch={false}>
                Join the team
              </Link>
            </Button>
          </div>

          {teamMembers.map((member, index) => (
            <div key={index} className="bg-muted overflow-hidden rounded-2xl">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={member.image}
                  alt={`Picture of ${member.name}`}
                  fill
                  className="object-cover object-center"
                />
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{member.name}</p>
                  <p className="text-muted-foreground text-xs">{member.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={member.twitter}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    prefetch={false}
                  >
                    <Twitter className="h-4 w-4" />
                    <span className="sr-only">Twitter</span>
                  </Link>
                  <Link
                    href={member.instagram}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    prefetch={false}
                  >
                    <Instagram className="h-4 w-4" />
                    <span className="sr-only">Instagram</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
