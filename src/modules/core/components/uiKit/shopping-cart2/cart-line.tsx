"use client";

import Image from "next/image";
import { Check, Minus, Plus, Trash2 } from "lucide-react";

import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@coreModule/components/uiKit/ui/input-group";

import type { CartLine } from "./type";
import { useCartStore } from "./store";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function CartLineRow({ line }: { line: CartLine }) {
  const incrementQty = useCartStore((s) => s.incrementQty);
  const decrementQty = useCartStore((s) => s.decrementQty);
  const removeLine = useCartStore((s) => s.removeLine);

  const lineTotal = line.price * line.quantity;

  return (
    <div className="grid items-center gap-4 py-4 lg:py-8 md:grid-cols-[1.6fr_0.5fr_0.7fr_0.5fr]">
      <div className="flex items-center gap-4">
        <div className="relative flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-destructive!"
            onClick={() => removeLine(line.id)}
            aria-label={`Remove ${line.title}`}
          >
            <Trash2 />
          </Button>
          <Image
            src={line.image}
            alt={line.title}
            width={68}
            height={68}
            className="aspect-square rounded-md border object-cover"
            unoptimized
          />
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{line.title}</div>
          <div className="text-muted-foreground text-xs">
            Color: {line.color} • Size: {line.size}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {line.inStock ? (
              <Badge
                variant="outline"
                className="border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              >
                <Check className="size-3" />
                In Stock ({line.stockCount} Pcs)
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Out of stock
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="text-center text-sm font-medium tabular-nums">
        {formatMoney(line.price)}
      </div>

      <InputGroup className="mx-auto w-fit px-1">
        <InputGroupButton
          type="button"
          variant="secondary"
          size="icon-xs"
          onClick={() => decrementQty(line.id)}
          disabled={line.quantity <= 1}
          aria-label="Decrease quantity"
        >
          <Minus />
        </InputGroupButton>

        <InputGroupInput
          value={line.quantity}
          readOnly
          aria-label="Quantity"
          className="w-12 flex-none text-center font-medium tabular-nums"
        />

        <InputGroupButton
          type="button"
          variant="secondary"
          size="icon-xs"
          onClick={() => incrementQty(line.id)}
          aria-label="Increase quantity"
        >
          <Plus />
        </InputGroupButton>
      </InputGroup>

      <div className="text-end text-sm font-medium tabular-nums">
        {formatMoney(lineTotal)}
      </div>
    </div>
  );
}
