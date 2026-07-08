"use client";

import { useState } from "react";
import { ArrowLeft, ShieldCheckIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMaskInput } from "use-mask-input";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import { Input } from "@coreModule/components/uiKit/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@coreModule/components/uiKit/ui/select";
import { Separator } from "@coreModule/components/uiKit/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@coreModule/components/uiKit/ui/form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@coreModule/components/uiKit/ui/collapsible";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@coreModule/components/uiKit/ui/input-group";

type CartItem = {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

const initialItems: CartItem[] = [
  {
    id: 1,
    name: "Mid-rise straight jeans in blue",
    price: 500,
    image: "/images/products/01.jpeg",
    quantity: 1,
  },
  {
    id: 2,
    name: "Mid-rise straight jeans in blue",
    price: 500,
    image: "/images/products/02.jpeg",
    quantity: 1,
  },
  {
    id: 3,
    name: "Mid-rise straight jeans in blue",
    price: 500,
    image: "/images/products/03.jpeg",
    quantity: 1,
  },
];

const checkoutSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  phoneCountryCode: z.enum(["us", "gb", "eu"]),
  phoneNumber: z.string().min(7, "Enter a valid phone number"),
  streetAddress: z.string().min(1, "Street address is required"),
  country: z.enum(["us", "gb", "eu"]),
  city: z.string().min(1, "Town/City is required"),
  state: z.string().min(1, "State is required"),
  postcode: z.string().min(3, "Postcode is required"),
  cardNumber: z.string().min(12, "Enter a valid card number"),
  expiryDate: z
    .string()
    .min(4, "Enter a valid expiry date")
    .regex(/^\d{2}\/\d{2}$/, "Use MM/YY format"),
  cvv: z.string().min(3, "Enter a valid CVV").max(4, "Enter a valid CVV"),
  discountCode: z.string().optional(),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage3() {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [discount, setDiscount] = useState(0);
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const cardNumberMaskRef = useMaskInput({ mask: "9999 9999 9999 9999" });
  const cardExpiryMaskRef = useMaskInput({ mask: "99/99" });
  const cardCvcMaskRef = useMaskInput({ mask: "999" });

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneCountryCode: "us",
      phoneNumber: "",
      streetAddress: "",
      country: "us",
      city: "",
      state: "",
      postcode: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      discountCode: "",
    },
    mode: "onSubmit",
  });

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const delivery = 10;
  const total = subtotal + delivery - discount;

  const handleQuantityChange = (id: number, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    );
  };

  const handleRemoveItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleApplyDiscount = () => {
    const discountCode = (form.getValues("discountCode") ?? "").trim();
    if (!discountCode) {
      setDiscount(0);
      return;
    }

    // Mock: treat any non-empty code as valid.
    setDiscount(44.57);
    setIsDiscountOpen(false);
  };

  const handleRemoveDiscount = () => {
    setDiscount(0);
    form.setValue("discountCode", "");
    setIsDiscountOpen(false);
  };

  const handlePayment = (values: CheckoutValues) => {
    console.log("Make payment", {
      ...values,
      subtotal,
      delivery,
      discount,
      total,
      items,
    });
  };

  return (
    <section className="py-10 lg:py-14">
      <div className="mx-auto max-w-5xl space-y-6 px-4">
        <Button type="button" variant="outline" size="sm">
          <ArrowLeft />
          <span>Go back</span>
        </Button>
        <Form {...form}>
          <header className="space-y-1">
            <h1 className="text-2xl font-medium">Delivery Information</h1>
            <p className="text-muted-foreground text-sm">
              Please fill out delivery details to finish the checkout process.
            </p>
          </header>
          <form
            onSubmit={form.handleSubmit(handlePayment)}
            className="flex flex-col gap-8 md:gap-10 lg:flex-row"
          >
            <div className="space-y-4">
              <Card className="py-0 shadow-none">
                <CardContent className="divide-y p-0">
                  <div className="space-y-6 p-4 lg:p-6">
                    <h4 className="font-medium">General Information</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter First Name"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter Last Name" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Enter Email"
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
                            <FormLabel>Mobile Number</FormLabel>
                            <div className="flex gap-2">
                              <FormField
                                control={form.control}
                                name="phoneCountryCode"
                                render={({ field: codeField }) => (
                                  <FormItem className="w-28 space-y-0">
                                    <FormControl>
                                      <Select
                                        value={codeField.value}
                                        onValueChange={codeField.onChange}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="us">
                                            🇺🇸 +1
                                          </SelectItem>
                                          <SelectItem value="gb">
                                            🇬🇧 +44
                                          </SelectItem>
                                          <SelectItem value="eu">
                                            🇪🇺 +33
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormControl>
                                <Input placeholder="XXX XXX XXXX" {...field} />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-6 p-4 lg:p-6">
                    <h4 className="font-medium">Address</h4>
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="streetAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter Street Address"
                                {...field}
                              />
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
                                    <SelectValue placeholder="USA" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="us">🇺🇸 USA</SelectItem>
                                    <SelectItem value="gb">🇬🇧 UK</SelectItem>
                                    <SelectItem value="eu">🇪🇺 EU</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Town/City</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter Town/City"
                                  {...field}
                                />
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
                                <Input placeholder="Enter State" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="postcode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postcode</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter Postcode"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 p-4 lg:p-6">
                    <h4 className="font-medium">Payment Information</h4>
                    <div className="grid gap-6">
                      <FormField
                        control={form.control}
                        name="cardNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card</FormLabel>
                            <FormControl>
                              {(() => {
                                const { ref, ...restField } = field;
                                return (
                                  <Input
                                    placeholder="XXXX XXXX XXXX XXXX"
                                    inputMode="numeric"
                                    ref={(element) => {
                                      (
                                        cardNumberMaskRef as unknown as React.MutableRefObject<HTMLInputElement | null>
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
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="expiryDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiry Date</FormLabel>
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
                          name="cvv"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CVV</FormLabel>
                              <FormControl>
                                {(() => {
                                  const { ref, ...restField } = field;
                                  return (
                                    <Input
                                      placeholder="XXX"
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
                      <Button size="lg" className="w-full" type="submit">
                        Pay
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <p className="text-muted-foreground flex justify-center gap-1 text-xs">
                <ShieldCheckIcon className="size-4 text-green-500" />
                Payment are secure and encrypted.
              </p>
            </div>

            <div className="w-96 flex-none space-y-6">
              <div className="space-y-1">
                <p className="text-3xl font-bold md:text-4xl">
                  ${total.toFixed(2)}
                </p>
                <Separator className="my-4" />
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="font-medium">${subtotal.toFixed(2)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Delivery</dt>
                    <dd className="font-medium">${delivery.toFixed(2)}</dd>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Discount</dt>
                      <dd className="font-medium text-emerald-600">
                        -${discount.toFixed(2)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {discount > 0 ? (
                <Button
                  type="button"
                  variant="link"
                  className="text-destructive px-0"
                  size="sm"
                  onClick={handleRemoveDiscount}
                >
                  Remove discount
                </Button>
              ) : (
                <Collapsible
                  open={isDiscountOpen}
                  onOpenChange={setIsDiscountOpen}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0"
                      size="sm"
                    >
                      Add discount
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <FormField
                      control={form.control}
                      name="discountCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <InputGroup>
                              <InputGroupInput
                                placeholder="Enter code"
                                {...field}
                              />
                              <InputGroupAddon align="inline-end">
                                <InputGroupButton
                                  type="button"
                                  onClick={handleApplyDiscount}
                                >
                                  Apply
                                </InputGroupButton>
                              </InputGroupAddon>
                            </InputGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <p className="text-foreground font-semibold">
                    Product Information ({items.length})
                  </p>
                </div>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex flex-1 items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-md bg-gray-200">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm leading-snug font-medium">
                            {item.name}
                          </p>
                          <Button
                            type="button"
                            size="xs"
                            variant="link"
                            className="text-destructive px-0"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-sm font-semibold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <div className="inline-flex items-center rounded-full border text-xs">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="rounded-l-full"
                            onClick={() => handleQuantityChange(item.id, -1)}
                            aria-label="Decrease quantity"
                          >
                            -
                          </Button>
                          <span className="min-w-6 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="rounded-r-full"
                            onClick={() => handleQuantityChange(item.id, 1)}
                            aria-label="Increase quantity"
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </section>
  );
}
