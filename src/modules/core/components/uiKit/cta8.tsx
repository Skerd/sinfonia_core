import Image from "next/image";
import { SendIcon } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Badge } from "@coreModule/components/uiKit/ui/badge";

export default function CTASection() {
  return (
    <section className="py-10 lg:py-16">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-4 flex justify-center">
          <Badge variant="secondary">Get Started</Badge>
        </div>

        <div className="mx-auto mb-8 max-w-3xl text-center">
          <h2 className="mb-6 text-4xl font-bold text-balance lg:text-5xl lg:leading-14">
            Your Vistaing journey starts{" "}
            <span className="font-serif font-normal italic">right now</span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xl text-balance">
            Book a free 30 min call and see how we turn property views into
            serious buyers
          </p>
        </div>

        <div className="mb-16 flex justify-center">
          <Button size="lg" className="rounded-full">
            <SendIcon />
            Get Started
          </Button>
        </div>

        {/* Property Images Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative aspect-3/4 overflow-hidden rounded-2xl">
            <Image
              src="https://images.unsplash.com/photo-1444084316824-dc26d6657664?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Modern mountain house with stone and glass exterior"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative aspect-3/4 overflow-hidden rounded-2xl">
            <Image
              src="https://images.unsplash.com/photo-1543872084-c7bd3822856f?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Dubai skyline at sunset with luxury properties"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative aspect-3/4 overflow-hidden rounded-2xl">
            <Image
              src="https://images.unsplash.com/photo-1667718297886-64ed2c454bcd?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Modern waterfront property with palm trees"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
