import Link from "next/link";
import { GithubIcon, TwitterIcon } from "lucide-react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Input } from "@coreModule/components/uiKit/ui/input";
import { Label } from "@coreModule/components/uiKit/ui/label";
import { Checkbox } from "@coreModule/components/uiKit/ui/checkbox";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@coreModule/components/uiKit/ui/card";

export default function LoginPage() {
  return (
    <section
      className="flex min-h-screen w-full items-center justify-center bg-cover py-4 lg:py-20"
      style={{
        backgroundImage:
          "url(https://images.unsplash.com/photo-1483354483454-4cd359948304?q=80&w=1200)",
      }}
    >
      <Card className="w-full max-w-sm border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action="#" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="rememberMe" />
                <label
                  htmlFor="rememberMe"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>

              <Link href="#" className="text-sm hover:underline">
                Forgot your password?
              </Link>
            </div>

            <div>
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </div>
          </form>

          <div className="grid grid-cols-3 gap-3">
            <Button variant="outline">
              <GithubIcon />
            </Button>
            <Button variant="outline">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="24"
                height="24"
              >
                <path d="M12 2a9.96 9.96 0 0 1 6.29 2.226a1 1 0 0 1 .04 1.52l-1.51 1.362a1 1 0 0 1 -1.265 .06a6 6 0 1 0 2.103 6.836l.001 -.004h-3.66a1 1 0 0 1 -.992 -.883l-.007 -.117v-2a1 1 0 0 1 1 -1h6.945a1 1 0 0 1 .994 .89c.04 .367 .061 .737 .061 1.11c0 5.523 -4.477 10 -10 10s-10 -4.477 -10 -10s4.477 -10 10 -10z"></path>
              </svg>
            </Button>
            <Button variant="outline">
              <TwitterIcon />
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
