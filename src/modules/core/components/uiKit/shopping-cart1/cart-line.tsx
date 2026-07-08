"use client";

import Image from "next/image";
import { Ban, Check, Minus, Plus, Trash2 } from "lucide-react";

import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Checkbox } from "@coreModule/components/uiKit/ui/checkbox";

import { useCartStore } from "./store";
import type { CartLine } from "./type";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function CartLineRow({ line }: { line: CartLine }) {
  const toggleLine = useCartStore((s) => s.toggleLine);
  const incrementQty = useCartStore((s) => s.incrementQty);
  const decrementQty = useCartStore((s) => s.decrementQty);
  const removeLine = useCartStore((s) => s.removeLine);

  const lineTotal = line.unitPrice * line.quantity;

  return (
    <div className="group flex gap-4 border-b py-6 last:border-b-0">
      <div className="pt-1">
        <Checkbox
          checked={line.selected}
          onCheckedChange={() => toggleLine(line.id)}
          aria-label={`Select ${line.title}`}
        />
      </div>

      <div className="relative shrink-0">
        <Image
          src={line.image}
          alt={line.title}
          width={96}
          height={96}
          className="aspect-square max-w-16 rounded-md border object-cover md:max-w-20"
          unoptimized
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-4">
          <div className="grow space-y-1">
            <h3 className="font-medium">{line.title}</h3>
            <p className="text-muted-foreground text-sm">{line.variant}</p>
            <div className="mt-3 flex flex-wrap items-center">
              {line.inStock ? (
                <Badge variant="outline" className="text-green-600">
                  <Check />
                  In stock
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  <Ban />
                  Sold out
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-4">
            <p className="text-muted-foreground text-sm">
              {formatMoney(line.unitPrice)}
            </p>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-destructive! me-1 group-hover:opacity-100 md:opacity-0"
                onClick={() => removeLine(line.id)}
                aria-label={`Remove ${line.title}`}
              >
                <Trash2 />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() => decrementQty(line.id)}
                disabled={line.quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus />
              </Button>
              <span className="min-w-8 text-center text-sm tabular-nums">
                {line.quantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() => incrementQty(line.id)}
                aria-label="Increase quantity"
              >
                <Plus />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
