"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@coreModule/components/uiKit/ui/card";

import { plans } from "./data";

export default function PricingTable() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <section className="mx-auto w-full max-w-5xl space-y-4 px-4 py-12 lg:space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold leading-tight lg:text-4xl">Choose a Subscription</h1> 
        <p className="text-muted-foreground text-lg">Choose a plan tailored to your needs</p>
      </div>

      <div className="flex justify-center">
        <div className="bg-muted inline-flex items-center gap-1 rounded-full border p-1">
          <Button
            variant={billingCycle === "monthly" ? "default" : "ghost"}
            className="rounded-full"
            onClick={() => setBillingCycle("monthly")}>
            Monthly
          </Button>
          <Button
            variant={billingCycle === "yearly" ? "default" : "ghost"}
            className="rounded-full"
            onClick={() => setBillingCycle("yearly")}>
            Yearly
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className="shadow-none">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-3xl font-bold">{plan.price[billingCycle]}</span>
                <span className="text-muted-foreground text-sm">
                  {" "}
                  / {billingCycle === "monthly" ? "month" : "year"}
                </span>
              </div>
              <hr />
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="text-muted-foreground/50 size-4 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Get Started</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}

