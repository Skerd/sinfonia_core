"use client";

import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@coreModule/components/uiKit/ui/input-group";

import { useCartStore } from "./store";
import type { CartLine } from "./type";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function CartItemRow({ line }: { line: CartLine }) {
  const incrementQty = useCartStore((s) => s.incrementQty);
  const decrementQty = useCartStore((s) => s.decrementQty);
  const removeLine = useCartStore((s) => s.removeLine);

  return (
    <div className="flex gap-4 py-6 not-last:border-b">
      <div className="bg-muted relative size-36 overflow-hidden rounded-md">
        <Image
          src={line.image}
          alt={line.title}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
        <div className="flex h-full min-w-0 grow flex-col space-y-1">
          <div className="text-muted-foreground text-xs">{line.brand}</div>
          <div className="truncate font-semibold">{line.title}</div>
          <div className="mt-auto text-sm">{formatMoney(line.price)}</div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => removeLine(line.id)}
          aria-label={`Remove ${line.title}`}
          className="text-muted-foreground"
        >
          <X />
        </Button>
        <InputGroup className="rounded-full px-1 mt-auto">
          <InputGroupButton
            type="button"
            variant="ghost"
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
            variant="ghost"
            size="icon-xs"
            onClick={() => incrementQty(line.id)}
            aria-label="Increase quantity"
          >
            <Plus />
          </InputGroupButton>
        </InputGroup>
      </div>
    </div>
  );
}
