import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@coreModule/components/uiKit/ui/card";
import { Label } from "@coreModule/components/uiKit/ui/label";
import { RadioGroup, RadioGroupItem } from "@coreModule/components/uiKit/ui/radio-group";

import { Icons } from "./icons";

export default function CardPaymentMethod() {
  return (
    <Card className="w-full shadow-none md:w-96">
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
        <CardDescription>
          Add a new payment method to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <RadioGroup defaultValue="card" className="gap-3">
          <div>
            <RadioGroupItem
              value="card"
              id="card"
              className="peer sr-only"
              aria-label="Card"
            />
            <Label
              htmlFor="card"
              className="hover:bg-muted hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex items-center justify-between rounded-md border bg-transparent p-4"
            >
              Card
              <Icons.card className="size-6" />
            </Label>
          </div>

          <div>
            <RadioGroupItem
              value="paypal"
              id="paypal"
              className="peer sr-only"
              aria-label="Paypal"
            />
            <Label
              htmlFor="paypal"
              className="hover:bg-muted hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex items-center justify-between rounded-md border bg-transparent p-4"
            >
              Paypal
              <Icons.paypal className="size-6" />
            </Label>
          </div>

          <div>
            <RadioGroupItem
              value="apple"
              id="apple"
              className="peer sr-only"
              aria-label="Apple"
            />
            <Label
              htmlFor="apple"
              className="hover:bg-muted hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex items-center justify-between rounded-md border bg-transparent p-4"
            >
              Apple
              <Icons.apple className="size-6" />
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Pay</Button>
      </CardFooter>
    </Card>
  );
}
