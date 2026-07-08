import * as React from "react";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="#" className="flex gap-3">
      <img src="https://shadcnuikit.com/logo.png" className="size-8 rounded-md" alt="" />
      <div
        data-logo="description"
        className="grid flex-1 text-left text-sm leading-tight md:hidden">
        <span className="truncate font-medium">Acme Inc</span>
        <span className="truncate text-xs">Enterprise</span>
      </div>
    </Link>
  );
}
