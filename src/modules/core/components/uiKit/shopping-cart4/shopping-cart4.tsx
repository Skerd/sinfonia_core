"use client";

import { ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@coreModule/components/uiKit/ui/drawer";

import { CartItem } from "./cart-item";
import { getSubtotal, useBagStore } from "./store";
import { Badge } from "@coreModule/components/uiKit/ui/badge";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ShoppingCartBlock4() {
  const [open, setOpen] = useState(true);
  const items = useBagStore((s) => s.items);
  const subtotal = getSubtotal(items);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  return (
    <div className="flex h-screen items-center justify-center">
      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <DrawerTrigger asChild>
          <Button>Go to Cart</Button>
        </DrawerTrigger>

        <DrawerContent>
          <DrawerHeader className="flex-row items-center justify-between border-b px-6 py-5">
            <DrawerTitle className="flex grow items-center gap-2">
              <ShoppingBag className="size-4" />
              Shopping Bag
              <Badge variant="outline" className="ml-auto">
                {itemCount} item{itemCount > 1 ? "s" : ""}
              </Badge>
            </DrawerTitle>
          </DrawerHeader>

          <div className="no-scrollbar flex h-full flex-col overflow-y-auto px-6 pb-6">
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-4 py-12 text-center text-sm">
                  Your bag is empty.
                  <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <div>
                  {items.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <DrawerFooter>
            <div className="text-primary text-2xl tabular-nums">
              {formatMoney(subtotal)}
            </div>
            <Button
              type="button"
              size="lg"
              disabled={items.length === 0}
              className="w-full"
            >
              Proceed To Checkout
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
