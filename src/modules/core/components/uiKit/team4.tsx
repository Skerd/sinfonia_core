import Image from "next/image";
import Link from "next/link";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Twitter, Instagram, Facebook } from "lucide-react";

export default function Component() {
  const teamMembers = [
    {
      name: "Priya Patel",
      title: "Co-Founder",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
      twitter: "#",
      instagram: "#",
      facebook: "#",
    },
    {
      name: "Harsh Monic",
      title: "CEO",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
      twitter: "#",
      instagram: "#",
      facebook: "#",
    },
    {
      name: "William Foster",
      title: "Project Manager",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
      twitter: "#",
      instagram: "#",
      facebook: "#",
    },
  ];

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-4">
              <h2 className="text-4xl leading-tight font-bold text-balance lg:text-4xl">
                Our Best Working Team
              </h2>
              <p className="text-muted-foreground text-lg text-balance">
                Effective teams communicate openly, leverage strengths, and
                embrace diversity for success.
              </p>
            </div>
            <Button className="w-fit">Join Our Team</Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="bg-card flex flex-col items-center space-y-4 rounded-lg border p-6"
              >
                <div className="bg-background relative h-24 w-24 overflow-hidden rounded-lg border">
                  <Image
                    src={member.image}
                    alt={`Picture of ${member.name}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="font-medium">{member.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {member.title}
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
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
                    <Link
                      href={member.facebook}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      prefetch={false}
                    >
                      <Facebook className="h-4 w-4" />
                      <span className="sr-only">Facebook</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
