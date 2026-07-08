"use client";

import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useMaskInput } from "use-mask-input";

import { ArrowLeft } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@coreModule/components/uiKit/ui/card";
import { Input } from "@coreModule/components/uiKit/ui/input";
import { RadioGroup, RadioGroupItem } from "@coreModule/components/uiKit/ui/radio-group";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { useCheckoutStore } from "../1";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@coreModule/components/uiKit/ui/input-group";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@coreModule/components/uiKit/ui/field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@coreModule/components/uiKit/ui/form";

type ShippingMethod = "fast" | "free";

const checkoutSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    shippingMethod: z.enum(["fast", "free"]),
    paymentMethod: z.enum(["card", "virtual"]),
    cardName: z.string(),
    cardNumber: z.string(),
    cardExpiry: z.string(),
    cardCvc: z.string(),
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

type CheckoutValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage2() {
  const items = useCheckoutStore((state) => state.items);

  const cardNumberMaskRef = useMaskInput({ mask: "9999 9999 9999 9999" });
  const cardExpiryMaskRef = useMaskInput({ mask: "99 / 99" });
  const cardCvcMaskRef = useMaskInput({ mask: "999" });

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      shippingMethod: "fast",
      cardName: "",
      cardNumber: "",
      cardExpiry: "",
      cardCvc: "",
    },
    mode: "onSubmit",
  });

  const shippingMethod = useWatch({
    control: form.control,
    name: "shippingMethod",
  }) as ShippingMethod;

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const shippingCost = shippingMethod === "fast" ? 4.99 : 0;
  const discount = 0;
  const total = subtotal + shippingCost - discount;

  const onSubmit = (values: CheckoutValues) => {
    console.log("Pay clicked", {
      ...values,
      subtotal,
      shippingCost,
      discount,
      total,
      items,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 lg:flex-row lg:py-10"
      >
        <main className="flex flex-1 flex-col gap-4 md:mt-0">
          <header className="space-y-1">
            <div className="text-muted-foreground mb-4 flex items-center gap-2 text-sm md:top-10 md:left-8 md:text-xs xl:absolute">
              <Button type="button" variant="outline" size="sm">
                <ArrowLeft />
                <span>Back to cart</span>
              </Button>
            </div>
            <h1 className="text-foreground font- text-base font-semibold md:text-lg">
              Product Information &amp; Review
            </h1>
            <p className="text-muted-foreground text-xs">
              By placing your order, you agree to Bundui in&apos;s{" "}
              <button
                type="button"
                className="text-foreground font-medium underline-offset-2 hover:underline"
              >
                Privacy
              </button>{" "}
              and{" "}
              <button
                type="button"
                className="text-foreground font-medium underline-offset-2 hover:underline"
              >
                Policy
              </button>
              .
            </p>
          </header>

          <Card className="bg-muted/40 border-none shadow-none">
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-background flex items-start gap-4 rounded-lg border p-4"
                  >
                    <Image
                      src={item.imageSrc}
                      alt={item.imageAlt}
                      width={80}
                      height={80}
                      className="aspect-square w-full max-w-24 rounded-lg object-cover"
                      unoptimized
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <h2 className="truncate text-sm leading-snug font-semibold">
                        {item.name}
                      </h2>
                      <p className="text-muted-foreground line-clamp-2 text-xs md:text-[13px]">
                        {item.name} is a portable ioniser with HT1 HEPA filter
                        technology.
                      </p>
                      <div className="mt-2 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
                        White
                      </div>
                    </div>
                    <p className="text-sm font-semibold md:text-[15px]">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <FormField
                control={form.control}
                name="shippingMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FieldGroup>
                        <FieldSet>
                          <FieldLegend variant="label">
                            Delivery Shipping
                          </FieldLegend>
                          <FieldDescription>
                            Select a delivery option for your order.
                          </FieldDescription>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="gap-3"
                          >
                            <FieldLabel
                              htmlFor="shipping-fast"
                              className="bg-background"
                            >
                              <Field orientation="horizontal">
                                <FieldContent>
                                  <FieldTitle>
                                    <span>$4.99 • Fast Delivery</span>
                                    <Badge
                                      variant="outline"
                                      className="rounded-full border-emerald-500 bg-emerald-50 px-2 py-0 text-[11px] font-medium text-emerald-700"
                                    >
                                      Recommend
                                    </Badge>
                                  </FieldTitle>
                                  <FieldDescription>
                                    Get it by Tomorrow, 12 Oct 23
                                  </FieldDescription>
                                </FieldContent>
                                <RadioGroupItem
                                  value="fast"
                                  id="shipping-fast"
                                />
                              </Field>
                            </FieldLabel>
                            <FieldLabel
                              htmlFor="shipping-free"
                              className="bg-background"
                            >
                              <Field orientation="horizontal">
                                <FieldContent>
                                  <FieldTitle>Free Delivery</FieldTitle>
                                  <FieldDescription>
                                    Get it by Friday, 17 - 18 Oct 23
                                  </FieldDescription>
                                </FieldContent>
                                <RadioGroupItem
                                  value="free"
                                  id="shipping-free"
                                />
                              </Field>
                            </FieldLabel>
                          </RadioGroup>
                        </FieldSet>
                      </FieldGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </main>

        <Card className="bg-muted/40 border-none shadow-none">
          <CardHeader className="pb-4">
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>
              Complete your purchase by providing your payment details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        className="bg-background"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FieldGroup className="w-full">
                        <FieldSet>
                          <FieldLegend variant="label">
                            Select Payment Method
                          </FieldLegend>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="grid grid-cols-2 gap-3"
                          >
                            <FieldLabel
                              htmlFor="payment-card"
                              className="bg-background"
                            >
                              <Field orientation="horizontal">
                                <FieldContent>
                                  <FieldTitle>Debit / Credit Card</FieldTitle>
                                </FieldContent>
                                <RadioGroupItem
                                  value="card"
                                  id="payment-card"
                                />
                              </Field>
                            </FieldLabel>

                            <FieldLabel
                              htmlFor="payment-virtual"
                              className="bg-background"
                            >
                              <Field orientation="horizontal">
                                <FieldContent>
                                  <FieldTitle>Virtual account</FieldTitle>
                                </FieldContent>
                                <RadioGroupItem
                                  value="virtual"
                                  id="payment-virtual"
                                />
                              </Field>
                            </FieldLabel>
                          </RadioGroup>
                        </FieldSet>
                      </FieldGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="cardName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs md:text-sm">
                        Card Details
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Name on card"
                          {...field}
                          className="bg-background"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        {(() => {
                          const { ref, ...restField } = field;
                          return (
                            <InputGroup className="bg-background">
                              <InputGroupInput
                                placeholder="Card number"
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
                                <InputGroupText>VISA</InputGroupText>
                              </InputGroupAddon>
                            </InputGroup>
                          );
                        })()}
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex gap-3">
                  <FormField
                    control={form.control}
                    name="cardExpiry"
                    render={({ field }) => (
                      <FormItem className="flex-1">
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
                                className="bg-background"
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
                      <FormItem className="flex-1">
                        <FormControl>
                          {(() => {
                            const { ref, ...restField } = field;
                            return (
                              <Input
                                placeholder="CVC"
                                inputMode="numeric"
                                ref={(element) => {
                                  (
                                    cardCvcMaskRef as unknown as React.MutableRefObject<HTMLInputElement | null>
                                  ).current = element;
                                  ref(element);
                                }}
                                {...restField}
                                className="bg-background"
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

            <dl className="space-y-2 text-xs md:text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Sub Total</dt>
                <dd className="font-medium">${subtotal.toFixed(2)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="font-medium">${discount.toFixed(2)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="text-base font-semibold md:text-lg">
                  ${total.toFixed(2)}
                </dd>
              </div>
            </dl>

            <Button
              type="submit"
              size="lg"
              className="mt-2 w-full text-sm md:mt-4 md:text-base"
            >
              Pay ${total.toFixed(2)} →
            </Button>
            <p className="text-muted-foreground pt-1 text-center text-xs">
              Payment are secure and encrypted
            </p>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
