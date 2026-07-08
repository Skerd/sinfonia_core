"use client";

import React from "react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Input } from "@coreModule/components/uiKit/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@coreModule/components/uiKit/ui/form";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@coreModule/components/uiKit/ui/dialog";

const formSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

export default function LoginForm() {
  const [open, setOpen] = React.useState(true);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Login</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <div className="flex flex-col gap-4">
              <div className="mb-6 space-y-4 text-center">
                <img src="/logo.svg" className="mx-auto size-10" alt="" />
                <h1 className="font-heading text-center text-2xl">
                  Sign in to your account
                </h1>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="w-full space-y-4 lg:space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex justify-between">
                          Password{" "}
                          <Link
                            href="#"
                            className="text-muted-foreground text-xs underline"
                          >
                            Forgot password?
                          </Link>
                        </FormLabel>

                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Sign in
                  </Button>
                </form>

                <p className="text-muted-foreground text-center text-xs">
                  Not a member?{" "}
                  <Link href="#" className="underline">
                    Start a 14 day free trial
                  </Link>
                </p>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
