import Image from "next/image";

export default function Component() {
  const teamMembers = [
    {
      name: "Ethan Parker",
      title: "Lead Mindset Coach",
      image:
        "https://images.unsplash.com/photo-1531384441138-2736e62e0919?q=80&w=687&auto=format&fit=crop",
      className: "-rotate-6 -translate-x-6 translate-y-6 z-10",
    },
    {
      name: "Sophia Reyes",
      title: "Growth Strategist",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop",
      className: "z-20 scale-105",
    },
    {
      name: "Liam Carter",
      title: "Neuroscience Coach",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=687&auto=format&fit=crop",
      className: "rotate-6 translate-x-6 translate-y-6 z-10",
    },
  ];

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="mb-16 text-center text-4xl font-bold leading-tight lg:text-5xl">
          Meet the Coaches <br className="hidden sm:block" />
          Behind Coacha
        </h2>

        <div className="flex items-end justify-center gap-0">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className={`relative h-72 w-44 shrink-0 overflow-hidden rounded-3xl transition-transform duration-300 hover:scale-105 sm:h-96 sm:w-56 ${member.className}`}
            >
              <Image
                src={member.image}
                alt={`Picture of ${member.name}`}
                fill
                className="object-cover object-center"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4">
                <p className="text-xs text-white/70">{member.title}</p>
                <p className="text-base font-bold text-white">{member.name}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <span className="border-border bg-background rounded-full border px-5 py-2 text-sm text-muted-foreground shadow-sm">
            Three driven minds. United by one mission.
          </span>
        </div>
      </div>
    </section>
  );
}
