import { Check } from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import { allFeatures, plans } from "./data";

export default function PricingTable() {
  return (
    <div className="mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-2">
          <Badge variant="outline">Plans</Badge>
          <h1 className="text-4xl font-bold leading-tight lg:text-4xl">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground text-lg text-balance">
            Choose the perfect plan for your business needs. Upgrade or
            downgrade at any time.
          </p>
        </header>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className="bg-muted space-y-2 border-none shadow-none"
            >
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="font-semibold">{plan.name}</div>
                    <p className="text-muted-foreground mb-4 text-sm text-balance">
                      {plan.description}
                    </p>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold">
                      ${plan.monthlyPrice}
                    </span>
                    <span className="text-muted-foreground mb-0.5">/mo</span>
                  </div>
                </div>

                <Button className="w-full">Get started</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="py-2 shadow-none">
          <CardContent className="px-0">
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-6 py-4 text-start">Features</th>
                    {plans.map((plan, index) => (
                      <th
                        key={index}
                        className="px-6 py-4 text-center font-medium"
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="[&_tr:nth-child(odd)]:bg-muted">
                  {allFeatures.map((feature, featureIndex) => (
                    <tr key={featureIndex} className="border-b last:border-b-0">
                      <td className="px-6 py-4">{feature}</td>
                      {plans.map((plan, planIndex) => (
                        <td key={planIndex} className="px-6 py-4 text-center">
                          {typeof plan.features[feature] === "boolean" ? (
                            plan.features[feature] ? (
                              <Check className="mx-auto size-5 text-green-600" />
                            ) : (
                              <span>—</span>
                            )
                          ) : (
                            <span>{plan.features[feature]}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
              {plans.map((plan, planIndex) => (
                <div key={planIndex} className="border-b last:border-b-0">
                  <div className="px-6 py-3">
                    <h4 className="font-semibold">{plan.name}</h4>
                  </div>
                  <div className="space-y-3 px-6 py-4">
                    {allFeatures.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-center justify-between"
                      >
                        <span className="text-muted-foreground">{feature}</span>
                        <div>
                          {typeof plan.features[feature] === "boolean" ? (
                            plan.features[feature] ? (
                              <Check className="size-5 text-green-600" />
                            ) : (
                              <span>—</span>
                            )
                          ) : (
                            <span>{plan.features[feature]}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
