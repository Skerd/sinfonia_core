import * as React from "react";

import { SidebarTrigger } from "@coreModule/components/uiKit/ui/sidebar";
import { Separator } from "@coreModule/components/uiKit/ui/separator";

import { NavMainHorizontal } from "./nav-main-horizontal";
import { navigationLinks } from "./app-sidebar";
import { NavUser } from "./nav-user";
import { Logo } from "./logo";
import { BellIcon, MailIcon } from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import ThemeToggle from "./theme-toggle";

export function AppHeader() {
  return (
    <header
      data-slot="header"
      className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 [&_[data-logo=description]]:hidden"
    >
      <div className="flex grow items-center">
        <Logo />
        <Separator
          orientation="vertical"
          className="mx-4 data-[orientation=vertical]:h-4"
        />
        <SidebarTrigger className="-ml-1 md:hidden" />
        <NavMainHorizontal items={navigationLinks} />
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button size="icon-sm" variant="ghost" className="relative">
            <MailIcon />
            <span className="bg-foreground absolute end-0 top-0 inline size-1.5 rounded-full" />
          </Button>
          <Button size="icon-sm" variant="ghost" className="relative">
            <BellIcon />
            <span className="bg-foreground absolute end-0 top-0 inline size-1.5 rounded-full" />
          </Button>
        </div>
        <NavUser />
      </div>
    </header>
  );
}
