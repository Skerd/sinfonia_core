import type { CartLine } from "./type";

export const initialLines: CartLine[] = [
  {
    id: "1",
    title: "HIKING RAIN PONCHO",
    price: 41.78,
    quantity: 1,
    image:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=300",
    color: "Green-D",
    size: "XL",
    inStock: true,
    stockCount: 12,
    selected: true,
  },
  {
    id: "2",
    title: "HIKING RAIN PONCHO",
    price: 41.78,
    quantity: 2,
    image:
      "https://plus.unsplash.com/premium_photo-1670537994863-5ad53a3214e0?q=80&w=300",
    color: "Green-D",
    size: "XL",
    inStock: true,
    stockCount: 1,
    selected: true,
  },
  {
    id: "3",
    title: "BAG",
    price: 41.78,
    quantity: 1,
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300",
    color: "Green-D",
    size: "XL",
    inStock: true,
    stockCount: 12,
    selected: false,
  },
];
