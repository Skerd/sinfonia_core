"use client";

import { ArrowRight } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Input } from "@coreModule/components/uiKit/ui/input";

import { CartLineRow } from "./cart-line";
import {
  getSelectedItemCount,
  getSelectedSubtotal,
  useCartStore,
} from "./store";
import { Separator } from "@coreModule/components/uiKit/ui/separator";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function ShoppingCartBlock2() {
  const lines = useCartStore((s) => s.lines);
  const appliedPromo = useCartStore((s) => s.appliedPromo);
  const promoInput = useCartStore((s) => s.promoInput);
  const promoError = useCartStore((s) => s.promoError);
  const setPromoInput = useCartStore((s) => s.setPromoInput);
  const applyPromo = useCartStore((s) => s.applyPromo);
  const removePromo = useCartStore((s) => s.removePromo);

  const rawSelectedSubtotal = getSelectedSubtotal(lines);
  const selectedCount = getSelectedItemCount(lines);

  const discountAmount = appliedPromo
    ? rawSelectedSubtotal * (appliedPromo.percentOff / 100)
    : 0;
  const afterDiscountSubtotal = Math.max(
    0,
    rawSelectedSubtotal - discountAmount,
  );

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <header className="mb-4 flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Shopping Cart</h1>
          <p className="text-muted-foreground text-sm">
            You have 3 products in your cart
          </p>
        </div>

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
      </header>

      <div>
        <div className="text-muted-foreground bg-muted hidden items-center gap-4 rounded-lg px-4 py-4 text-xs font-medium md:grid md:grid-cols-[1.6fr_0.5fr_0.7fr_0.5fr]">
          <div>Product</div>
          <div>Price</div>
          <div className="text-center">Quantity</div>
          <div className="text-right">Total</div>
        </div>

        <div className="divide-y">
          {lines.map((line) => (
            <CartLineRow key={line.id} line={line} />
          ))}
        </div>

        <Separator className="mb-6" />

        <div className="bg-background/40 mt-4 rounded-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="text-foreground text-sm font-medium">
                Sub Total: {formatMoney(afterDiscountSubtotal)}{" "}
                {appliedPromo && (
                  <span className="text-destructive">
                    ({appliedPromo?.percentOff}% off)
                  </span>
                )}
              </div>
              <div className="text-muted-foreground text-xs">
                Excl. Tax and Delivery charge
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={selectedCount === 0}
              >
                Continue Shipping
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={selectedCount === 0}
              >
                Go to Checkout
                <ArrowRight />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
