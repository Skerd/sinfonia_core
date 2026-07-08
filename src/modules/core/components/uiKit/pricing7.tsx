"use client";

import { useState } from "react";
import { Check, X, Info } from "lucide-react";

import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@coreModule/components/uiKit/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@coreModule/components/uiKit/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@coreModule/components/uiKit/ui/tooltip";

const features = [
  {
    name: "Component Library",
    info: "Access to our comprehensive UI component collection",
    basic: { included: true, value: "Single user access" },
    plus: { included: true, value: "Single user access" },
    premium: { included: true, value: "Single user access" },
  },
  {
    name: "Documentation",
    info: "Comprehensive guides and tutorials",
    basic: { included: true, value: "Free access" },
    plus: { included: true, value: "Free access" },
    premium: { included: true, value: "Free access" },
  },
  {
    name: "Premium Components",
    info: "Advanced and specialized component sets",
    basic: { included: false, value: "Not included" },
    plus: { included: true, value: "Design only" },
    premium: { included: true, value: "Design + Code" },
  },
  {
    name: "Templates",
    info: "Ready-to-use page templates and layouts",
    basic: { included: false, value: "Not included" },
    plus: { included: true, value: "Design only" },
    premium: { included: true, value: "Design + Code" },
  },
  {
    name: "Design Tool Plugin",
    info: "Native plugin for design software integration",
    basic: { included: false, value: "Not included" },
    plus: { included: false, value: "Not included" },
    premium: { included: true, value: "Single user access" },
  },
  {
    name: "Free Updates",
    info: "Lifetime access to all future updates",
    basic: { included: true, value: "Lifetime access" },
    plus: { included: true, value: "Lifetime access" },
    premium: { included: true, value: "Lifetime access" },
  },
  {
    name: "Commercial Usage",
    info: "Use components in commercial projects",
    basic: { included: true, value: "Use on unlimited projects" },
    plus: { included: true, value: "Use on unlimited projects" },
    premium: { included: true, value: "Use on unlimited projects" },
  },
  {
    name: "Support Response",
    info: "Average response time for support requests",
    basic: { included: true, value: "48 hours" },
    plus: { included: true, value: "24 hours" },
    premium: { included: true, value: "24 hours" },
  },
];

const licenseTypes = [
  {
    value: "personal",
    label: "Personal",
    description: "Dedicated to solo designers, developers or freelancers",
    licenseInfo: "Component library license for one user",
    prices: {
      basic: { current: 119, original: 149 },
      plus: { current: 299, original: 399 },
      premium: { current: 559, original: 699 },
    },
  },
  {
    value: "team",
    label: "Team",
    description: "Perfect for small teams and agencies",
    licenseInfo: "Component library license for up to 5 users",
    prices: {
      basic: { current: 179, original: 199 },
      plus: { current: 449, original: 599 },
      premium: { current: 839, original: 1049 },
    },
  },
  {
    value: "enterprise",
    label: "Enterprise",
    description: "Ideal for large organizations",
    licenseInfo: "Component library license for unlimited users",
    prices: {
      basic: { current: 239, original: 299 },
      plus: { current: 599, original: 799 },
      premium: { current: 1119, original: 1399 },
    },
  },
];

export default function PricingTable() {
  const [licenseType, setLicenseType] = useState("personal");
  const currentLicense =
    licenseTypes.find((l) => l.value === licenseType) || licenseTypes[0];

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-16">
      <header className="mb-10 space-y-4 text-center">
        <Badge variant="secondary">Pricing</Badge>
        <h1 className="text-4xl leading-tight font-bold text-balance lg:text-4xl">
          Get access and start building faster
        </h1>
        <p className="text-muted-foreground text-lg text-balance">
          Purchase with a single payment and join over{" "}
          <strong>6,300+ creators and teams</strong> who trusted us.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Card className="bg-muted shadow-none">
          <CardContent className="flex flex-col space-y-4">
            <div>
              <div className="mb-4 font-semibold">Select your license</div>
              <Select value={licenseType} onValueChange={setLicenseType}>
                <SelectTrigger className="bg-background w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {licenseTypes.map((license) => (
                    <SelectItem key={license.value} value={license.value}>
                      {license.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {licenseTypes
                .find((l) => l.value === licenseType)
                ?.description.split(". ")
                .map((desc, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="text-primary mt-0.5 size-4 shrink-0" />
                    <p className="text-muted-foreground text-sm">{desc}</p>
                  </div>
                ))}
              <div className="flex items-start gap-2">
                <Check className="text-primary mt-0.5 size-4 shrink-0" />
                <p className="text-muted-foreground text-sm">
                  {
                    licenseTypes.find((l) => l.value === licenseType)
                      ?.licenseInfo
                  }
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-auto">
            <a href="#" className="text-primary text-xs hover:underline">
              Need help choosing the right license?
            </a>
          </CardFooter>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Basic Package</CardTitle>
              <CardDescription>
                For creators needing lifetime access to the basic component
                library.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    ${currentLicense.prices.basic.current}
                  </span>
                  {currentLicense.prices.basic.original && (
                    <span className="text-muted-foreground text-sm line-through">
                      ${currentLicense.prices.basic.original}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  One-time payment · Plus local taxes
                </p>
              </div>
              <Button className="w-full">Get Started</Button>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Plus Package</CardTitle>
              <CardDescription>
                Includes Premium Components, Templates, and free lifetime
                updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    ${currentLicense.prices.plus.current}
                  </span>
                  {currentLicense.prices.plus.original && (
                    <span className="text-muted-foreground text-lg line-through">
                      ${currentLicense.prices.plus.original}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  One-time payment · Plus local taxes
                </p>
              </div>
              <Button className="w-full" variant="default">
                Get Started
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Premium Package</CardTitle>
              <CardDescription>
                All design and code resources for creators.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    ${currentLicense.prices.premium.current}
                  </span>
                  {currentLicense.prices.premium.original && (
                    <span className="text-muted-foreground text-lg line-through">
                      ${currentLicense.prices.premium.original}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  One-time payment · Plus local taxes
                </p>
              </div>
              <Button className="w-full" variant="default">
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left font-medium">Feature</th>
              <th className="p-4 text-start font-medium">Basic Package</th>
              <th className="p-4 text-start font-medium">Plus Package</th>
              <th className="p-4 text-start font-medium">Premium Package</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr
                key={index}
                className={`border-b ${index % 2 === 1 ? "bg-muted" : ""}`}
              >
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{feature.name}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="text-muted-foreground size-3.5 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{feature.info}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </td>
                <td className="p-4">
                  {feature.basic.included ? (
                    <div className="flex items-center gap-1">
                      <Check className="size-5 text-green-600" />
                      <span className="text-muted-foreground text-sm">
                        {feature.basic.value}
                      </span>
                    </div>
                  ) : (
                    <X className="text-destructive size-4" />
                  )}
                </td>
                <td className="p-4">
                  {feature.plus.included ? (
                    <div className="flex items-center gap-1">
                      <Check className="size-5 text-green-600" />
                      <span className="text-muted-foreground text-sm">
                        {feature.plus.value}
                      </span>
                    </div>
                  ) : (
                    <X className="text-destructive size-4" />
                  )}
                </td>
                <td className="p-4">
                  {feature.premium.included ? (
                    <div className="flex items-center gap-1">
                      <Check className="size-5 text-green-600" />
                      <span className="text-muted-foreground text-sm">
                        {feature.premium.value}
                      </span>
                    </div>
                  ) : (
                    <X className="text-destructive size-4" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
