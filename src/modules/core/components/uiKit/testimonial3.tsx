"use client";

import React from "react";
import { motion } from "motion/react";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import { Badge } from "@coreModule/components/uiKit/ui/badge";

const testimonials = [
  {
    text: "The professionalism and swift, solution-oriented approach of your team have dramatically increased our project efficiency.",
    image: "https://i.pravatar.cc/100?img=30",
    name: "Olivia Carter",
    role: "Project Manager",
  },
  {
    text: "Your technical expertise and continuous support have become invaluable. The user-friendly solutions made our work so much easier.",
    image: "https://i.pravatar.cc/100?img=22",
    name: "James Smith",
    role: "Software Developer",
  },
  {
    text: "The robust and flexible infrastructure fully met our needs. We felt in control of the entire process.",
    image: "https://i.pravatar.cc/100?img=41",
    name: "Sophia Lee",
    role: "Operations Director",
  },
  {
    text: "Your outstanding customer service and professional team exceeded our expectations in every way.",
    image: "https://i.pravatar.cc/100?img=27",
    name: "Michael Johnson",
    role: "General Manager",
  },
  {
    text: "Thanks to the fast integration and simple interface, our team adapted quickly and now works seamlessly together.",
    image: "https://i.pravatar.cc/100?img=19",
    name: "Ava Williams",
    role: "Customer Relations Specialist",
  },
  {
    text: "The support we received helped us achieve significant improvements in our business processes. Thank you!",
    image: "https://i.pravatar.cc/100?img=17",
    name: "Emma Brown",
    role: "HR Specialist",
  },
  {
    text: "It's a joy to work with such functional features and a responsive team.",
    image: "https://i.pravatar.cc/100?img=23",
    name: "William Davis",
    role: "Marketing Director",
  },
  {
    text: "Your comprehensive reporting and analytics tools have sped up our decision-making.",
    image: "https://i.pravatar.cc/100?img=36",
    name: "Emily Wilson",
    role: "Sales Manager",
  },
  {
    text: "Your solution-driven approach and effective communication made you a vital partner in our digital transformation.",
    image: "https://i.pravatar.cc/100?img=26",
    name: "Benjamin Miller",
    role: "E-commerce Manager",
  },
] as const;

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

function TestimonialsColumn(props: {
  className?: string;
  testimonials: readonly (typeof testimonials)[number][];
  duration?: number;
}) {
  return (
    <div className={props.className}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration ?? 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="bg-background flex flex-col gap-4 pb-6"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <Card className="w-full max-w-xs shadow-none">
                  <CardContent className="flex flex-col gap-5">
                    <div>{text}</div>
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
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex mb-12 flex-col items-center justify-center space-y-2">
          <Badge variant="outline">Testimonials</Badge>
          <h2 className="text-4xl lg:text-4xl font-bold leading-tight">What our users say</h2>
          <p className="text-center text-muted-foreground">
            See what our customers have to say about us.
          </p>
        </header>

        <div className="flex max-h-[740px] justify-center gap-4 overflow-hidden mask-[linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn
            testimonials={secondColumn}
            className="hidden md:block"
            duration={19}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            className="hidden lg:block"
            duration={17}
          />
        </div>
      </div>
    </section>
  );
}
