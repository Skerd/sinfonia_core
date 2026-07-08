"use client";

import { ArrowRight, Info } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Checkbox } from "@coreModule/components/uiKit/ui/checkbox";
import { Input } from "@coreModule/components/uiKit/ui/input";
import { Label } from "@coreModule/components/uiKit/ui/label";
import { Separator } from "@coreModule/components/uiKit/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@coreModule/components/uiKit/ui/tooltip";

import { CartLineRow } from "./cart-line";
import { getSelectedSubtotal, useCartStore } from "./store";
import { Card, CardContent, CardHeader, CardTitle } from "@coreModule/components/uiKit/ui/card";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function ShoppingCartBlock() {
  const lines = useCartStore((s) => s.lines);
  const promoInput = useCartStore((s) => s.promoInput);
  const appliedPromo = useCartStore((s) => s.appliedPromo);
  const promoError = useCartStore((s) => s.promoError);
  const toggleSelectAll = useCartStore((s) => s.toggleSelectAll);
  const setPromoInput = useCartStore((s) => s.setPromoInput);
  const applyPromo = useCartStore((s) => s.applyPromo);
  const removePromo = useCartStore((s) => s.removePromo);

  const allSelected = lines.length > 0 && lines.every((l) => l.selected);
  const someSelected = lines.some((l) => l.selected);
  const selectAllState: boolean | "indeterminate" = allSelected
    ? true
    : someSelected
      ? "indeterminate"
      : false;

  const selectedSubtotal = getSelectedSubtotal(lines);
  const discountAmount = appliedPromo
    ? selectedSubtotal * (appliedPromo.percentOff / 100)
    : 0;
  const afterDiscount = Math.max(0, selectedSubtotal - discountAmount);
  const shipping = someSelected ? 5.99 : 0;
  const taxable = afterDiscount + shipping;
  const tax = someSelected ? Math.round(taxable * 0.045 * 100) / 100 : 0;
  const orderTotal = afterDiscount + shipping + tax;

  return (
    <div className="px-4 max-w-5xl py-14 sm:px-6 mx-auto sm:py-20 lg:px-8">
      <h1 className="text-3xl font-semibold lg:mb-10">Shopping Cart</h1>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {lines.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              Your cart is empty.
            </p>
          ) : (
            <>
              <div className="text-muted-foreground mb-2 flex items-center gap-3 text-sm">
                <Checkbox
                  id="select-all"
                  checked={selectAllState}
                  onCheckedChange={() => toggleSelectAll()}
                />
                <Label htmlFor="select-all" className="cursor-pointer">
                  Select all ({lines.length} items)
                </Label>
              </div>
              <Separator />
              {lines.map((line) => (
                <CartLineRow key={line.id} line={line} />
              ))}
            </>
          )}
        </div>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!appliedPromo ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="promo-code"
                    placeholder="Discount code"
                    aria-invalid={!!promoError}
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyPromo();
                      }
                    }}
                    disabled={!!appliedPromo}
                  />
                  <Button type="button" onClick={applyPromo}>
                    Apply
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="link"
                onClick={removePromo}
                size="sm"
                className="text-destructive h-auto p-0"
              >
                Remove discount
              </Button>
            )}

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">
                  {formatMoney(selectedSubtotal)}
                </span>
              </div>

              {appliedPromo && discountAmount > 0 ? (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedPromo.percentOff}% off)</span>
                  <span className="font-medium tabular-nums">
                    −{formatMoney(discountAmount)}
                  </span>
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <div className="text-muted-foreground flex items-center gap-1">
                  Shipping
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="size-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Flat rate for orders with at least one selected item.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="font-medium tabular-nums">
                  {formatMoney(shipping)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-muted-foreground flex items-center gap-1">
                  Tax estimate
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="size-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Estimated tax on discounted subtotal plus shipping.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="font-medium tabular-nums">
                  {formatMoney(tax)}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between font-medium">
                <span>Order total</span>
                <span className="tabular-nums">{formatMoney(orderTotal)}</span>
              </div>
            </div>

            <Button className="w-full justify-between" size="lg">
              Checkout
              <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
