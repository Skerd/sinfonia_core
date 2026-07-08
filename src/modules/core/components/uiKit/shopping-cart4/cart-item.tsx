"use client";

import Image from "next/image";
import { MinusIcon, PlusIcon } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";

import { useBagStore } from "./store";
import type { BagItem } from "./type";
import { ButtonGroup } from "@coreModule/components/uiKit/ui/button-group";
import { Input } from "@coreModule/components/uiKit/ui/input";
import { Badge } from "@coreModule/components/uiKit/ui/badge";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function CartItem({ item }: { item: BagItem }) {
  const incrementQty = useBagStore((s) => s.incrementQty);
  const decrementQty = useBagStore((s) => s.decrementQty);
  const removeItem = useBagStore((s) => s.removeItem);

  return (
    <div className="flex items-start gap-3 py-4">
      <figure className="relative mt-1 size-14">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="rounded-md border object-cover"
          unoptimized
        />
        <Badge className="absolute -top-1 -right-1 size-4 p-0 text-[11px]">
          {item.quantity}
        </Badge>
      </figure>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="font-semibold">{item.brand}</div>
        <div className="text-muted-foreground truncate text-sm">
          {item.title}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="link"
            size="xs"
            className="text-destructive h-auto p-0"
            onClick={() => removeItem(item.id)}
          >
            Remove
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-end space-y-2">
        <div className="tabular-nums">
          {formatMoney(item.price * item.quantity)}
        </div>

        <ButtonGroup aria-label="Media controls">
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => decrementQty(item.id)}
          >
            <MinusIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => incrementQty(item.id)}
          >
            <PlusIcon />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
