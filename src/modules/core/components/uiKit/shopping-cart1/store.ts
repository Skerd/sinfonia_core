"use client";

import { create } from "zustand";

import { initialLines } from "./data";
import type { CartLine } from "./type";

type AppliedPromo = { code: string; percentOff: number };

type CartState = {
  lines: CartLine[];
  promoInput: string;
  appliedPromo: AppliedPromo | null;
  promoError: string | null;
  toggleSelectAll: () => void;
  toggleLine: (id: string) => void;
  incrementQty: (id: string) => void;
  decrementQty: (id: string) => void;
  removeLine: (id: string) => void;
  setPromoInput: (value: string) => void;
  applyPromo: () => void;
  removePromo: () => void;
};

export const useCartStore = create<CartState>((set, get) => ({
  lines: initialLines,
  promoInput: "",
  appliedPromo: null,
  promoError: null,

  toggleSelectAll: () => {
    const { lines } = get();
    if (lines.length === 0) return;
    const allSelected = lines.every((l) => l.selected);
    set({
      lines: lines.map((l) => ({ ...l, selected: !allSelected })),
    });
  },

  toggleLine: (id) => {
    set({
      lines: get().lines.map((l) =>
        l.id === id ? { ...l, selected: !l.selected } : l,
      ),
    });
  },

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
    set({ lines: get().lines.filter((l) => l.id !== id) });
  },

  setPromoInput: (value) => {
    set({ promoInput: value, promoError: null });
  },

  applyPromo: () => {
    const raw = get().promoInput.trim().toUpperCase();
    if (!raw) {
      set({ promoError: "Enter a code" });
      return;
    }
    const percent = 10; // discount percentage
    set({
      appliedPromo: { code: raw, percentOff: percent },
      promoError: null,
      promoInput: "",
    });
  },

  removePromo: () => {
    set({ appliedPromo: null, promoError: null });
  },
}));

export function getSelectedSubtotal(lines: CartLine[]) {
  return lines.reduce((sum, l) => {
    if (!l.selected) return sum;
    return sum + l.unitPrice * l.quantity;
  }, 0);
}
