import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@coreModule/components/uiKit/ui/carousel";

export default function Component() {
  const testimonials = [
    {
      quote:
        "This product has revolutionized the way we work. The intuitive interface and powerful features have significantly boosted our productivity.",
      name: "Sarah Chen",
      title: "CEO, Tech Solutions",
      avatar: "/images/avatars/01.png",
    },
    {
      quote:
        "Outstanding customer support and a truly robust platform. We've seen remarkable improvements since integrating this into our workflow.",
      name: "Michael Lee",
      title: "Lead Developer, Innovate Corp",
      avatar: "/images/avatars/02.png",
    },
    {
      quote:
        "A game-changer for our business! The scalability and reliability are unmatched, allowing us to focus on growth without technical worries.",
      name: "Jessica Kim",
      title: "Marketing Director, Global Brands",
      avatar: "/images/avatars/03.png",
    },
    {
      quote:
        "The best investment we've made this year. It's incredibly user-friendly and has exceeded all our expectations.",
      name: "David Miller",
      title: "Operations Manager, Future Systems",
      avatar: "/images/avatars/04.png",
    },
    {
      quote:
        "Seamless integration and powerful analytics. This tool has given us insights we never had before.",
      name: "Emily White",
      title: "Data Scientist, Analytics Hub",
      avatar: "/images/avatars/05.png",
    },
  ];

  return (
    <section className="py-14 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="max-w-xl space-y-2">
            <h2 className="text-4xl sm:text-4xl font-bold leading-tight">What Our Customers Say</h2>
            <p className="text-muted-foreground text-balance lg:text-lg">
              Hear directly from the people who have experienced the impact of
              our product.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-5xl py-12">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="flex h-full flex-col shadow-none">
                    <CardContent className="flex grow flex-col items-center justify-between text-center">
                      <blockquote className="text-muted-foreground leading-snug lg:leading-normal">
                        &ldquo;{testimonial.quote}&rdquo;
                      </blockquote>
                      <div className="mt-6 flex flex-col items-center">
                        <Avatar className="size-10">
                          <AvatarImage
                            src={testimonial.avatar}
                            alt={`Avatar of ${testimonial.name}`}
                          />
                          <AvatarFallback>
                            {testimonial.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="mt-4">
                          <div className="font-semibold">
                            {testimonial.name}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {testimonial.title}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </section>
  );
}
