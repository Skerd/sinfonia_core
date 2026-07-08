import { Button } from "@coreModule/components/uiKit/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@coreModule/components/uiKit/ui/card";
import { Input } from "@coreModule/components/uiKit/ui/input";
import { Label } from "@coreModule/components/uiKit/ui/label";
import { CheckCircle } from "lucide-react";

export default function Newsletter4() {
  return (
    <section className="px-4 py-20">
      <Card className="mx-auto max-w-3xl overflow-hidden shadow-none">
        <div className="grid w-full grid-cols-1 items-center justify-center gap-8 p-6 md:grid-cols-2">
          <div>
            <CardHeader className="p-0">
              <CardTitle className="text-2xl leading-tight font-bold">
                Unlock exclusive content
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Sign up and get benefits like:
              </p>
            </CardHeader>
            <CardContent className="mt-4 p-0">
              <ul className="space-y-2" role="list">
                {[
                  "Exclusive tutorials",
                  "Product news",
                  "Member-only discounts",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-sm">
                    <CheckCircle
                      className="text-primary size-4 shrink-0"
                      strokeWidth={2}
                    />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </div>
          <form className="grid w-full gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email3">Email</Label>
              <Input
                id="email3"
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>
            <Button type="submit">Subscribe</Button>
          </form>
        </div>
      </Card>
    </section>
  );
}
