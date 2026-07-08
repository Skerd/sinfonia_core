"use client";

import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useMemo, useState } from "react";
import { create } from "zustand";
import { z } from "zod";
import { useMaskInput } from "use-mask-input";
import { Store, Truck } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import { Checkbox } from "@coreModule/components/uiKit/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@coreModule/components/uiKit/ui/form";
import { Input } from "@coreModule/components/uiKit/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@coreModule/components/uiKit/ui/select";
import { Separator } from "@coreModule/components/uiKit/ui/separator";
import { RadioGroup, RadioGroupItem } from "@coreModule/components/uiKit/ui/radio-group";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@coreModule/components/uiKit/ui/input-group";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@coreModule/components/uiKit/ui/stepper";

const checkoutItems = [
  {
    id: 1,
    name: "The boy’s Soft Cloud Couture",
    variant: {
      color: "Black",
      size: "Man • 40.5",
    },
    imageSrc: "/images/products/01.jpeg",
    imageAlt: "A yellow kids jacket on a hanger.",
    price: 56,
    quantity: 1,
  },
  {
    id: 2,
    name: "The boy’s Soft Cloud Couture",
    variant: {
      color: "Black",
      size: "Man • 40.5",
    },
    imageSrc: "/images/products/02.jpeg",
    imageAlt: "A patterned kids jacket on a hanger.",
    price: 56,
    quantity: 1,
  },
  {
    id: 3,
    name: "The boy’s Soft Cloud Couture",
    variant: {
      color: "Black",
      size: "Man • 40.5",
    },
    imageSrc: "/images/products/03.jpeg",
    imageAlt: "A green plush toy.",
    price: 56,
    quantity: 1,
  },
];

type CartItem = (typeof checkoutItems)[number];
type CheckoutStep = "cart" | "information" | "shipping" | "payment";

type CheckoutState = {
  step: CheckoutStep;
  items: CartItem[];
  setStep: (step: CheckoutStep) => void;
  updateQuantity: (id: number, quantity: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
};

const useCheckoutPage4Store = create<CheckoutState>((set) => ({
  step: "information",
  items: checkoutItems,
  setStep: (step) => set({ step }),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item,
      ),
    })),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  clearCart: () => set({ items: [] }),
}));

const checkoutSchema = z
  .object({
    deliveryMethod: z.enum(["delivery", "pickup"]),
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Enter a valid email"),
    phoneCode: z.string().min(1, "Select phone code"),
    phoneNumber: z.string().min(7, "Enter a valid phone number"),
    country: z.enum(["bd", "us", "tr", "de"]),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z
      .string()
      .min(3, "Zip code is required")
      .max(10, "Zip is too long"),
    addressLine1: z.string().min(1, "Address is required"),
    addressLine2: z.string().optional(),
    shippingMethod: z.enum(["standard", "express"]),
    discountCode: z.string().optional(),
    paymentMethod: z.enum(["card", "paypal"]),
    cardName: z.string(),
    cardNumber: z.string().optional(),
    cardExpiry: z.string().optional(),
    cardCvc: z.string().optional(),
    acceptedTerms: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (!values.acceptedTerms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "You must accept the terms",
        path: ["acceptedTerms"],
      });
    }

    if (values.paymentMethod !== "card") return;

    const name = (values.cardName ?? "").trim();
    if (!name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Name on card is required",
        path: ["cardName"],
      });
    }

    const cardNumber = (values.cardNumber ?? "").replaceAll(" ", "").trim();
    if (cardNumber.length < 12) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid card number",
        path: ["cardNumber"],
      });
    }

    const expiry = (values.cardExpiry ?? "").trim();
    if (!/^\d{2}\s?\/\s?\d{2}$/.test(expiry)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use MM / YY format",
        path: ["cardExpiry"],
      });
    }

    const cvc = (values.cardCvc ?? "").trim();
    if (cvc.length !== 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid CVC",
        path: ["cardCvc"],
      });
    }
  });

type CheckoutValues = z.infer<typeof checkoutSchema>;

