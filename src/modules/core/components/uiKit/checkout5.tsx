"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowLeft, Info, Shield } from "lucide-react";
import { z } from "zod";

import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@coreModule/components/uiKit/ui/dialog";
import { Input } from "@coreModule/components/uiKit/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@coreModule/components/uiKit/ui/input-group";
import { Separator } from "@coreModule/components/uiKit/ui/separator";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { RadioGroup, RadioGroupItem } from "@coreModule/components/uiKit/ui/radio-group";
import { Label } from "@coreModule/components/uiKit/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@coreModule/components/uiKit/ui/tooltip";

type CartItem = {
  id: number;
  name: string;
  size: string;
  color: string;
  imageSrc: string;
  imageAlt: string;
  price: number;
  quantity: number;
};

const initialItems: CartItem[] = [
  {
    id: 1,
    name: "Samba OG shoes",
    size: "8.5",
    color: "Cloud White",
    imageSrc:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Samba OG shoes",
    price: 100,
    quantity: 1,
  },
  {
    id: 2,
    name: "New Balance MT580",
    size: "8.5",
    color: "White Sea Salt",
    imageSrc:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80",
    imageAlt: "New Balance MT580 shoes",
    price: 170,
    quantity: 1,
  },
];

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function normalizeExpiryMonth(value: string) {
  const [month = "", year = ""] = value.split("/");
  if (!month) {
    return value;
  }

  const numericMonth = Math.min(Math.max(Number(month), 1), 12);
  const normalizedMonth = String(numericMonth).padStart(2, "0");
  return year ? `${normalizedMonth}/${year}` : normalizedMonth;
}

const paymentDetailsSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, "Card number must be 16 digits"),
  cardExpiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry must be in MM/YY format"),
  cardCvc: z.string().regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
});

