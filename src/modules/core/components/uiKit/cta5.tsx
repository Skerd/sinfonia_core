import Image from "next/image";
import Link from "next/link";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Avatar, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";

export default function Component() {
  const avatars = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop&ixlib=rb-4.1.0"
  ];

  return (
    <section className="py-10 lg:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-muted/50 shadow-none py-0">
            <CardContent className="flex h-full flex-col justify-center space-y-6 p-6 lg:p-12 ">
              <div className="space-y-4 text-balance">
                <h3 className="text-3xl font-bold md:text-4xl/tight">
                  Master new skills & advance your career
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Discover thousands of courses taught by industry experts. Learn at your own pace
                  and transform your professional journey with practical, hands-on training.
                </p>
              </div>
              <div>
                <Button size="lg" asChild>
                  <Link href="#">Start Learning</Link>
                </Button>
              </div>
              <div className="mt-auto space-y-2">
                <p className="text-muted-foreground text-sm">Join over 2.3M active learners</p>
                <div className="flex -space-x-3">
                  {avatars.map((avatar, index) => (
                    <Avatar key={index} className="border-muted size-10 border-3">
                      <AvatarImage
                        src={avatar}
                        alt={`Learner ${index + 1}`}
                        className="object-cover"
                      />
                    </Avatar>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <figure className="relative aspect-square overflow-hidden rounded-xl">
            <Image
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.1.0"
              alt="Students learning together"
              fill
              className="object-cover"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
