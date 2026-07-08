"use client";

import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { create } from "zustand";
import { useMaskInput } from "use-mask-input";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Input } from "@coreModule/components/uiKit/ui/input";
import { RadioGroup, RadioGroupItem } from "@coreModule/components/uiKit/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@coreModule/components/uiKit/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@coreModule/components/uiKit/ui/form";

import { Card, CardContent, CardHeader, CardTitle } from "@coreModule/components/uiKit/ui/card";
import { Label } from "@coreModule/components/uiKit/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@coreModule/components/uiKit/ui/input-group";

const cartItems: Array<{
  id: number;
  name: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  price: number;
  quantity: number;
}> = [
  {
    id: 1,
    name: "Men Top Black Puffed Jacket",
    description: "Men's Black",
    imageSrc: "/images/products/01.jpeg",
    imageAlt: "Black puffed jacket.",
    price: 999,
    quantity: 1,
  },
  {
    id: 2,
    name: "Women Jacket",
    description: "Women top",
    imageSrc: "/images/products/02.jpeg",
    imageAlt: "Women beige jacket.",
    price: 1200,
    quantity: 1,
  },
];

type CartItem = (typeof cartItems)[number];

type CheckoutState = {
  items: CartItem[];
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
};

export const useCheckoutStore = create<CheckoutState>((set) => ({
  items: cartItems,
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item,
      ),
    })),
}));

const checkoutSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Enter a valid email"),
    phoneCode: z.string().min(1, "Select country code"),
    phoneNumber: z.string().min(5, "Enter a valid phone number"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zip: z
      .string()
      .min(3, "Zip code is required")
      .max(10, "Zip code is too long"),
    shippingMethod: z.enum(["free", "express"]),
    cardName: z.string(),
    cardNumber: z.string(),
    cardExpiry: z.string(),
    cardCvc: z.string(),
    discountCode: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.cardName.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Name on card is required",
        path: ["cardName"],
      });
    }

    const cardNumber = values.cardNumber.replaceAll(" ", "").trim();
    if (cardNumber.length < 12) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid card number",
        path: ["cardNumber"],
      });
    }

    const expiry = values.cardExpiry.trim();
    if (!/^\d{2}\s?\/\s?\d{2}$/.test(expiry)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use MM / YY format",
        path: ["cardExpiry"],
      });
    }

    const cvc = values.cardCvc.trim();
    if (cvc.length !== 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid CVC",
        path: ["cardCvc"],
      });
    }
  });

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage1() {
  const cardNumberMaskRef = useMaskInput({ mask: "9999 9999 9999 9999" });
  const cardExpiryMaskRef = useMaskInput({ mask: "99 / 99" });
  const cardCvcMaskRef = useMaskInput({ mask: "999" });

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneCode: "ind",
      phoneNumber: "",
      city: "",
      state: "",
      zip: "",
      shippingMethod: "free",
      cardName: "",
      cardNumber: "",
      cardExpiry: "",
      cardCvc: "",
      discountCode: "",
    },
  });

  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const items = useCheckoutStore((state) => state.items);
  const removeItem = useCheckoutStore((state) => state.removeItem);
  const updateQuantity = useCheckoutStore((state) => state.updateQuantity);

  const shippingMethod = useWatch({
    control: form.control,
    name: "shippingMethod",
  });

  const discountCode = useWatch({
    control: form.control,
    name: "discountCode",
  });

  const onSubmit = (values: CheckoutFormValues) => {
    console.log("Checkout form submitted", {
      ...values,
      appliedDiscount,
    });
  };

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const shipping = shippingMethod === "express" ? 9 : 0;
  const taxes = Number((subtotal * 0.02).toFixed(2));
  const total = Math.max(subtotal - appliedDiscount + shipping + taxes, 0);

  const handleApplyDiscount = () => {
    const rawCode = form.getValues("discountCode") ?? "";
    const code = rawCode.trim().toUpperCase();

    if (!code) {
      setAppliedDiscount(0);
      return;
    }

    if (code) {
      setAppliedDiscount(10);
    } else {
      setAppliedDiscount(0);
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 lg:py-20">
      <div className="flex flex-col items-start gap-8 md:flex-row lg:gap-10">
        <Form {...form}>
          <form
            className="flex-1 space-y-8"
            aria-label="Shipping address"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <section className="space-y-6">
              <h2 className="text-lg font-medium">Shipping Address</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="gap-1">
                        First Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Divyansh" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="gap-1">
                        Last Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Agarwal" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="gap-1">
                        Email <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="divyansh@webyansh.com"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="gap-1">
                        Phone number <span className="text-destructive">*</span>
                      </FormLabel>
                      <div className="flex gap-4">
                        <FormField
                          control={form.control}
                          name="phoneCode"
                          render={({ field: codeField }) => (
                            <FormItem className="w-28">
                              <FormControl>
                                <Select
                                  onValueChange={codeField.onChange}
                                  defaultValue={codeField.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Code" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ind">IND</SelectItem>
                                    <SelectItem value="usa">USA</SelectItem>
                                    <SelectItem value="eu">EU</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="6377588843"
                            {...field}
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="gap-1">
                        City <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Bangalore" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="gap-1">
                        State <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Karnataka" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="gap-1">
                        Zip Code <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="560021" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <FormField
              control={form.control}
              name="shippingMethod"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <fieldset className="space-y-4">
                      <legend className="text-foreground text-sm leading-none font-medium">
                        Shipping method
                      </legend>
                      <RadioGroup
                        className="grid w-full grid-cols-2 gap-2"
                        onValueChange={field.onChange}
                        value={field.value}
                        aria-label="Shipping method"
                      >
                        {[
                          {
                            value: "free",
                            label: "Free Shipping",
                            description: "7-20 Days",
                            price: "$0",
                          },
                          {
                            value: "express",
                            label: "Express Shipping",
                            description: "1-3 Days",
                            price: "$9",
                          },
                        ].map((item) => (
                          <div
                            className="border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none"
                            key={item.value}
                          >
                            <RadioGroupItem
                              id={`shipping-${item.value}`}
                              value={item.value}
                              aria-describedby={`shipping-${item.value}-description`}
                              className="after:absolute after:inset-0"
                            />
                            <div className="grid grow gap-2">
                              <Label
                                htmlFor={`shipping-${item.value}`}
                                className="justify-between"
                              >
                                {item.label}
                                <span className="text-muted-foreground text-xs leading-[inherit] font-normal">
                                  {item.price}
                                </span>
                              </Label>
                              <p
                                id={`shipping-${item.value}-description`}
                                className="text-muted-foreground text-xs"
                              >
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </fieldset>
                  </FormControl>
                </FormItem>
              )}
            />

            <section className="space-y-6">
              <h2 className="text-lg font-medium">Payment Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="cardName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="gap-1">
                        Name on card <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="gap-1">
                        Card number <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        {(() => {
                          const { ref, ...restField } = field;
                          return (
                            <InputGroup>
                              <InputGroupInput
                                placeholder="1234 5678 9012 3456"
                                inputMode="numeric"
                                ref={(element) => {
                                  (
                                    cardNumberMaskRef as unknown as React.MutableRefObject<HTMLInputElement | null>
                                  ).current = element;
                                  ref(element);
                                }}
                                {...restField}
                              />
                              <InputGroupAddon align="inline-end">
                                <InputGroupText className="text-[11px] font-semibold">
                                  VISA
                                </InputGroupText>
                              </InputGroupAddon>
                            </InputGroup>
                          );
                        })()}
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cardExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="gap-1">
                        Expiry <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        {(() => {
                          const { ref, ...restField } = field;
                          return (
                            <Input
                              placeholder="MM / YY"
                              inputMode="numeric"
                              ref={(element) => {
                                (
                                  cardExpiryMaskRef as unknown as React.MutableRefObject<HTMLInputElement | null>
                                ).current = element;
                                ref(element);
                              }}
                              {...restField}
                            />
                          );
                        })()}
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cardCvc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="gap-1">
                        CVC <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        {(() => {
                          const { ref, ...restField } = field;
                          return (
                            <Input
                              placeholder="123"
                              inputMode="numeric"
                              ref={(element) => {
                                (
                                  cardCvcMaskRef as unknown as React.MutableRefObject<HTMLInputElement | null>
                                ).current = element;
                                ref(element);
                              }}
                              {...restField}
                            />
                          );
                        })()}
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <Button className="hidden" type="submit" aria-hidden="true">
              Hidden
            </Button>
          </form>
        </Form>

        <Card className="bg-muted/50 shadow-none">
          <CardHeader>
            <CardTitle>Your Cart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4"
                >
                  <div className="relative size-14">
                    <Image
                      src={item.imageSrc}
                      alt={item.imageAlt}
                      width={64}
                      height={64}
                      className="h-full w-full rounded-lg object-cover"
                      unoptimized
                    />
                    <div className="ring-muted absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-black text-[11px] font-medium text-white ring-2">
                      {item.quantity}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm leading-snug font-medium">
                      {item.name}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {item.description}
                    </p>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-destructive hover:text-destructive/80 p-0 hover:underline"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-sm font-medium">
                      ${item.price.toLocaleString()}
                    </p>
                    <InputGroup className="max-w-24" aria-label="Quantity">
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
                        aria-label="Item quantity"
                        className="text-center tabular-nums"
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
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2">
              <Input
                placeholder="Discount code"
                disabled={appliedDiscount > 0}
                value={discountCode ?? ""}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  form.setValue("discountCode", nextValue);
                  if (!nextValue.trim()) {
                    setAppliedDiscount(0);
                  }
                }}
              />

              {appliedDiscount > 0 ? (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    form.setValue("discountCode", "");
                    setAppliedDiscount(0);
                  }}
                >
                  Remove
                </Button>
              ) : (
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleApplyDiscount}
                >
                  Apply
                </Button>
              )}
            </div>

            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">${subtotal.toLocaleString()}</dd>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex items-center justify-between text-emerald-600">
                  <dt>Discount</dt>
                  <dd className="font-medium">
                    -${appliedDiscount.toFixed(2)}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="font-medium">${shipping}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Estimated taxes</dt>
                <dd className="font-medium">${taxes.toFixed(2)}</dd>
              </div>
            </dl>

            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="font-semibold">Total</span>
              <span className="text-base font-semibold">
                ${total.toLocaleString()}
              </span>
            </div>

            <Button
              className="mt-10 w-full"
              size="lg"
              type="button"
              onClick={form.handleSubmit(onSubmit)}
            >
              Continue to Payment
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
