"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@coreModule/components/uiKit/ui/card";
import { RadioGroup, RadioGroupItem } from "@coreModule/components/uiKit/ui/radio-group";
import { Label } from "@coreModule/components/uiKit/ui/label";

const pricingPlans = [
  {
    id: "basic",
    name: "Starter",
    monthlyPrice: "$29",
    yearlyPrice: "$23",
    discount: "Save 20%",
    features: [
      "10 number of users",
      "Email support",
      "Basic storage (10GB)",
      "Core features access",
      "Basic reporting",
      "Standard templates",
      "Basic security features",
    ],
  },
  {
    id: "standard",
    name: "Professional",
    monthlyPrice: "$49",
    yearlyPrice: "$39",
    discount: "Save 20%",
    features: [
      "50 number of users",
      "Priority support",
      "Expanded storage (100GB)",
      "Access to all advanced features",
      "Comprehensive reporting and analytics",
      "Full customization",
      "Advanced security features",
      "Access to premium templates and exclusive design assets",
      "Deep integrations with business platforms",
      "Advanced mobile app features",
    ],
  },
  {
    id: "premium",
    name: "Business",
    monthlyPrice: "$79",
    yearlyPrice: "$63",
    discount: "Save 20%",
    features: [
      "200 number of users",
      "24/7 priority support",
      "Unlimited storage",
      "Access to all advanced features",
      "Advanced reporting and analytics with AI insights",
      "Full customization and white-labeling",
      "Enterprise-grade security features",
      "Dedicated account manager",
      "Custom training sessions",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: "Custom",
    yearlyPrice: "Custom",
    discount: "Save 20%",
    features: [
      "Unlimited number of users",
      "24/7 dedicated support with SLA",
      "Unlimited storage with custom infrastructure",
      "Access to all features including beta releases",
      "Enterprise-grade security with compliance certifications",
      "Access to all premium templates, exclusive assets, and custom designs",
      "Unlimited integrations with custom API development",
      "SLA guarantees and custom contracts",
      "On-premise deployment options",
    ],
  },
];

export default function PricingTable() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [selectedPlan, setSelectedPlan] = useState("standard");

  return (
    <section className="mx-auto w-full max-w-5xl space-y-8 px-4 py-16">
      <header className="mx-auto max-w-3xl space-y-4 text-center text-balance">
        <div className="flex justify-center">
          <Badge variant="outline">Pricing</Badge>
        </div>
        <h1 className="text-4xl font-bold leading-tight lg:text-4xl">
          Flexible Pricing for Every Business
        </h1>
        <p className="text-muted-foreground md:text-lg">
          Discover a range of pricing plans designed to meet diverse customer
          requirements, from individuals and small teams to large enterprises.
        </p>
        <div className="flex justify-center">
          <div className="bg-muted inline-flex items-center gap-1 rounded-md border p-1">
            <Button
              variant={billingCycle === "yearly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setBillingCycle("yearly")}
            >
              Yearly
            </Button>
            <Button
              variant={billingCycle === "monthly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </Button>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-4 md:grid-cols-5">
        <RadioGroup
          value={selectedPlan}
          onValueChange={setSelectedPlan}
          className="md:col-span-2 space-y-1"
        >
          {pricingPlans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const price =
              billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;

            return (
              <div
                key={plan.id}
                className="has-data-[state=checked]:border-primary has-data-[state=checked]:bg-muted relative rounded-lg border p-4 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <RadioGroupItem
                      value={plan.id}
                      id={`plan-${plan.id}`}
                      aria-describedby={`plan-${plan.id}-description`}
                      className="mt-1 size-4 after:absolute after:inset-0 [&_svg]:size-2"
                    />
                    <div className="relative z-10 space-y-1">
                      <Label
                        htmlFor={`plan-${plan.id}`}
                        className="cursor-pointer"
                      >
                        <CardTitle>{plan.name}</CardTitle>
                      </Label>
                      <Badge
                        variant={isSelected ? "secondary" : "secondary"}
                        className="text-xs"
                      >
                        {plan.discount}
                      </Badge>
                    </div>
                  </div>
                  <div className="relative z-10 text-right">
                    <div className="text-xl font-bold">{price}</div>
                    {price !== "Custom" && (
                      <CardDescription className="text-xs">
                        /month
                      </CardDescription>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </RadioGroup>

        <Card className="md:col-span-3 shadow-none">
          <CardHeader>
            <CardTitle>Includes:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pricingPlans
              .find((plan) => plan.id === selectedPlan)
              ?.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="text-green-600 mt-0.5 size-4 shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            <Button className="mt-4 w-full" size="lg">
              Choose Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
