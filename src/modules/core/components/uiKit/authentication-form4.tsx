"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, ArrowRightIcon, GithubIcon, GitlabIcon, MailIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@coreModule/components/uiKit/ui/card";
import { Input } from "@coreModule/components/uiKit/ui/input";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Label } from "@coreModule/components/uiKit/ui/label";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long")
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isManuelForm, setIsManuelForm] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log("form data -->", data);
  };

  return (
    <Card className="w-full md:w-[350px]">
      <CardHeader>
        <CardTitle className="text-center">Log in to App</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {isManuelForm ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register("email")}
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register("password")}
                aria-invalid={errors.password ? "true" : "false"}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login with email"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setIsManuelForm(false)}>
              <ArrowLeftIcon /> Other login options
            </Button>
          </form>
        ) : (
          <div className="grid gap-3">
            <Button variant="outline" className="w-full">
              <MailIcon />
              Continue with Google
            </Button>
            <Button variant="outline" className="w-full">
              <GithubIcon />
              Continue with GitHub
            </Button>
            <Button variant="outline" className="w-full">
              <GitlabIcon />
              Continue with Gitlab
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setIsManuelForm(true)}>
              Continue with Email <ArrowRightIcon className="ms-1 size-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
