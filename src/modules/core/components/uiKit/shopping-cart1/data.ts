import type { CartLine } from "./type";

export const initialLines: CartLine[] = [
  {
    id: "1",
    title: "Classic Hoodie",
    variant: "Black · Medium",
    unitPrice: 45,
    quantity: 1,
    image:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=300",
    inStock: true,
    selected: true,
  },
  {
    id: "2",
    title: "Denim Jacket",
    variant: "Blue · Large",
    unitPrice: 80,
    quantity: 2,
    image:
      "https://plus.unsplash.com/premium_photo-1670537994863-5ad53a3214e0?q=80&w=300",
    inStock: false,
    selected: true,
  },
  {
    id: "3",
    title: "Slim Fit Jeans",
    variant: "Dark Wash · 32",
    unitPrice: 50,
    quantity: 1,
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300",
    inStock: true,
    selected: false,
  },
];
