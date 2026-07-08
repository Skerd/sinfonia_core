import Image from "next/image";
import Link from "next/link";

export default function Component() {
  const teamMembers = [
    {
      name: "Michael Scott",
      title: "Co-Founder, Chief Architect",
      image:
        "https://images.unsplash.com/photo-1531384441138-2736e62e0919?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
    },
    {
      name: "Chandler Rigs",
      title: "Co-Founder, Architect",
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
    },
    {
      name: "Isabella Rodriguez",
      title: "Architect",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
    },
    {
      name: "Ava Wilson",
      title: "3D Artist",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
    },
  ];

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 flex items-start justify-between gap-8">
          <div className="max-w-md space-y-2">
            <p className="text-muted-foreground text-sm">04. Our team</p>
            <h2 className="text-3xl font-bold">Our team</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We craft solutions that amplify key characteristics, achieving a
              harmonious balance of function and intent. Through careful
              analysis and collaborative engagement, our spaces transcend the
              conventional.
            </p>
          </div>
          <Link
            href="#"
            className="text-muted-foreground hover:text-foreground mt-1 shrink-0 text-sm transition-colors"
            prefetch={false}
          >
            Read more
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {teamMembers.map((member, index) => (
            <div key={index} className="space-y-3">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md">
                <Image
                  src={member.image}
                  alt={`Picture of ${member.name}`}
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{member.name}</h3>
                <p className="text-muted-foreground text-xs">{member.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
