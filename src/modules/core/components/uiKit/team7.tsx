"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@coreModule/components/lib/utils";

export default function Component() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const teamMembers = [
    {
      name: "Mary Jane",
      title: "Founder",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
      bg: "bg-sky-200",
    },
    {
      name: "Sophie Moore",
      title: "Head of Design",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
      bg: "bg-pink-200",
    },
    {
      name: "James Carter",
      title: "Lead Engineer",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
      bg: "bg-orange-200",
    },
    {
      name: "Lucas Bennett",
      title: "Product Manager",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0",
      bg: "bg-stone-200",
    },
  ];

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex h-[420px] gap-3">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className={cn(
                "relative cursor-pointer overflow-hidden rounded-t-[999px] rounded-b-3xl transition-all duration-500 ease-in-out",
                member.bg,
                hoveredIndex === index ? "flex-[2.5]" : "flex-1",
              )}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <Image
                src={member.image}
                alt={`Picture of ${member.name}`}
                fill
                className="object-cover object-top"
              />
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-5 transition-all duration-300",
                  hoveredIndex === index
                    ? "translate-y-0 opacity-100"
                    : "translate-y-3 opacity-0",
                )}
              >
                <p className="truncate text-sm font-semibold text-white">
                  {member.name}
                </p>
                <p className="truncate text-xs text-white/80">{member.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