export default function CheckoutPage5() {
  const [open, setOpen] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [selectedSavedCard, setSelectedSavedCard] = useState("mastercard");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [paymentErrors, setPaymentErrors] = useState<{
    cardNumber?: string;
    cardExpiry?: string;
    cardCvc?: string;
  }>({});

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const deliveryCost = 12.99;
  const total = Math.max(subtotal + deliveryCost - appliedDiscount, 0);

  const updateQuantity = (id: number, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item,
      ),
    );
  };

  const handleApplyCode = () => {
    const normalizedCode = promoCode.trim();
    if (!normalizedCode) {
      setAppliedDiscount(0);
      return;
    }

    // Mock behavior: any non-empty code applies a flat discount.
    setAppliedDiscount(20);
  };

  const handleRemoveCode = () => {
    setPromoCode("");
    setAppliedDiscount(0);
  };

  const handlePayNow = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedPaymentData = {
      cardNumber: cardNumber.replace(/\D/g, ""),
      cardExpiry,
      cardCvc: cardCvc.replace(/\D/g, ""),
    };

    const validationResult = paymentDetailsSchema.safeParse(
      normalizedPaymentData,
    );

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      setPaymentErrors({
        cardNumber: fieldErrors.cardNumber?.[0],
        cardExpiry: fieldErrors.cardExpiry?.[0],
        cardCvc: fieldErrors.cardCvc?.[0],
      });
      return;
    }

    setPaymentErrors({});
  };

  return (
    <section className="flex h-screen w-full items-center justify-center">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Payment</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Cart</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <Image
                    src={item.imageSrc}
                    alt={item.imageAlt}
                    width={96}
                    height={96}
                    className="aspect-square h-full w-full max-w-12 rounded-md object-cover sm:max-w-16"
                    unoptimized
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-semibold">{item.name}</p>
                        <p className="text-muted-foreground flex gap-2 text-sm">
                          Size {item.size}
                          <Badge variant="outline">{item.color}</Badge>
                        </p>
                      </div>
                      <div className="space-y-2 text-right">
                        <p className="text-sm font-medium">
                          {formatPrice(item.price)}
                        </p>
                        <InputGroup
                          className="ml-auto max-w-24"
                          aria-label="Quantity"
                        >
                          <InputGroupAddon align="inline-start">
                            <InputGroupButton
                              aria-label="Decrease quantity"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                            >
                              -
                            </InputGroupButton>
                          </InputGroupAddon>
                          <InputGroupInput
                            value={String(item.quantity)}
                            readOnly
                            inputMode="numeric"
                            className="text-center text-lg tabular-nums"
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
                              aria-label="Increase quantity"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                            >
                              +
                            </InputGroupButton>
                          </InputGroupAddon>
                        </InputGroup>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="font-medium">Have a promotion code?</p>
              <InputGroup>
                <InputGroupInput
                  placeholder="Enter Code"
                  value={promoCode}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setPromoCode(nextValue);
                    if (!nextValue.trim()) {
                      setAppliedDiscount(0);
                    }
                  }}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    variant="outline"
                    onClick={
                      appliedDiscount > 0 ? handleRemoveCode : handleApplyCode
                    }
                  >
                    {appliedDiscount > 0 ? "Remove" : "Apply Code"}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium">Order Summary</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground inline-flex items-center gap-1">
                    Delivery Cost
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label="Delivery cost details"
                            className="inline-flex"
                          >
                            <Info className="size-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Standard shipping fee for this order.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </dt>
                  <dd>{formatPrice(deliveryCost)}</dd>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <dt>Discount</dt>
                    <dd>-{formatPrice(appliedDiscount)}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Total</p>
                  <p className="font-semibold">{formatPrice(total)}</p>
                </div>
              </dl>
            </div>

            <Button
              className="w-full"
              size="lg"
              type="button"
              onClick={() => {
                setOpen(false);
                setPaymentOpen(true);
              }}
            >
              Confirm Checkout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader className="flex flex-row items-center gap-3">
            <Button
              variant="outline"
              size="icon-sm"
              type="button"
              onClick={() => {
                setPaymentOpen(false);
                setOpen(true);
              }}
              aria-label="Go back"
            >
              <ArrowLeft />
            </Button>
            <DialogTitle>Payment Method</DialogTitle>
          </DialogHeader>
          <form className="space-y-6" onSubmit={handlePayNow}>
            <div className="space-y-3">
              <h3 className="font-medium">Saved Payment</h3>
              <RadioGroup
                className="w-full gap-2"
                value={selectedSavedCard}
                onValueChange={setSelectedSavedCard}
              >
                <div className="border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-center gap-3 rounded-md border p-4 shadow-xs outline-none">
                  <img
                    className="size-12 rounded-md border p-1"
                    src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20version%3D%221.1%22%20id%3D%22Layer_1%22%20x%3D%220px%22%20y%3D%220px%22%20viewBox%3D%220%200%20152.4%20108%22%20style%3D%22enable-background%3Anew%200%200%20152.4%20108%3B%22%20xml%3Aspace%3D%22preserve%22%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E.st0%7Bfill%3Anone%3B%7D.st1%7Bfill%3A%23FF5F00%3B%7D.st2%7Bfill%3A%23EB001B%3B%7D.st3%7Bfill%3A%23F79E1B%3B%7D%3C%2Fstyle%3E%3Cg%3E%3Crect%20y%3D%220%22%20class%3D%22st0%22%20width%3D%22152.4%22%20height%3D%22108%22%2F%3E%3Cg%3E%3Crect%20x%3D%2260.4%22%20y%3D%2225.7%22%20class%3D%22st1%22%20width%3D%2231.5%22%20height%3D%2256.6%22%2F%3E%3Cpath%20class%3D%22st2%22%20d%3D%22M62.4%2C54c0-11%2C5.1-21.5%2C13.7-28.3c-15.6-12.3-38.3-9.6-50.6%2C6.1C13.3%2C47.4%2C16%2C70%2C31.7%2C82.3%20%20%20%20c13.1%2C10.3%2C31.4%2C10.3%2C44.5%2C0C67.5%2C75.5%2C62.4%2C65%2C62.4%2C54z%22%2F%3E%3Cpath%20class%3D%22st3%22%20d%3D%22M134.4%2C54c0%2C19.9-16.1%2C36-36%2C36c-8.1%2C0-15.9-2.7-22.2-7.7c15.6-12.3%2C18.3-34.9%2C6-50.6c-1.8-2.2-3.8-4.3-6-6%20%20%20%20c15.6-12.3%2C38.3-9.6%2C50.5%2C6.1C131.7%2C38.1%2C134.4%2C45.9%2C134.4%2C54z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E"
                    alt=""
                  />
                  <div className="grid grow gap-2">
                    <Label
                      htmlFor="saved-card-mastercard"
                      className="justify-between"
                    >
                      Master Card
                    </Label>
                    <p
                      id="saved-card-mastercard-description"
                      className="text-muted-foreground text-xs"
                    >
                      **** **** 1300
                    </p>
                  </div>
                  <RadioGroupItem
                    value="mastercard"
                    id="saved-card-mastercard"
                    aria-describedby="saved-card-mastercard-description"
                    className="size-5 after:absolute after:inset-0 [&_svg]:size-3"
                  />
                </div>

                <div className="border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-center gap-3 rounded-md border p-4 shadow-xs outline-none">
                  <img
                    className="size-12 rounded-md border p-1"
                    src="data:image/svg+xml,%3Csvg%20xmlns%3Ax%3D%22ns_extend%3B%22%20xmlns%3Ai%3D%22ns_ai%3B%22%20xmlns%3Agraph%3D%22ns_graphs%3B%22%20xmlns%3Acc%3D%22http%3A%2F%2Fcreativecommons.org%2Fns%23%22%20xmlns%3Adc%3D%22http%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%22%20xmlns%3Ainkscape%3D%22http%3A%2F%2Fwww.inkscape.org%2Fnamespaces%2Finkscape%22%20xmlns%3Ardf%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%22%20xmlns%3Asodipodi%3D%22http%3A%2F%2Fsodipodi.sourceforge.net%2FDTD%2Fsodipodi-0.dtd%22%20xmlns%3Asvg%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20version%3D%221.1%22%20id%3D%22Layer_1%22%20inkscape%3Aversion%3D%221.0.2%20(e86c870879%2C%202021-01-15)%22%20x%3D%220px%22%20y%3D%220px%22%20viewBox%3D%220%200%20262.3%2085%22%20style%3D%22enable-background%3Anew%200%200%20262.3%2085%3B%22%20xml%3Aspace%3D%22preserve%22%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%20%20.st0%7Bfill%3A%231434CB%3B%7D%20%3C%2Fstyle%3E%3Cmetadata%20id%3D%22metadata3739%22%3E%3Crdf%3ARDF%3E%3Ccc%3AWork%20rdf%3Aabout%3D%22%22%3E%3Cdc%3Aformat%3E%20%20%20%20%20image%2Fsvg%2Bxml%20%20%20%20%3C%2Fdc%3Aformat%3E%3Cdc%3Atype%20rdf%3Aresource%3D%22http%3A%2F%2Fpurl.org%2Fdc%2Fdcmitype%2FStillImage%22%3E%3C%2Fdc%3Atype%3E%3Cdc%3Atitle%3E%3C%2Fdc%3Atitle%3E%3C%2Fcc%3AWork%3E%3C%2Frdf%3ARDF%3E%3Csfw%20xmlns%3D%22ns_sfw%3B%22%3E%3Cslices%3E%3C%2Fslices%3E%3CsliceSourceBounds%20bottomLeftOrigin%3D%22true%22%20height%3D%2285%22%20width%3D%22262.3%22%20x%3D%22737.2%22%20y%3D%220.5%22%3E%3C%2FsliceSourceBounds%3E%3C%2Fsfw%3E%3C%2Fmetadata%3E%3Csodipodi%3Anamedview%20bordercolor%3D%22%23666666%22%20borderopacity%3D%221%22%20fit-margin-bottom%3D%220.5%22%20fit-margin-left%3D%220.5%22%20fit-margin-right%3D%220.5%22%20fit-margin-top%3D%220.5%22%20gridtolerance%3D%2210%22%20guidetolerance%3D%2210%22%20id%3D%22namedview3735%22%20inkscape%3Acurrent-layer%3D%22Layer_1%22%20inkscape%3Acx%3D%22473.80866%22%20inkscape%3Acy%3D%22-26.853447%22%20inkscape%3Adocument-rotation%3D%220%22%20inkscape%3Apageopacity%3D%220%22%20inkscape%3Apageshadow%3D%222%22%20inkscape%3Awindow-height%3D%22705%22%20inkscape%3Awindow-maximized%3D%221%22%20inkscape%3Awindow-width%3D%221366%22%20inkscape%3Awindow-x%3D%22-8%22%20inkscape%3Awindow-y%3D%22-8%22%20inkscape%3Azoom%3D%220.49497088%22%20objecttolerance%3D%2210%22%20pagecolor%3D%22%23ffffff%22%20showgrid%3D%22false%22%3E%3Cinkscape%3Agrid%20empspacing%3D%225%22%20enabled%3D%22true%22%20id%3D%22grid3787%22%20snapvisiblegridlinesonly%3D%22true%22%20type%3D%22xygrid%22%20visible%3D%22true%22%3E%3C%2Finkscape%3Agrid%3E%3C%2Fsodipodi%3Anamedview%3E%3Cpath%20id%3D%22path3789%22%20inkscape%3Aconnector-curvature%3D%220%22%20class%3D%22st0%22%20d%3D%22M170.9%2C0c-18.6%2C0-35.3%2C9.7-35.3%2C27.5%20%20c0%2C20.5%2C29.5%2C21.9%2C29.5%2C32.1c0%2C4.3-5%2C8.2-13.4%2C8.2c-12%2C0-21-5.4-21-5.4l-3.8%2C18c0%2C0%2C10.3%2C4.6%2C24.1%2C4.6c20.4%2C0%2C36.4-10.1%2C36.4-28.3%20%20c0-21.6-29.6-23-29.6-32.5c0-3.4%2C4.1-7.1%2C12.5-7.1c9.5%2C0%2C17.3%2C3.9%2C17.3%2C3.9l3.8-17.4C191.3%2C3.6%2C182.8%2C0%2C170.9%2C0L170.9%2C0z%20M0.5%2C1.3%20%20L0%2C3.9c0%2C0%2C7.8%2C1.4%2C14.9%2C4.3c9.1%2C3.3%2C9.7%2C5.2%2C11.3%2C11.1l16.7%2C64.3h22.4L99.6%2C1.3H77.3l-22.1%2C56l-9-47.5c-0.8-5.4-5-8.5-10.2-8.5%20%20C36%2C1.3%2C0.5%2C1.3%2C0.5%2C1.3z%20M108.6%2C1.3L91.1%2C83.6h21.3l17.4-82.3L108.6%2C1.3L108.6%2C1.3z%20M227.2%2C1.3c-5.1%2C0-7.8%2C2.7-9.8%2C7.5l-31.2%2C74.8%20%20h22.3l4.3-12.5H240l2.6%2C12.5h19.7L245.2%2C1.3L227.2%2C1.3L227.2%2C1.3z%20M230.1%2C23.6l6.6%2C30.9H219L230.1%2C23.6L230.1%2C23.6z%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E"
                    alt=""
                  />
                  <div className="grid grow gap-2">
                    <Label
                      htmlFor="saved-card-visa"
                      className="justify-between"
                    >
                      Visa
                    </Label>
                    <p
                      id="saved-card-visa-description"
                      className="text-muted-foreground text-xs"
                    >
                      **** **** 2223
                    </p>
                  </div>
                  <RadioGroupItem
                    value="visa"
                    id="saved-card-visa"
                    aria-describedby="saved-card-visa-description"
                    className="size-5 after:absolute after:inset-0 [&_svg]:size-3"
                  />
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-xs">
                or add payment details
              </span>
              <Separator className="flex-1" />
            </div>

            <div className="space-y-4">
              <Input
                placeholder="0000 0000 0000 0000"
                inputMode="numeric"
                maxLength={19}
                value={cardNumber}
                aria-invalid={Boolean(paymentErrors.cardNumber)}
                onChange={(event) => {
                  setCardNumber(formatCardNumber(event.target.value));
                  if (paymentErrors.cardNumber) {
                    setPaymentErrors((prev) => ({
                      ...prev,
                      cardNumber: undefined,
                    }));
                  }
                }}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Input
                    placeholder="00/00"
                    inputMode="numeric"
                    maxLength={5}
                    value={cardExpiry}
                    aria-invalid={Boolean(paymentErrors.cardExpiry)}
                    onChange={(event) => {
                      setCardExpiry(formatExpiry(event.target.value));
                      if (paymentErrors.cardExpiry) {
                        setPaymentErrors((prev) => ({
                          ...prev,
                          cardExpiry: undefined,
                        }));
                      }
                    }}
                    onBlur={() => {
                      setCardExpiry((prev) => normalizeExpiryMonth(prev));
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Input
                    placeholder="000"
                    inputMode="numeric"
                    maxLength={4}
                    value={cardCvc}
                    aria-invalid={Boolean(paymentErrors.cardCvc)}
                    onChange={(event) => {
                      setCardCvc(
                        event.target.value.replace(/\D/g, "").slice(0, 3),
                      );
                      if (paymentErrors.cardCvc) {
                        setPaymentErrors((prev) => ({
                          ...prev,
                          cardCvc: undefined,
                        }));
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <Button className="w-full" size="lg" type="submit">
              Pay Now
            </Button>

            <p className="text-muted-foreground flex items-center justify-center gap-1 text-xs">
              <Shield className="size-4 text-emerald-500" />
              Protected with Secure Payment by Payme.
              <a href="#" type="button" className="text-foreground underline">
                Learn More
              </a>
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
