import { CircleCheck } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@coreModule/components/uiKit/ui/card";
import { Separator } from "@coreModule/components/uiKit/ui/separator";

export default function PricingSection() {
  const plans = [
    {
      id: "starter",
      name: "Starter",
      description: "Perfect for startups and small teams",
      price: "$29",
      features: [
        "Up to 10 team members",
        "Access to all core features",
        "Email support",
        "5GB cloud storage",
      ],
      button: {
        text: "Get Started",
        url: "",
      },
    },
    {
      id: "growth",
      name: "Growth",
      description: "For growing businesses needing more power",
      price: "$79",
      features: [
        "Unlimited team members",
        "Advanced analytics",
        "Priority email & chat support",
        "Unlimited cloud storage",
      ],
      button: {
        text: "Get Started",
        url: "",
      },
    },
  ];

  return (
    <section className="py-12 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto flex max-w-3xl flex-col items-center space-y-6 text-center lg:space-y-8">
          <header className="mb-10 space-y-4">
            <h2 className="text-3xl leading-tight font-bold text-balance lg:text-4xl">
              Flexible Plans for Every Stage
            </h2>
            <p className="text-muted-foreground text-balance lg:text-lg">
              Whether you&#39;re just starting out or scaling fast, we’ve got a
              plan that fits your needs.
            </p>
          </header>

          <div className="flex flex-col items-stretch gap-6 md:flex-row">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className="flex w-80 flex-col justify-between text-left shadow-none"
              >
                <CardHeader>
                  <CardTitle>
                    <p>{plan.name}</p>
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {plan.description}
                  </p>
                  <div className="flex items-end">
                    <span className="text-3xl font-bold lg:text-4xl">
                      {plan.price}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Separator className="mb-6" />
                  <ul className="space-y-4">
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CircleCheck className="size-4" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="mt-auto">
                  <Button asChild className="w-full">
                    <a href={plan.button.url} target="_blank">
                      {plan.button.text}
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