const steps: Array<{
  id: Exclude<CheckoutStep, "cart">;
  step: number;
  title: string;
  description: string;
}> = [
  {
    id: "information",
    step: 1,
    title: "Information",
    description: "Contact details",
  },
  {
    id: "shipping",
    step: 2,
    title: "Shipping",
    description: "Delivery options",
  },
  { id: "payment", step: 3, title: "Payment", description: "Pay securely" },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CheckoutPage4() {
  const cardNumberMaskRef = useMaskInput({ mask: "9999 9999 9999 9999" });
  const cardExpiryMaskRef = useMaskInput({ mask: "99/99" });
  const cardCvcMaskRef = useMaskInput({ mask: "999" });

  const step = useCheckoutPage4Store((s) => s.step);
  const setStep = useCheckoutPage4Store((s) => s.setStep);
  const items = useCheckoutPage4Store((s) => s.items);
  const updateQuantity = useCheckoutPage4Store((s) => s.updateQuantity);

  const activeStepNumber = steps.find((s) => s.id === step)?.step ?? 1;

  const handleStepperChange = (nextStepNumber: number) => {
    const next = steps.find((s) => s.step === nextStepNumber)?.id;
    if (next) setStep(next);
  };

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryMethod: "delivery",
      fullName: "",
      email: "",
      phoneCode: "+49",
      phoneNumber: "",
      country: "bd",
      city: "",
      state: "",
      zipCode: "",
      addressLine1: "",
      addressLine2: "",
      shippingMethod: "standard",
      discountCode: "",
      paymentMethod: "card",
      cardName: "",
      cardNumber: "",
      cardExpiry: "",
      cardCvc: "",
      acceptedTerms: false,
    },
    mode: "onSubmit",
  });

  const deliveryMethod = useWatch({
    control: form.control,
    name: "deliveryMethod",
  });
  const shippingMethod = useWatch({
    control: form.control,
    name: "shippingMethod",
  });
  const discountCode = useWatch({
    control: form.control,
    name: "discountCode",
  });

  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const computedShipping = useMemo(() => {
    if (deliveryMethod === "pickup") return 0;
    return shippingMethod === "express" ? 8 : 0;
  }, [deliveryMethod, shippingMethod]);

  const total = Math.max(subtotal + computedShipping - appliedDiscount, 0);

  const handleApplyDiscount = () => {
    const code = (form.getValues("discountCode") ?? "").trim().toUpperCase();
    if (!code) {
      setAppliedDiscount(0);
      return;
    }

    if (code) setAppliedDiscount(10);
    else setAppliedDiscount(0);
  };

  const canComputeShipping = step === "payment" || step === "shipping";

  const validateAndGoNext = async () => {
    const stepFields: Record<
      Exclude<CheckoutStep, "cart">,
      Array<keyof CheckoutValues>
    > = {
      information: [
        "deliveryMethod",
        "fullName",
        "email",
        "phoneCode",
        "phoneNumber",
        "country",
        "city",
        "state",
        "zipCode",
        "addressLine1",
        "addressLine2",
        "acceptedTerms",
      ],
      shipping: ["shippingMethod"],
      payment: [
        "paymentMethod",
        "cardName",
        "cardNumber",
        "cardExpiry",
        "cardCvc",
      ],
    };

    const currentIndex = steps.findIndex((s) => s.id === step);
    if (currentIndex === -1) {
      setStep("information");
      return;
    }

    const fields = stepFields[step as Exclude<CheckoutStep, "cart">];
    const ok =
      fields.length === 0
        ? true
        : await form.trigger(fields, { shouldFocus: true });
    if (!ok) return;

    const next = steps[currentIndex + 1]?.id;
    if (next) {
      setStep(next);
      return;
    }

    // Last step: fake submit.
    onSubmit(form.getValues() as CheckoutValues);
  };

  const onSubmit = (values: CheckoutValues) => {
    console.log("Checkout submitted", {
      ...values,
      appliedDiscount,
      items,
      subtotal,
      shipping: computedShipping,
      total,
    });
  };

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12 lg:py-20">
      <header className="mb-8">
        <Stepper
          defaultValue={2}
          value={activeStepNumber}
          onValueChange={handleStepperChange}
        >
          {steps.map(({ step: stepNumber, title, description }) => (
            <StepperItem
              className="relative not-last:flex-1 max-md:items-start"
              key={stepNumber}
              step={stepNumber}
            >
              <StepperTrigger className="rounded max-md:flex-col">
                <StepperIndicator className="data-[state=completed]:bg-emerald-500 data-[state=completed]:text-white" />
                <StepperTitle>{title}</StepperTitle>
              </StepperTrigger>
              {stepNumber < steps.length && (
                <StepperSeparator className="max-md:mt-3.5 md:mx-4" />
              )}
            </StepperItem>
          ))}
        </Stepper>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_420px] lg:items-start lg:gap-8">
        <main className="min-w-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div
                hidden={step !== "information"}
                aria-hidden={step !== "information"}
                className="space-y-8"
              >
                <section className="space-y-3">
                  <h3 className="text-sm font-medium">Pick Delivery Method</h3>
                  <FormField
                    control={form.control}
                    name="deliveryMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="grid grid-cols-2"
                          >
                            <label className="border-input has-checked:ring-ring text-muted-foreground has-checked:text-primary flex items-center gap-2 rounded-md border p-4 has-checked:ring">
                              <RadioGroupItem
                                value="delivery"
                                className="sr-only"
                              />
                              <Truck className="text-muted-foreground size-4" />
                              <span>Delivery</span>
                            </label>
                            <label className="border-input has-checked:ring-ring text-muted-foreground has-checked:text-primary flex items-center gap-2 rounded-md border p-4 has-checked:ring">
                              <RadioGroupItem
                                value="pickup"
                                className="sr-only"
                              />
                              <Store className="text-muted-foreground size-4" />
                              <span>Pickup</span>
                            </label>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </section>

                <section className="space-y-6">
                  <h3 className="text-sm font-medium">Shipping Information</h3>
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your name" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your email"
                            type="email"
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
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <FormField
                              control={form.control}
                              name="phoneCode"
                              render={({ field: codeField }) => (
                                <FormItem className="w-28 space-y-0">
                                  <FormControl>
                                    <Select
                                      value={codeField.value}
                                      onValueChange={codeField.onChange}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Code" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="+880">
                                          +880
                                        </SelectItem>
                                        <SelectItem value="+1">+1</SelectItem>
                                        <SelectItem value="+49">+49</SelectItem>
                                        <SelectItem value="+44">+44</SelectItem>
                                        <SelectItem value="+33">+33</SelectItem>
                                        <SelectItem value="+34">+34</SelectItem>
                                        <SelectItem value="+39">+39</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <Input
                              placeholder="151 898 9280"
                              type="tel"
                              {...field}
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bd">Bangladesh</SelectItem>
                                <SelectItem value="us">
                                  United States
                                </SelectItem>
                                <SelectItem value="de">Germany</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="addressLine1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Street address" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Zip code" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apartment, Suit, Flat etc.</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acceptedTerms"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-start gap-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) =>
                                field.onChange(checked === true)
                              }
                              aria-label="Accept terms"
                            />
                          </FormControl>
                          <FormLabel className="leading-snug">
                            I accept the terms and conditions of service.
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </section>
              </div>

              <div
                hidden={step !== "shipping"}
                aria-hidden={step !== "shipping"}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">Shipping</h2>
                  <p className="text-muted-foreground text-sm">
                    Choose a shipping option for your order.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="shippingMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid gap-3"
                        >
                          <label className="border-input has-checked:ring-ring flex items-center justify-between gap-4 rounded-md border p-4 has-checked:ring">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">
                                Standard Shipping
                              </p>
                              <p className="text-muted-foreground text-xs">
                                3–7 business days
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold">
                                {deliveryMethod === "pickup"
                                  ? formatMoney(0)
                                  : formatMoney(0)}
                              </span>
                              <RadioGroupItem
                                value="standard"
                                className="sr-only"
                              />
                            </div>
                          </label>
                          <label className="border-input has-checked:ring-ring flex items-center justify-between gap-4 rounded-md border p-4 has-checked:ring">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">
                                Express Shipping
                              </p>
                              <p className="text-muted-foreground text-xs">
                                1–2 business days
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold">
                                {deliveryMethod === "pickup"
                                  ? formatMoney(0)
                                  : formatMoney(8)}
                              </span>
                              <RadioGroupItem
                                value="express"
                                className="sr-only"
                              />
                            </div>
                          </label>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div
                hidden={step !== "payment"}
                aria-hidden={step !== "payment"}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">Payment</h2>
                  <p className="text-muted-foreground text-xs">
                    Complete your purchase by providing payment details.
                  </p>
                </div>

                <section className="space-y-4">
                  <h2 className="text-lg font-semibold">Express Checkout</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <Button type="button" size="lg" variant="outline">
                      <GooglePayLogo />
                      Google Pay
                    </Button>
                    <Button type="button" size="lg" variant="outline">
                      <PaypalLogo />
                      PayPal
                    </Button>
                  </div>
                </section>

                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-muted-foreground text-xs tracking-widest uppercase">
                    or
                  </span>
                  <Separator className="flex-1" />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="cardName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name on card</FormLabel>
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
                      <FormItem>
                        <FormLabel>Card number</FormLabel>
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
                                  <span className="text-muted-foreground px-3 text-xs font-medium">
                                    VISA
                                  </span>
                                </InputGroupAddon>
                              </InputGroup>
                            );
                          })()}
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="cardExpiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry</FormLabel>
                          <FormControl>
                            {(() => {
                              const { ref, ...restField } = field;
                              return (
                                <Input
                                  placeholder="MM/YY"
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
                          <FormLabel>CVC</FormLabel>
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
                </div>
              </div>
            </form>
          </Form>
        </main>

        <Card className="shadow-none">
          <CardContent className="space-y-6">
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-4">
                  <div className="relative size-16 overflow-hidden rounded-md">
                    <Image
                      src={item.imageSrc}
                      alt={item.imageAlt}
                      width={50}
                      height={50}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex justify-between">
                      <p className="truncate text-sm font-semibold">
                        {item.name}
                      </p>

                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatMoney(item.price)}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="min-w-0">
                        <p className="text-muted-foreground text-xs">
                          Color {item.variant.color}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Size {item.variant.size}
                        </p>
                      </div>
                      <InputGroup className="max-w-28" aria-label="Quantity">
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
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Coupon code"
                value={discountCode ?? ""}
                onChange={(event) =>
                  form.setValue("discountCode", event.target.value)
                }
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleApplyDiscount}
              >
                Apply
              </Button>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">{formatMoney(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="font-medium">
                  {canComputeShipping ? (
                    formatMoney(computedShipping)
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      Calculated at next step
                    </span>
                  )}
                </dd>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Discount</dt>
                  <dd className="font-medium">
                    -{formatMoney(appliedDiscount)}
                  </dd>
                </div>
              )}
            </dl>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-base font-semibold">
                {formatMoney(total)}
              </span>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              onClick={validateAndGoNext}
            >
              {step === "payment"
                ? "Complete Payment"
                : step === "shipping"
                  ? "Continue to Payment"
                  : "Continue to Shipping"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

const GooglePayLogo = () => {
  return (
    <img
      className="size-5"
      src="data:image/svg+xml,%3Csvg%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Asvg%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20viewBox%3D%220%200%20268.1522%20273.8827%22%20overflow%3D%22hidden%22%20xml%3Aspace%3D%22preserve%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22a%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%230fbc5c%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%230cba65%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22g%22%3E%3Cstop%20offset%3D%22.2312727%22%20stop-color%3D%22%230fbc5f%22%2F%3E%3Cstop%20offset%3D%22.3115468%22%20stop-color%3D%22%230fbc5f%22%2F%3E%3Cstop%20offset%3D%22.3660131%22%20stop-color%3D%22%230fbc5e%22%2F%3E%3Cstop%20offset%3D%22.4575163%22%20stop-color%3D%22%230fbc5d%22%2F%3E%3Cstop%20offset%3D%22.540305%22%20stop-color%3D%22%2312bc58%22%2F%3E%3Cstop%20offset%3D%22.6993464%22%20stop-color%3D%22%2328bf3c%22%2F%3E%3Cstop%20offset%3D%22.7712418%22%20stop-color%3D%22%2338c02b%22%2F%3E%3Cstop%20offset%3D%22.8605665%22%20stop-color%3D%22%2352c218%22%2F%3E%3Cstop%20offset%3D%22.9150327%22%20stop-color%3D%22%2367c30f%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2386c504%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22h%22%3E%3Cstop%20offset%3D%22.1416122%22%20stop-color%3D%22%231abd4d%22%2F%3E%3Cstop%20offset%3D%22.2475151%22%20stop-color%3D%22%236ec30d%22%2F%3E%3Cstop%20offset%3D%22.3115468%22%20stop-color%3D%22%238ac502%22%2F%3E%3Cstop%20offset%3D%22.3660131%22%20stop-color%3D%22%23a2c600%22%2F%3E%3Cstop%20offset%3D%22.4456735%22%20stop-color%3D%22%23c8c903%22%2F%3E%3Cstop%20offset%3D%22.540305%22%20stop-color%3D%22%23ebcb03%22%2F%3E%3Cstop%20offset%3D%22.6156363%22%20stop-color%3D%22%23f7cd07%22%2F%3E%3Cstop%20offset%3D%22.6993454%22%20stop-color%3D%22%23fdcd04%22%2F%3E%3Cstop%20offset%3D%22.7712418%22%20stop-color%3D%22%23fdce05%22%2F%3E%3Cstop%20offset%3D%22.8605661%22%20stop-color%3D%22%23ffce0a%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22f%22%3E%3Cstop%20offset%3D%22.3159041%22%20stop-color%3D%22%23ff4c3c%22%2F%3E%3Cstop%20offset%3D%22.6038179%22%20stop-color%3D%22%23ff692c%22%2F%3E%3Cstop%20offset%3D%22.7268366%22%20stop-color%3D%22%23ff7825%22%2F%3E%3Cstop%20offset%3D%22.884534%22%20stop-color%3D%22%23ff8d1b%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23ff9f13%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22b%22%3E%3Cstop%20offset%3D%22.2312727%22%20stop-color%3D%22%23ff4541%22%2F%3E%3Cstop%20offset%3D%22.3115468%22%20stop-color%3D%22%23ff4540%22%2F%3E%3Cstop%20offset%3D%22.4575163%22%20stop-color%3D%22%23ff4640%22%2F%3E%3Cstop%20offset%3D%22.540305%22%20stop-color%3D%22%23ff473f%22%2F%3E%3Cstop%20offset%3D%22.6993464%22%20stop-color%3D%22%23ff5138%22%2F%3E%3Cstop%20offset%3D%22.7712418%22%20stop-color%3D%22%23ff5b33%22%2F%3E%3Cstop%20offset%3D%22.8605665%22%20stop-color%3D%22%23ff6c29%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23ff8c18%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22d%22%3E%3Cstop%20offset%3D%22.4084578%22%20stop-color%3D%22%23fb4e5a%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23ff4540%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22c%22%3E%3Cstop%20offset%3D%22.1315461%22%20stop-color%3D%22%230cba65%22%2F%3E%3Cstop%20offset%3D%22.2097843%22%20stop-color%3D%22%230bb86d%22%2F%3E%3Cstop%20offset%3D%22.2972969%22%20stop-color%3D%22%2309b479%22%2F%3E%3Cstop%20offset%3D%22.3962575%22%20stop-color%3D%22%2308ad93%22%2F%3E%3Cstop%20offset%3D%22.4771242%22%20stop-color%3D%22%230aa6a9%22%2F%3E%3Cstop%20offset%3D%22.5684245%22%20stop-color%3D%22%230d9cc6%22%2F%3E%3Cstop%20offset%3D%22.667385%22%20stop-color%3D%22%231893dd%22%2F%3E%3Cstop%20offset%3D%22.7687273%22%20stop-color%3D%22%23258bf1%22%2F%3E%3Cstop%20offset%3D%22.8585063%22%20stop-color%3D%22%233086ff%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22e%22%3E%3Cstop%20offset%3D%22.3660131%22%20stop-color%3D%22%23ff4e3a%22%2F%3E%3Cstop%20offset%3D%22.4575163%22%20stop-color%3D%22%23ff8a1b%22%2F%3E%3Cstop%20offset%3D%22.540305%22%20stop-color%3D%22%23ffa312%22%2F%3E%3Cstop%20offset%3D%22.6156363%22%20stop-color%3D%22%23ffb60c%22%2F%3E%3Cstop%20offset%3D%22.7712418%22%20stop-color%3D%22%23ffcd0a%22%2F%3E%3Cstop%20offset%3D%22.8605665%22%20stop-color%3D%22%23fecf0a%22%2F%3E%3Cstop%20offset%3D%22.9150327%22%20stop-color%3D%22%23fecf08%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23fdcd01%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20xlink%3Ahref%3D%22%23a%22%20id%3D%22s%22%20x1%3D%22219.6997%22%20y1%3D%22329.5351%22%20x2%3D%22254.4673%22%20y2%3D%22329.5351%22%20gradientUnits%3D%22userSpaceOnUse%22%2F%3E%3CradialGradient%20xlink%3Ahref%3D%22%23b%22%20id%3D%22m%22%20gradientUnits%3D%22userSpaceOnUse%22%20gradientTransform%3D%22matrix(-1.936885%2C1.043001%2C1.455731%2C2.555422%2C290.5254%2C-400.6338)%22%20cx%3D%22109.6267%22%20cy%3D%22135.8619%22%20fx%3D%22109.6267%22%20fy%3D%22135.8619%22%20r%3D%2271.46001%22%2F%3E%3CradialGradient%20xlink%3Ahref%3D%22%23c%22%20id%3D%22n%22%20gradientUnits%3D%22userSpaceOnUse%22%20gradientTransform%3D%22matrix(-3.512595%2C-4.45809%2C-1.692547%2C1.260616%2C870.8006%2C191.554)%22%20cx%3D%2245.25866%22%20cy%3D%22279.2738%22%20fx%3D%2245.25866%22%20fy%3D%22279.2738%22%20r%3D%2271.46001%22%2F%3E%3CradialGradient%20xlink%3Ahref%3D%22%23d%22%20id%3D%22l%22%20cx%3D%22304.0166%22%20cy%3D%22118.0089%22%20fx%3D%22304.0166%22%20fy%3D%22118.0089%22%20r%3D%2247.85445%22%20gradientTransform%3D%22matrix(2.064353%2C-4.926832e-6%2C-2.901531e-6%2C2.592041%2C-297.6788%2C-151.7469)%22%20gradientUnits%3D%22userSpaceOnUse%22%2F%3E%3CradialGradient%20xlink%3Ahref%3D%22%23e%22%20id%3D%22o%22%20gradientUnits%3D%22userSpaceOnUse%22%20gradientTransform%3D%22matrix(-0.2485783%2C2.083138%2C2.962486%2C0.3341668%2C-255.1463%2C-331.1636)%22%20cx%3D%22181.001%22%20cy%3D%22177.2013%22%20fx%3D%22181.001%22%20fy%3D%22177.2013%22%20r%3D%2271.46001%22%2F%3E%3CradialGradient%20xlink%3Ahref%3D%22%23f%22%20id%3D%22p%22%20cx%3D%22207.6733%22%20cy%3D%22108.0972%22%20fx%3D%22207.6733%22%20fy%3D%22108.0972%22%20r%3D%2241.1025%22%20gradientTransform%3D%22matrix(-1.249206%2C1.343263%2C-3.896837%2C-3.425693%2C880.5011%2C194.9051)%22%20gradientUnits%3D%22userSpaceOnUse%22%2F%3E%3CradialGradient%20xlink%3Ahref%3D%22%23g%22%20id%3D%22r%22%20gradientUnits%3D%22userSpaceOnUse%22%20gradientTransform%3D%22matrix(-1.936885%2C-1.043001%2C1.455731%2C-2.555422%2C290.5254%2C838.6834)%22%20cx%3D%22109.6267%22%20cy%3D%22135.8619%22%20fx%3D%22109.6267%22%20fy%3D%22135.8619%22%20r%3D%2271.46001%22%2F%3E%3CradialGradient%20xlink%3Ahref%3D%22%23h%22%20id%3D%22j%22%20gradientUnits%3D%22userSpaceOnUse%22%20gradientTransform%3D%22matrix(-0.081402%2C-1.93722%2C2.926737%2C-0.1162508%2C-215.1345%2C632.8606)%22%20cx%3D%22154.8697%22%20cy%3D%22145.9691%22%20fx%3D%22154.8697%22%20fy%3D%22145.9691%22%20r%3D%2271.46001%22%2F%3E%3Cfilter%20id%3D%22q%22%20x%3D%22-.04842873%22%20y%3D%22-.0582241%22%20width%3D%221.096857%22%20height%3D%221.116448%22%20color-interpolation-filters%3D%22sRGB%22%3E%3CfeGaussianBlur%20stdDeviation%3D%221.700914%22%2F%3E%3C%2Ffilter%3E%3Cfilter%20id%3D%22k%22%20x%3D%22-.01670084%22%20y%3D%22-.01009856%22%20width%3D%221.033402%22%20height%3D%221.020197%22%20color-interpolation-filters%3D%22sRGB%22%3E%3CfeGaussianBlur%20stdDeviation%3D%22.2419367%22%2F%3E%3C%2Ffilter%3E%3CclipPath%20clipPathUnits%3D%22userSpaceOnUse%22%20id%3D%22i%22%3E%3Cpath%20d%3D%22M371.3784%20193.2406H237.0825v53.4375h77.167c-1.2405%207.5627-4.0259%2015.0024-8.1049%2021.7862-4.6734%207.7723-10.4511%2013.6895-16.373%2018.1957-17.7389%2013.4983-38.42%2016.2584-52.7828%2016.2584-36.2824%200-67.2833-23.2865-79.2844-54.9287-.4843-1.1482-.8059-2.3344-1.1975-3.5068-2.652-8.0533-4.101-16.5825-4.101-25.4474%200-9.226%201.5691-18.0575%204.4301-26.3985%2011.2851-32.8967%2042.9849-57.4674%2080.1789-57.4674%207.4811%200%2014.6854.8843%2021.5173%202.6481%2015.6135%204.0309%2026.6578%2011.9698%2033.4252%2018.2494l40.834-39.7111c-24.839-22.616-57.2194-36.3201-95.8444-36.3201-30.8782-.00066-59.3863%209.55308-82.7477%2025.6992-18.9454%2013.0941-34.4833%2030.6254-44.9695%2050.9861-9.75366%2018.8785-15.09441%2039.7994-15.09441%2062.2934%200%2022.495%205.34891%2043.6334%2015.10261%2062.3374v.126c10.3023%2019.8567%2025.3678%2036.9537%2043.6783%2049.9878%2015.9962%2011.3866%2044.6789%2026.5516%2084.0307%2026.5516%2022.6301%200%2042.6867-4.0517%2060.3748-11.6447%2012.76-5.4775%2024.0655-12.6217%2034.3012-21.8036%2013.5247-12.1323%2024.1168-27.1388%2031.3465-44.4041%207.2297-17.2654%2011.097-36.7895%2011.097-57.957%200-9.858-.9971-19.8694-2.6881-28.9684Z%22%20fill%3D%22%23000%22%2F%3E%3C%2FclipPath%3E%3C%2Fdefs%3E%3Cg%20transform%3D%22matrix(0.957922%2C0%2C0%2C0.985255%2C-90.17436%2C-78.85577)%22%3E%3Cg%20clip-path%3D%22url(%23i)%22%3E%3Cpath%20d%3D%22M92.07563%20219.9585c.14844%2022.14%206.5014%2044.983%2016.11767%2063.4234v.1269c6.9482%2013.3919%2016.4444%2023.9704%2027.2604%2034.4518l65.326-23.67c-12.3593-6.2344-14.2452-10.0546-23.1048-17.0253-9.0537-9.0658-15.8015-19.4735-20.0038-31.677h-.1693l.1693-.1269c-2.7646-8.0587-3.0373-16.6129-3.1393-25.5029Z%22%20fill%3D%22url(%23j)%22%20filter%3D%22url(%23k)%22%2F%3E%3Cpath%20d%3D%22M237.0835%2079.02491c-6.4568%2022.52569-3.988%2044.42139%200%2057.16129%207.4561.0055%2014.6388.8881%2021.4494%202.6464%2015.6135%204.0309%2026.6566%2011.97%2033.424%2018.2496l41.8794-40.7256c-24.8094-22.58904-54.6663-37.2961-96.7528-37.33169Z%22%20fill%3D%22url(%23l)%22%20filter%3D%22url(%23k)%22%2F%3E%3Cpath%20d%3D%22M236.9434%2078.84678c-31.6709-.00068-60.9107%209.79833-84.8718%2026.35902-8.8968%206.149-17.0612%2013.2521-24.3311%2021.1509-1.9045%2017.7429%2014.2569%2039.5507%2046.2615%2039.3702%2015.5284-17.9373%2038.4946-29.5427%2064.0561-29.5427.0233%200%20.046.0019.0693.002l-1.0439-57.33536c-.0472-.00003-.0929-.00406-.1401-.00406Z%22%20fill%3D%22url(%23m)%22%20filter%3D%22url(%23k)%22%2F%3E%3Cpath%20d%3D%22m341.4751%20226.3788-28.2685%2019.2848c-1.2405%207.5627-4.0278%2015.0023-8.1068%2021.7861-4.6734%207.7723-10.4506%2013.6898-16.3725%2018.196-17.7022%2013.4704-38.3286%2016.2439-52.6877%2016.2553-14.8415%2025.1018-17.4435%2037.6749%201.0439%2057.9342%2022.8762-.0167%2043.157-4.1174%2061.0458-11.7965%2012.9312-5.551%2024.3879-12.7913%2034.7609-22.0964%2013.7061-12.295%2024.4421-27.5034%2031.7688-45.0003%207.3267-17.497%2011.2446-37.2822%2011.2446-58.7336Z%22%20fill%3D%22url(%23n)%22%20filter%3D%22url(%23k)%22%2F%3E%3Cpath%20d%3D%22M234.9956%20191.2104v57.4981h136.0062c1.1962-7.8745%205.1523-18.0644%205.1523-26.5001%200-9.858-.9963-21.899-2.6873-30.998Z%22%20fill%3D%22%233086ff%22%20filter%3D%22url(%23k)%22%2F%3E%3Cpath%20d%3D%22M128.3894%20124.3268c-8.393%209.1191-15.5632%2019.326-21.2483%2030.3646-9.75351%2018.8785-15.09402%2041.8295-15.09402%2064.3235%200%20.317.02642.6271.02855.9436%204.31953%208.2244%2059.66647%206.6495%2062.45617%200-.0035-.3103-.0387-.6128-.0387-.9238%200-9.226%201.5696-16.0262%204.4306-24.3672%203.5294-10.2885%209.0557-19.7628%2016.1223-27.9257%201.6019-2.0309%205.8748-6.3969%207.1214-9.0157.4749-.9975-.8621-1.5574-.9369-1.9085-.0836-.3927-1.8762-.0769-2.2778-.3694-1.2751-.9288-3.8001-1.4138-5.3334-1.8449-3.2772-.9215-8.7085-2.9536-11.7252-5.0601-9.5357-6.6586-24.417-14.6122-33.5047-24.2164Z%22%20fill%3D%22url(%23o)%22%20filter%3D%22url(%23k)%22%2F%3E%3Cpath%20d%3D%22M162.0989%20155.8569c22.1123%2013.3013%2028.4714-6.7139%2043.173-12.9771L179.698%2090.21568c-9.4075%203.92642-18.2957%208.80465-26.5426%2014.50442-12.316%208.5122-23.192%2018.8995-32.1763%2030.7204Z%22%20fill%3D%22url(%23p)%22%20filter%3D%22url(%23q)%22%2F%3E%3Cpath%20d%3D%22M171.0987%20290.222c-29.6829%2010.6413-34.3299%2011.023-37.0622%2029.2903%205.2213%205.0597%2010.8312%209.74%2016.7926%2013.9835%2015.9962%2011.3867%2046.766%2026.5517%2086.1178%2026.5517.0462%200%20.0904-.004.1366-.004v-59.1574c-.0298.0001-.064.002-.0938.002-14.7359%200-26.5113-3.8435-38.5848-10.5273-2.9768-1.6479-8.3775%202.7772-11.1229.799-3.7865-2.7284-12.8991%202.3508-16.1833-.9378Z%22%20fill%3D%22url(%23r)%22%20filter%3D%22url(%23k)%22%2F%3E%3Cpath%20d%3D%22M219.6997%20299.0227v59.9959c5.506.6402%2011.2361%201.0289%2017.2472%201.0289%206.0259%200%2011.8556-.3073%2017.5204-.8723v-59.7481c-6.3482%201.0777-12.3272%201.461-17.4776%201.461-5.9318%200-11.7005-.6858-17.29-1.8654Z%22%20opacity%3D%22.5%22%20fill%3D%22url(%23s)%22%20filter%3D%22url(%23k)%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E"
      alt="google pay logo"
    />
  );
};

const PaypalLogo = () => {
  return (
    <img
      className="size-5"
      src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%227.056000232696533%203%2037.35095977783203%2045%22%3E%3Cg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20clip-path%3D%22url(%23a)%22%3E%3Cpath%20fill%3D%22%23002991%22%20d%3D%22M38.914%2013.35c0%205.574-5.144%2012.15-12.927%2012.15H18.49l-.368%202.322L16.373%2039H7.056l5.605-36h15.095c5.083%200%209.082%202.833%2010.555%206.77a9.687%209.687%200%200%201%20.603%203.58z%22%2F%3E%3Cpath%20fill%3D%22%2360CDFF%22%20d%3D%22M44.284%2023.7A12.894%2012.894%200%200%201%2031.53%2034.5h-5.206L24.157%2048H14.89l1.483-9%201.75-11.178.367-2.322h7.497c7.773%200%2012.927-6.576%2012.927-12.15%203.825%201.974%206.055%205.963%205.37%2010.35z%22%2F%3E%3Cpath%20fill%3D%22%23008CFF%22%20d%3D%22M38.914%2013.35C37.31%2012.511%2035.365%2012%2033.248%2012h-12.64L18.49%2025.5h7.497c7.773%200%2012.927-6.576%2012.927-12.15z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E"
      alt="paypal logo"
    />
  );
};
