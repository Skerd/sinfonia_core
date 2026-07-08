"use client";

import { Star } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Button } from "@coreModule/components/uiKit/ui/button";

const testimonials = [
  {
    text: "The professionalism and swift, solution-oriented approach of your team have dramatically increased our project efficiency.",
    image: "https://i.pravatar.cc/100?img=30",
    name: "Olivia Carter",
    role: "Project Manager",
    rating: 5,
  },
  {
    text: "Your technical expertise and continuous support have become invaluable. The user-friendly solutions made our work so much easier.",
    image: "https://i.pravatar.cc/100?img=22",
    name: "James Smith",
    role: "Software Developer",
    rating: 5,
  },
  {
    text: "The robust and flexible infrastructure fully met our needs. We felt in control of the entire process.",
    image: "https://i.pravatar.cc/100?img=41",
    name: "Sophia Lee",
    role: "Operations Director",
    rating: 4,
  },
  {
    text: "Your outstanding customer service and professional team exceeded our expectations in every way.",
    image: "https://i.pravatar.cc/100?img=27",
    name: "Michael Johnson",
    role: "General Manager",
    rating: 5,
  },
  {
    text: "Thanks to the fast integration and simple interface, our team adapted quickly and now works seamlessly together.",
    image: "https://i.pravatar.cc/100?img=19",
    name: "Ava Williams",
    role: "Customer Relations Specialist",
    rating: 5,
  },
  {
    text: "The support we received helped us achieve significant improvements in our business processes. Thank you!",
    image: "https://i.pravatar.cc/100?img=17",
    name: "Emma Brown",
    role: "HR Specialist",
    rating: 4,
  },
  {
    text: "It's a joy to work with such functional features and a responsive team.",
    image: "https://i.pravatar.cc/100?img=23",
    name: "William Davis",
    role: "Marketing Director",
    rating: 5,
  },
  {
    text: "Your comprehensive reporting and analytics tools have sped up our decision-making.",
    image: "https://i.pravatar.cc/100?img=36",
    name: "Emily Wilson",
    role: "Sales Manager",
    rating: 4,
  },
  {
    text: "Your solution-driven approach and effective communication made you a vital partner in our digital transformation.",
    image: "https://i.pravatar.cc/100?img=26",
    name: "Benjamin Miller",
    role: "E-commerce Manager",
    rating: 5,
  },
] as const;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={
            star <= rating
              ? "size-4 fill-amber-500 text-amber-500"
              : "fill-muted text-muted size-4"
          }
        />
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="py-12 lg:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <header className="flex max-w-2xl flex-col justify-center space-y-4">
          <Badge variant="secondary">Community</Badge>
          <h2 className="text-4xl lg:text-4xl font-bold leading-tight">
            We believe in the power of community
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Our goal is to create a product and service that you're satisfied
            with and use it every day. This is why we're constantly working on
            our services to make it better every day and really listen to what
            our users has to say.
          </p>
          <Button className="w-fit">Read more testimonials</Button>
        </header>
      </div>

      <div className="mt-10 mask-x-from-75% mask-x-to-90%">
        <motion.div
          animate={{ translateX: "-50%" }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
            repeatType: "loop",
          }}
          className="flex gap-4"
        >
          {testimonials.map(({ text, image, name, role, rating }, i) => (
            <Card key={i} className="w-72 shrink-0 shadow-none">
              <CardContent className="flex flex-col gap-5">
                <div className="space-y-3">
                  <StarRating rating={rating} />
                  <p className="text-muted-foreground">{text}</p>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    width={40}
                    height={40}
                    src={image}
                    alt={name}
                    className="rounded-full"
                  />
                  <div className="flex flex-col space-y-0.5">
                    <span className="leading-5 font-medium tracking-tight">
                      {name}
                    </span>
                    <span className="text-sm leading-5 tracking-tight opacity-60">
                      {role}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
