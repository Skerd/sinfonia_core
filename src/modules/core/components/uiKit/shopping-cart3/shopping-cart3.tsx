"use client";

import { X } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@coreModule/components/uiKit/ui/card";
import { Input } from "@coreModule/components/uiKit/ui/input";
import { Separator } from "@coreModule/components/uiKit/ui/separator";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@coreModule/components/uiKit/ui/breadcrumb";

import { CartItemRow } from "./cart-item-row";
import { getSubtotal, useCartStore } from "./store";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value);
}

export default function ShoppingCartBlock3() {
  const lines = useCartStore((s) => s.lines);
  const promoInput = useCartStore((s) => s.promoInput);
  const appliedPromo = useCartStore((s) => s.appliedPromo);
  const promoError = useCartStore((s) => s.promoError);
  const setPromoInput = useCartStore((s) => s.setPromoInput);
  const applyPromo = useCartStore((s) => s.applyPromo);
  const removePromo = useCartStore((s) => s.removePromo);
  const giftWrapEnabled = useCartStore((s) => s.giftWrapEnabled);
  const toggleGiftWrap = useCartStore((s) => s.toggleGiftWrap);
  const giftWrapPrice = useCartStore((s) => s.giftWrapPrice);

  const subtotal = getSubtotal(lines);
  const discountAmount = appliedPromo
    ? subtotal * (appliedPromo.percentOff / 100)
    : 0;
  const total =
    Math.max(0, subtotal - discountAmount) +
    (giftWrapEnabled ? giftWrapPrice : 0);

  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:py-20">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Cart</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Address</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Payment</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        {lines.length === 0 ? (
          <div className="text-muted-foreground px-6 pb-10 text-sm">
            Your cart is empty.
          </div>
        ) : (
          <div>
            <Separator className="mt-4" />
            {lines.map((line) => (
              <CartItemRow key={line.id} line={line} />
            ))}
          </div>
        )}

        <div className="space-y-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Coupons</CardTitle>
              {appliedPromo && (
                <CardAction>
                  <Badge variant="secondary" className="gap-1">
                    20% OFF
                  </Badge>
                </CardAction>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {appliedPromo ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="text-muted-foreground text-sm font-medium">
                        Coupon Code:
                      </div>
                      <div className="text-sm">{appliedPromo.code}</div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={removePromo}
                      aria-label="Remove coupon"
                    >
                      <X />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Coupon code"
                      aria-invalid={!!promoError}
                    />
                    <Button type="button" onClick={applyPromo}>
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Buying for love of your life?</CardTitle>
              <CardDescription>
                We'll wrap it beautifully to make it extra special!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="button"
                variant="default"
                onClick={toggleGiftWrap}
                className="w-full"
              >
                Add Gift Wrap
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Price Details</CardTitle>
              <CardAction>
                <span className="text-muted-foreground text-xs">
                  {totalQuantity} items
                </span>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lines.length > 0 ? (
                  <>
                    {lines.map((line) => (
                      <div
                        key={line.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          <Badge variant="outline" className="mr-2">
                            {line.quantity}x
                          </Badge>
                          {line.title}
                        </span>
                        <span className="tabular-nums">
                          {formatMoney(line.price)}
                        </span>
                      </div>
                    ))}
                  </>
                ) : null}

                {discountAmount > 0 ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-destructive tabular-nums">
                      -{formatMoney(discountAmount)}
                    </span>
                  </div>
                ) : null}

                <Separator />

                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Total Amount</span>
                  <span className="tabular-nums">{formatMoney(total)}</span>
                </div>

                <Button
                  type="button"
                  disabled={lines.length === 0}
                  className="mt-3 w-full"
                >
                  Confirm Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
