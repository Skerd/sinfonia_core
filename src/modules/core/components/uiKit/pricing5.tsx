"use client";

import { ArrowRight, CheckIcon } from "lucide-react";

import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@coreModule/components/uiKit/ui/card";

export default function PricingTable() {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-16 lg:space-y-12">
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-8">
        <h1 className="text-3xl leading-tight font-bold text-balance lg:text-4xl">
          Creative services with transparent subscription pricing.
        </h1>
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed text-balance md:text-lg">
            Rapidly scale creative output for content, brand, social media and
            campaigns. Each plan includes a dedicated design team to deliver
            beautiful designs, on-time and at the scale you need.
          </p>
          <Button variant="secondary">
            Book a demo
            <ArrowRight />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">Professional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4 shrink-0 text-green-600" />
                <span className="text-sm">All Basic Services</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4 shrink-0 text-green-600" />
                <span className="text-sm">Unlimited Requests</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4 shrink-0 text-green-600" />
                <span className="text-sm">Unlimited Revisions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4 shrink-0 text-green-600" />
                <span className="text-sm">Cancel Anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4 shrink-0 text-green-600" />
                <span className="text-sm">A-Sync Collaboration</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-auto items-start justify-between gap-4">
            <div className="flex items-end gap-2">
              <span className="text-2xl font-semibold">$3.990</span>
              <span className="text-muted-foreground mb-1 text-xs">/month</span>
            </div>
            <Button size="lg">
              Get Started
              <ArrowRight />
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-foreground bg-foreground text-background shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">Unlimited</CardTitle>
            <CardAction>
              <Badge
                variant="secondary"
                className="dark bg-green-700 text-[10px] uppercase"
              >
                Most Popular
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4 shrink-0 text-green-600" />
                <span className="text-sm">All Basic Services</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4 shrink-0 text-green-600" />
                <span className="text-sm">Unlimited Requests</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4 shrink-0 text-green-600" />
                <span className="text-sm">All Advanced Services</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4 shrink-0 text-green-600" />
                <span className="text-sm">Unlimited Revisions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4 shrink-0 text-green-600" />
                <span className="text-sm">Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4 shrink-0 text-green-600" />
                <span className="text-sm">A-Sync Collaboration</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4 shrink-0 text-green-600" />
                <span className="text-sm">Art Direction</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4 shrink-0 text-green-600" />
                <span className="text-sm">Weekly Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4 shrink-0 text-green-600" />
                <span className="text-sm">Concept and Ideation</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-auto items-start justify-between gap-4">
            <div className="flex items-end gap-2">
              <span className="text-2xl font-semibold">$5.990</span>
              <span className="text-muted-foreground mb-1 text-xs">/month</span>
            </div>
            <Button variant="secondary" size="lg">
              Get Started
              <ArrowRight />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
