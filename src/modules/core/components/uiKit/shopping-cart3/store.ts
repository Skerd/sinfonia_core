"use client";

import { create } from "zustand";

import { initialLines } from "./data";
import type { AppliedPromo, CartLine } from "./type";

const GIFT_WRAP_PRICE = 49;

type CartState = {
  lines: CartLine[];
  promoInput: string;
  appliedPromo: AppliedPromo | null;
  promoError: string | null;
  giftWrapEnabled: boolean;

  incrementQty: (id: string) => void;
  decrementQty: (id: string) => void;
  removeLine: (id: string) => void;

  setPromoInput: (value: string) => void;
  applyPromo: () => void;
  removePromo: () => void;

  toggleGiftWrap: () => void;

  giftWrapPrice: number;
};

export const useCartStore = create<CartState>((set, get) => ({
  lines: initialLines,
  promoInput: "",
  appliedPromo: null,
  promoError: null,
  giftWrapEnabled: false,
  giftWrapPrice: GIFT_WRAP_PRICE,

  incrementQty: (id) => {
    set({
      lines: get().lines.map((l) =>
        l.id === id ? { ...l, quantity: l.quantity + 1 } : l,
      ),
    });
  },

  decrementQty: (id) => {
    set({
      lines: get().lines.map((l) =>
        l.id === id && l.quantity > 1 ? { ...l, quantity: l.quantity - 1 } : l,
      ),
    });
  },

  removeLine: (id) => {
    const nextLines = get().lines.filter((l) => l.id !== id);
    set({
      lines: nextLines,
      appliedPromo: nextLines.length === 0 ? null : get().appliedPromo,
      promoError: null,
      giftWrapEnabled: nextLines.length === 0 ? false : get().giftWrapEnabled,
    });
  },

  setPromoInput: (value) => {
    set({ promoInput: value, promoError: null });
  },

  applyPromo: () => {
    const raw = get().promoInput.trim();
    if (!raw) {
      set({ promoError: "Enter a code" });
      return;
    }

    set({
      appliedPromo: { code: raw, percentOff: 20 }, // discount is 20%
      promoError: null,
      promoInput: "",
    });
  },

  removePromo: () => {
    set({ appliedPromo: null, promoError: null, promoInput: "" });
  },

  toggleGiftWrap: () => {
    set({ giftWrapEnabled: !get().giftWrapEnabled });
  },
}));

export function getSubtotal(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
}
