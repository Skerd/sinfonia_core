import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";

const testimonials = [
  {
    name: "Darlene Robertson",
    role: "Co-founder & CEO, Nucanon",
    image: "https://i.pravatar.cc/100?img=47",
    quote:
      "Alpha saved us months of work while upgrading our clusters. It used to take 3 people 4 weeks to do one upgrade. With Alpha, it takes 1 person 1 week. Also, Alpha brings standardization to our upgrade process so I am finally able to delegate upgrades to other team members.",
  },
  {
    name: "Wade Warren",
    role: "Co-founder & CEO, Nucanon",
    image: "https://i.pravatar.cc/100?img=33",
    quote:
      "Alpha cut our deployment time drastically. What once needed 3 engineers working 2 weeks now takes just 1 engineer in 3 days. Plus, the consistency Alpha adds means I can confidently hand off tasks without constant oversight.",
  },
  {
    name: "Albert Flores",
    role: "Co-founder & CEO, Nucanon",
    image: "https://i.pravatar.cc/100?img=12",
    quote:
      "Regulatory requirements mandate that we take serious measures to avoid downtime. Alpha enables us to do that. Before Alpha, our upgrade process was risky, fragile and tedious.",
  },
  {
    name: "Jenny Wilson",
    role: "Co-founder & CEO, Nucanon",
    image: "https://i.pravatar.cc/100?img=20",
    quote:
      "Compliance rules mean we must minimize downtime at all costs. Beta makes that possible. Before Alpha, upgrades felt unreliable, error-prone, and time-consuming.",
  },
] as const;

export default function TestimonialsGrid() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <header className="mb-10 space-y-3">
          <Badge variant="outline">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: "#0d9488" }}
              aria-hidden
            />
            Trusted Reliability
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">What Our Users Are Saying</h2>
          <p className="text-muted-foreground md:text-lg">
            Trusted by Teams to Drive Safe, Efficient Operations
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <Card key={i} className="shadow-none">
              <CardContent className="flex flex-col items-start space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="size-10 shrink-0 rounded-full object-cover">
                    <AvatarImage src={t.image} alt={t.name} />
                    <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium">{t.name}</p>
                    <p className="text-muted-foreground text-sm">{t.role}</p>
                  </div>
                </div>
                <blockquote className="text-muted-foreground leading-relaxed">
                  {t.quote}
                </blockquote>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
