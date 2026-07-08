"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@coreModule/components/uiKit/ui/card";
import { Slider } from "@coreModule/components/uiKit/ui/slider";
import { cn } from "@coreModule/components/lib/utils";
import { Badge } from "@coreModule/components/uiKit/ui/badge";

const pricingPlans = [
  {
    id: "starter",
    name: "Starter",
    baseMonthlyPrice: 9,
    baseYearlyPrice: 7,
    description: "Perfect for individuals who need secure cloud storage",
    features: [
      "100GB storage space",
      "Automatic file backup",
      "Mobile app access",
      "Basic file sharing",
      "Email support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    baseMonthlyPrice: 29,
    baseYearlyPrice: 23,
    description: "Ideal for small teams and growing businesses",
    features: [
      "500GB storage space",
      "Advanced backup features",
      "Team collaboration tools",
      "Priority email support",
      "Version history (30 days)",
    ],
  },
  {
    id: "business",
    name: "Business",
    baseMonthlyPrice: 79,
    baseYearlyPrice: 63,
    description: "Best for companies that need enterprise-grade solutions",
    features: [
      "2TB storage space",
      "Unlimited backup automation",
      "Advanced security features",
      "24/7 priority support",
      "Extended version history (1 year)",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    baseMonthlyPrice: 199,
    baseYearlyPrice: 159,
    description: "For large organizations with custom requirements",
    features: [
      "Unlimited storage space",
      "Custom backup solutions",
      "Dedicated account manager",
      "SLA guarantees",
      "On-premise deployment options",
    ],
  },
];

function calculatePrice(basePrice: number, userCount: number): number {
  const multiplier = 1 + ((userCount - 5) / 5) * 0.2;
  return Math.round(basePrice * multiplier);
}

function formatPrice(price: number): string {
  return `$${price}`;
}

export default function PricingTable() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [userCount, setUserCount] = useState([10]);

  return (
    <section className="mx-auto w-full max-w-7xl space-y-10 px-4 py-16">
      <header className="flex items-start justify-between space-y-4">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight text-balance lg:text-4xl">
            Transparent, flexible plans for every team
          </h1>
          <p className="text-muted-foreground text-lg">
            No hidden fees, no contracts—just simple and transparent pricing for
            every business.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={billingCycle === "monthly" ? "default" : "ghost"}
            size="sm"
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === "yearly" ? "default" : "ghost"}
            size="sm"
            onClick={() => setBillingCycle("yearly")}
          >
            Yearly
          </Button>
        </div>
      </header>

      <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
        <div className="w-full">
          <div className="relative flex items-center gap-4">
            <Slider
              value={userCount}
              onValueChange={setUserCount}
              min={5}
              max={30}
              step={5}
              className="w-full"
              aria-label="Number of users"
            />
            <Badge variant="outline">{userCount[0]} Users</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {pricingPlans.map((plan) => {
          const basePrice =
            billingCycle === "monthly"
              ? plan.baseMonthlyPrice
              : plan.baseYearlyPrice;
          const calculatedPrice = calculatePrice(basePrice, userCount[0]);
          const price = formatPrice(calculatedPrice);
          const isPopular = plan.popular;

          return (
            <Card
              key={plan.id}
              className={cn(
                "flex flex-col shadow-none",
                isPopular && "bg-muted ring ring-green-600 dark:ring-green-600",
                !isPopular && "lg:mt-4",
              )}
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="flex items-end gap-1">
                  <div className="font-bold text-3xl">{price}</div>
                  <div className="text-muted-foreground mb-1 text-sm">
                    / {billingCycle === "monthly" ? "month" : "year"}
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button
                  variant={isPopular ? "default" : "outline"}
                  className="w-full"
                  size="lg"
                >
                  Choose Plan
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
