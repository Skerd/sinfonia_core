import Image from "next/image";
import Link from "next/link";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { ArrowUpRight } from "lucide-react";

export default function Component() {
  const teamMembers = [
    {
      name: "Alex Morgan",
      title: "Founder & managing partner",
      description:
        "Leads strategy and advisory work, partnering closely with executive teams on ESG integration and long-term value creation.",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
    },
    {
      name: "Sofia Ramirez",
      title: "Head of sustainability",
      description:
        "Specializes in ESG frameworks, materiality assessments, and sustainability reporting across global standards.",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
    },
    {
      name: "Daniel Aliesa",
      title: "Climate & carbon lead",
      description:
        "Focuses on emissions measurement, net-zero strategy, and climate risk analysis across complex operations.",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
    },
    {
      name: "Emma Collins",
      title: "ESG data & analytics lead",
      description:
        "Transforms ESG data into clear dashboards, KPIs, and decision-ready insights.",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop",
    },
    {
      name: "Amir Khan",
      title: "Supply chain & impact lead",
      description:
        "Works with organizations to strengthen transparency, ethical sourcing, and value-chain accountability.",
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop",
    },
    {
      name: "Michael Bennett",
      title: "Governance & risk advisor",
      description:
        "Supports boards and leadership teams on ESG governance, risk management, and regulatory readiness.",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
    },
  ];

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-2">
          <Link
            href="#"
            className="text-primary text-sm font-medium"
            prefetch={false}
          >
            • Our team
          </Link>
        </div>
        <div className="mb-10 flex items-center justify-between gap-4">
          <h2 className="text-3xl font-bold lg:text-4xl">Leadership team</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="#" prefetch={false}>
              Join us <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-y-0">
          {teamMembers.map((member, index) => {
            const col = index % 3;
            return (
              <div
                key={index}
                className={`flex flex-col justify-between gap-6 border p-6 ${
                  col === 1 ? "border-x-0 sm:border-x" : ""
                } ${index >= 3 ? "border-t-0" : ""}`}
              >
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">{member.name}</h3>
                  <p className="text-muted-foreground text-sm">{member.title}</p>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {member.description}
                  </p>
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm">
                    <Image
                      src={member.image}
                      alt={`Picture of ${member.name}`}
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
