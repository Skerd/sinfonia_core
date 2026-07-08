import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import { Quote } from "lucide-react";

function QuoteIcon({ className }: { className?: string }) {
  return (
    <Quote
      className={`size-10 shrink-0 text-rose-500 ${className}`}
      strokeWidth={1.5}
      aria-hidden
    />
  );
}

export default function TestimonialsMasonry() {
  return (
    <section className="py-14 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <header className="mb-14 text-center">
          <Badge variant="outline" className="mb-4">
            Testimonials
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">What They Say About Us</h2>
          <p className="text-muted-foreground mt-3 text-base">
            Find out how our happy clients are raving about us.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card className="overflow-hidden shadow-none">
            <CardContent className="flex h-full flex-col gap-4">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold md:text-5xl">6X</span>
                <p className="mt-1 font-semibold">
                  Increase in lead Confidence
                </p>
              </div>
              <QuoteIcon />
              <p className="text-muted-foreground leading-relaxed">
                From the very beginning, the team demonstrated a deep
                understanding of our brand and goals. Their ability to translate
                our vision into a clean, modern interface was nothing short of
                impressive. Not only did they meet our expectations—they
                exceeded them in every way. We&apos;ve already seen a positive
                impact on user engagement
              </p>
              <div className="mt-auto flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src="https://i.pravatar.cc/100?img=11"
                    alt="Sabin Adhikari"
                  />
                  <AvatarFallback>SA</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">Sabin Adhikari</p>
                  <p className="text-muted-foreground text-xs">
                    Marketing Director, Spotify
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="overflow-hidden shadow-none">
              <CardContent className="flex flex-col gap-4">
                <QuoteIcon />
                <p className="text-muted-foreground leading-relaxed">
                  Working with this team has been a game-changer for our
                  business. Their professionalism, attention to detail, and
                  consistent delivery exceeded all expectations.
                </p>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src="https://i.pravatar.cc/100?img=12"
                        alt="Jetha lal Gadha"
                      />
                      <AvatarFallback>JG</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">Jetha lal Gadha</p>
                      <p className="text-muted-foreground text-xs">
                        Marketing Director, Gadha Electronics
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="overflow-hidden shadow-none">
                <CardContent className="flex flex-col gap-4">
                  <QuoteIcon />
                  <p className="text-muted-foreground leading-relaxed">
                    In a fast-paced startup environment, speed and flexibility
                    are everything. This team delivered both, with no compromise
                    on quality.
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src="https://i.pravatar.cc/100?img=13"
                        alt="Bhasme don"
                      />
                      <AvatarFallback>Bd</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">Bhasme don</p>
                      <p className="text-muted-foreground text-xs">
                        Founder, Candy Crush
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary overflow-hidden border-0 shadow-none">
                <CardContent className="text-primary-foreground flex flex-col gap-4">
                  <QuoteIcon />
                  <p className="text-sm leading-relaxed">
                    Honestly, I wasn&apos;t sure what to expect at first. But
                    from the initial consultation to the final delivery,
                    everything was smooth, friendly, and well-organized.
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src="https://i.pravatar.cc/100?img=14"
                        alt="Rajesh Dai"
                      />
                      <AvatarFallback>RD</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-background font-semibold">
                        Rajesh Dai
                      </p>
                      <p className="text-background/70 text-xs">
                        Founder, World
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
