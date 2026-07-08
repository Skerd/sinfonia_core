import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Button } from "@coreModule/components/uiKit/ui/button";

export default function HeroSection() {
  return (
    <section className="bg-muted dark:bg-muted/20">
      <header className="mx-auto max-w-5xl lg:px-4 lg:pt-6">
        <nav className="bg-background flex items-center justify-between px-6 py-3 backdrop-blur-md lg:rounded-full">
          <Link href="/">
            <Image
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMCIgd2lkdGg9IjMwMC4wMDAwMDBwdCIgaGVpZ2h0PSIzMDAuMDAwMDAwcHQiIHZpZXdCb3g9IjAgMCAzMDAuMDAwMDAwIDMwMC4wMDAwMDAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiPgoKPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4wMDAwMDAsMzAwLjAwMDAwMCkgc2NhbGUoMC4xMDAwMDAsLTAuMTAwMDAwKSIgZmlsbD0iIzAwMDAwMCIgc3Ryb2tlPSJub25lIj4KPHBhdGggZD0iTTAgMTUwMCBsMCAtMTUwMCAxNTAwIDAgMTUwMCAwIDAgMTUwMCAwIDE1MDAgLTE1MDAgMCAtMTUwMCAwIDAgLTE1MDB6IG02NDcgMTA2MCBjMzEgLTEyIDE4ODIgLTE4NTYgMTkxNCAtMTkwOCA1NCAtODUgMSAtMjA5IC05NyAtMjI4IC05MSAtMTcgLTMwIC03MSAtMTA1NyA5NTQgLTUzNyA1MzcgLTk1NCA5NjIgLTk2MyA5ODEgLTU2IDExNyA3NiAyNDggMjAzIDIwMXogbTg0NSAtMyBjMTUgLTcgMjYzIC0yNDcgNTUyIC01MzQgNDUxIC00NDkgNTI3IC01MjggNTM2IC01NjMgMTYgLTU4IC0xIC0xMTAgLTUwIC0xNTQgLTM1IC0zMSAtNDcgLTM2IC05MSAtMzYgLTI3IDAgLTYyIDYgLTc3IDE0IC0xNSA4IC0yNjMgMjUxIC01NTEgNTQwIGwtNTI1IDUyNSAtNCA1OCBjLTMgNDkgMCA2NCAyMCA5MyA0MSA2MiAxMjQgODYgMTkwIDU3eiBtODU2IC0xIGMxNSAtOCA3MCAtNTkgMTIzIC0xMTMgMTE2IC0xMTggMTMzIC0xNTQgMTA0IC0yMjkgLTMxIC04MCAtMTM2IC0xMjggLTIwMyAtOTEgLTQ5IDI4IC0yMTIgMTkxIC0yMzMgMjMzIC0zNCA3MiAtOCAxNTEgNjUgMTk1IDM3IDIyIDEwNiAyNSAxNDQgNXogbS0xNjgzIC04NTcgYzE3IC0xMCAyNjIgLTI1MSA1NDcgLTUzNiA1NDggLTU1MCA1MzkgLTUzOSA1MjQgLTYxOCAtMTggLTk2IC0xNDEgLTE1NSAtMjIxIC0xMDcgLTE2IDExIC0yNjUgMjUyIC01NTIgNTM4IC00NjUgNDYxIC01MjMgNTIzIC01MjkgNTU3IC0xNCA4MiAyNyAxNTYgMTAxIDE4MiA0NSAxNiA4NiAxMSAxMzAgLTE2eiBtLTI4IC04MzAgYzMyIC0xMiAyMTggLTE5MSAyMzkgLTIzMSAzMSAtNTkgOSAtMTQ2IC00NyAtMTg3IC0zNSAtMjYgLTkzIC0zNyAtMTM2IC0yNiAtMzAgNyAtMjI2IDE5NCAtMjQ5IDIzNyAtNjAgMTE1IDY5IDI1NCAxOTMgMjA3eiIvPgo8L2c+Cjwvc3ZnPg=="
              alt="Logo"
              className="rounded-md"
              width={32}
              height={32}
            />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {["Services", "Reviews", "Pricing", "Projects", "Contact Us"].map(
              (item) => (
                <Link
                  key={item}
                  href="#"
                  className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
                >
                  {item}
                </Link>
              ),
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button className="rounded-full" size="lg">
              Get Started
            </Button>
            <Button variant="ghost" className="md:hidden">
              <Menu />
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Content */}
      <div className="container mx-auto flex flex-col items-center justify-center space-y-8 px-4 py-20 text-center md:py-32 lg:space-y-16">
        <div className="mx-auto max-w-3xl space-y-4">
          <Badge
            variant="outline"
            className="bg-background inline-flex gap-2 px-3 py-1"
          >
            <span className="inline-flex size-2 animate-pulse rounded-full bg-green-600"></span>
            <span className="text-muted-foreground text-sm">
              Join 12,450+ brands growing with us
            </span>
          </Badge>

          <h1 className="text-4xl leading-tight font-bold text-balance lg:text-5xl">
            Websites built to perform beautifully.
          </h1>
          <p className="text-muted-foreground text-balance md:text-lg">
            We design high-impact websites that convert and scale. From sleek
            interfaces to full stack experiences, we bring your brand to life
            online.
          </p>

          <div className="mt-6 flex justify-center gap-3 lg:mt-8">
            <Button size="lg">Get Started </Button>
            <Button size="lg" variant="outline">
              Book a demo
            </Button>
          </div>
        </div>

        {/* Gradient Line */}
        <div className="via-primary/30 dark:via-primary/30 h-px w-full max-w-3xl bg-linear-to-r from-transparent to-transparent"></div>

        {/* Stats */}
        <div className="grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
          {[
            { value: "20+", label: "Years Experience" },
            { value: "12k+", label: "Projects Completed" },
            { value: "5k+", label: "Happy Customers" },
            { value: "5+", label: "Countries" },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-background flex flex-col items-center gap-2 rounded-lg py-8"
            >
              <span className="text-3xl font-bold">{stat.value}</span>
              <span className="text-muted-foreground text-sm">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
