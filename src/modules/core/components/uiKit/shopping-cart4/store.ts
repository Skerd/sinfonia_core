"use client";

import { create } from "zustand";

import { initialItems } from "./data";
import type { BagItem } from "./type";

type BagState = {
  items: BagItem[];
  incrementQty: (id: string) => void;
  decrementQty: (id: string) => void;
  removeItem: (id: string) => void;
};

export const useBagStore = create<BagState>((set, get) => ({
  items: initialItems,

  incrementQty: (id) => {
    set({
      items: get().items.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    });
  },

  decrementQty: (id) => {
    set({
      items: get().items.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item,
      ),
    });
  },

  removeItem: (id) => {
    set({ items: get().items.filter((item) => item.id !== id) });
  },
}));

export function getSubtotal(items: BagItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

