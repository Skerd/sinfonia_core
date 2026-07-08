import { Button } from "@coreModule/components/uiKit/ui/button";
import { ArrowRight, Phone, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coreModule/components/uiKit/ui/dropdown-menu";

const NAV_ITEMS = [
  {
    label: "Home",
    href: "#",
  },
  {
    label: "About",
    href: "#",
  },
  {
    label: "Product",
    href: "#",
  },
  {
    label: "Services",
    href: "#",
  },
  {
    label: "Appointment",
    href: "#",
  },
];

export default function HeroSection() {
  return (
    <div className="relative h-screen w-full bg-[url('https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=3000&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/90 to-transparent"></div>

      <nav className="absolute top-0 right-0 left-0 z-50 grid grid-cols-2 items-center justify-between px-6 py-6 lg:grid-cols-3">
        <Link href="#" className="flex items-center gap-2 text-white">
          <Image
            src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMCIgd2lkdGg9IjMwMC4wMDAwMDBwdCIgaGVpZ2h0PSIzMDAuMDAwMDAwcHQiIHZpZXdCb3g9IjAgMCAzMDAuMDAwMDAwIDMwMC4wMDAwMDAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiPgoKPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4wMDAwMDAsMzAwLjAwMDAwMCkgc2NhbGUoMC4xMDAwMDAsLTAuMTAwMDAwKSIgZmlsbD0iIzAwMDAwMCIgc3Ryb2tlPSJub25lIj4KPHBhdGggZD0iTTAgMTUwMCBsMCAtMTUwMCAxNTAwIDAgMTUwMCAwIDAgMTUwMCAwIDE1MDAgLTE1MDAgMCAtMTUwMCAwIDAgLTE1MDB6IG02NDcgMTA2MCBjMzEgLTEyIDE4ODIgLTE4NTYgMTkxNCAtMTkwOCA1NCAtODUgMSAtMjA5IC05NyAtMjI4IC05MSAtMTcgLTMwIC03MSAtMTA1NyA5NTQgLTUzNyA1MzcgLTk1NCA5NjIgLTk2MyA5ODEgLTU2IDExNyA3NiAyNDggMjAzIDIwMXogbTg0NSAtMyBjMTUgLTcgMjYzIC0yNDcgNTUyIC01MzQgNDUxIC00NDkgNTI3IC01MjggNTM2IC01NjMgMTYgLTU4IC0xIC0xMTAgLTUwIC0xNTQgLTM1IC0zMSAtNDcgLTM2IC05MSAtMzYgLTI3IDAgLTYyIDYgLTc3IDE0IC0xNSA4IC0yNjMgMjUxIC01NTEgNTQwIGwtNTI1IDUyNSAtNCA1OCBjLTMgNDkgMCA2NCAyMCA5MyA0MSA2MiAxMjQgODYgMTkwIDU3eiBtODU2IC0xIGMxNSAtOCA3MCAtNTkgMTIzIC0xMTMgMTE2IC0xMTggMTMzIC0xNTQgMTA0IC0yMjkgLTMxIC04MCAtMTM2IC0xMjggLTIwMyAtOTEgLTQ5IDI4IC0yMTIgMTkxIC0yMzMgMjMzIC0zNCA3MiAtOCAxNTEgNjUgMTk1IDM3IDIyIDEwNiAyNSAxNDQgNXogbS0xNjgzIC04NTcgYzE3IC0xMCAyNjIgLTI1MSA1NDcgLTUzNiA1NDggLTU1MCA1MzkgLTUzOSA1MjQgLTYxOCAtMTggLTk2IC0xNDEgLTE1NSAtMjIxIC0xMDcgLTE2IDExIC0yNjUgMjUyIC01NTIgNTM4IC00NjUgNDYxIC01MjMgNTIzIC01MjkgNTU3IC0xNCA4MiAyNyAxNTYgMTAxIDE4MiA0NSAxNiA4NiAxMSAxMzAgLTE2eiBtLTI4IC04MzAgYzMyIC0xMiAyMTggLTE5MSAyMzkgLTIzMSAzMSAtNTkgOSAtMTQ2IC00NyAtMTg3IC0zNSAtMjYgLTkzIC0zNyAtMTM2IC0yNiAtMzAgNyAtMjI2IDE5NCAtMjQ5IDIzNyAtNjAgMTE1IDY5IDI1NCAxOTMgMjA3eiIvPgo8L2c+Cjwvc3ZnPg=="
            alt="Logo"
            className="rounded-sm invert"
            width={24}
            height={24}
          />
          <span className="text-lg font-bold">dental</span>
        </Link>

        <div className="hidden items-center justify-center gap-8 rounded-full bg-white/50 px-8 py-4 backdrop-blur-md lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-black hover:opacity-70"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" className="rounded-full md:h-12 md:px-6!">
            <Phone /> Call Now
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:size-12 rounded-full  lg:hidden flex"
              >
                <Menu />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="mt-1 w-44 rounded-2xl bg-white/95 px-1 py-1 text-sm shadow-lg backdrop-blur-md"
            >
              {NAV_ITEMS.map((item) => (
                <DropdownMenuItem
                  key={item.label}
                  asChild
                  className="cursor-pointer rounded-xl px-3 py-2 font-medium text-gray-800 focus:bg-gray-100"
                >
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-20 md:px-12 md:pb-32">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-4xl leading-tight font-bold text-balance text-white md:text-5xl">
            Smart Dental Solutions You Trust
          </h1>
          <p className="max-w-lg text-lg text-white/80">
            Whether it's a routine check-up or a major dental procedure, our
            experienced professionals are just a call away.
          </p>
          <Button className="rounded-full md:h-12 md:px-6!" variant="outline">
            Book Appointment <ArrowRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
