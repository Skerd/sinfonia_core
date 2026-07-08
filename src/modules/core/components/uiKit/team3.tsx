import Image from "next/image";
import Link from "next/link";
import { Linkedin } from "lucide-react";

export default function Component() {
  const founders = [
    {
      name: "Alex Rivera",
      title: "Founder & CEO",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
      linkedin: "#",
    },
    {
      name: "Maya Chen",
      title: "Founder & CEO",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
      linkedin: "#",
    },
    {
      name: "Jordan Taylor",
      title: "Founder & CEO",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
      linkedin: "#",
    },
  ];

  const designers = [
    {
      name: "Sofia Martinez",
      title: "Senior Designer",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
      linkedin: "#",
    },
    {
      name: "Emma Wilson",
      title: "Design Director",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
      linkedin: "#",
    },
    {
      name: "David Kim",
      title: "Creative Lead",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
      linkedin: "#",
    },
  ];

  return (
    <section className="py-10 lg:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 space-y-4 lg:mb-16">
          <h2 className="text-4xl leading-tight font-bold lg:text-4xl">
            Our Team
          </h2>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Our diverse team brings together expertise from various design
            disciplines to provide comprehensive and personalized solutions for
            our clients.
          </p>
        </div>

        <div className="space-y-6 lg:space-y-16">
          <div className="grid gap-4 lg:grid-cols-3">
            <h3 className="mb-6 font-serif text-2xl text-balance lg:mb-12 lg:text-3xl">
              Founders and <br className="hidden lg:block" /> partners
            </h3>
            <div className="grid grow gap-8 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-3">
              {founders.map((member, index) => (
                <div key={index} className="group relative">
                  <div className="relative aspect-3/4 w-full overflow-hidden">
                    <Image
                      src={member.image}
                      alt={`Picture of ${member.name}`}
                      fill
                      className="object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
                    />
                    <Link
                      href={member.linkedin}
                      className="bg-background absolute right-4 bottom-4 flex h-8 w-8 items-center justify-center"
                      prefetch={false}
                    >
                      <Linkedin className="h-4 w-4" />
                      <span className="sr-only">LinkedIn</span>
                    </Link>
                  </div>
                  <div className="mt-4 space-y-1">
                    <h4 className="text-xl font-medium">{member.name}</h4>
                    <p className="text-muted-foreground">{member.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 border-t pt-16 lg:grid-cols-3">
            <h3 className="mb-6 font-serif text-2xl text-balance lg:mb-12 lg:text-3xl">
              Design excellence
            </h3>
            <div className="grid grow gap-8 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-3">
              {designers.map((member, index) => (
                <div key={index} className="group relative">
                  <div className="relative aspect-3/4 w-full overflow-hidden">
                    <Image
                      src={member.image}
                      alt={`Picture of ${member.name}`}
                      fill
                      className="object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
                    />
                    <Link
                      href={member.linkedin}
                      className="bg-background absolute right-4 bottom-4 flex h-8 w-8 items-center justify-center"
                      prefetch={false}
                    >
                      <Linkedin className="h-4 w-4" />
                      <span className="sr-only">LinkedIn</span>
                    </Link>
                  </div>
                  <div className="mt-4 space-y-1">
                    <h4 className="text-xl font-medium">{member.name}</h4>
                    <p className="text-muted-foreground">{member.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
