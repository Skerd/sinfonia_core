import Image from "next/image";
import Link from "next/link";
import { Twitter, Instagram, Facebook } from "lucide-react";

export default function Component() {
  const teamMembers = [
    {
      name: "Sarah Mitchell",
      title: "Lead Developer",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
      twitter: "#",
      instagram: "#",
      facebook: "#",
    },
    {
      name: "David Chen",
      title: "Full Stack Engineer",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
      twitter: "#",
      instagram: "#",
      facebook: "#",
    },
    {
      name: "Emma Thompson",
      title: "UI/UX Designer",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
      twitter: "#",
      instagram: "#",
      facebook: "#",
    },
    {
      name: "Marcus Johnson",
      title: "DevOps Specialist",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
      twitter: "#",
      instagram: "#",
      facebook: "#",
    },
    {
      name: "Olivia Martinez",
      title: "Product Manager",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
      twitter: "#",
      instagram: "#",
      facebook: "#",
    },
    {
      name: "Ryan Anderson",
      title: "Backend Architect",
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
      twitter: "#",
      instagram: "#",
      facebook: "#",
    },
  ];

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl leading-tight font-bold text-balance lg:text-4xl">
            Our Development Team
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Meet our talented developers - a dynamic blend of expertise,
            innovation, and passion, building exceptional digital experiences
            together.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-10 sm:gap-20">
          {teamMembers.map((member, index) => (
            <div key={index} className="space-y-4">
              <div className="relative mx-auto size-30 lg:size-48 overflow-hidden rounded-full">
                <Image
                  src={member.image}
                  alt={`Picture of ${member.name}`}
                  fill
                  className="object-cover grayscale"
                />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="md:text-xl font-semibold">{member.name}</h3>
                <p className="text-muted-foreground text-sm">{member.title}</p>
                <div className="flex justify-center gap-4 mt-4">
                  <Link
                    href={member.twitter}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    prefetch={false}
                  >
                    <Twitter className="size-4" />
                    <span className="sr-only">Twitter</span>
                  </Link>
                  <Link
                    href={member.instagram}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    prefetch={false}
                  >
                    <Instagram className="size-4" />
                    <span className="sr-only">Instagram</span>
                  </Link>
                  <Link
                    href={member.facebook}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    prefetch={false}
                  >
                    <Facebook className="size-4" />
                    <span className="sr-only">Facebook</span>
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
