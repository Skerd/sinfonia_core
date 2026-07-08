import * as React from "react";

import { SidebarTrigger } from "@coreModule/components/uiKit/ui/sidebar";
import { Separator } from "@coreModule/components/uiKit/ui/separator";

import { NavMainHorizontal } from "./nav-main-horizontal";
import { navigationLinks } from "./app-sidebar";
import { NavUser } from "./nav-user";
import { Logo } from "./logo";
import { BellIcon, MailIcon } from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Badge } from "@coreModule/components/uiKit/ui/badge";

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
          <Button size="icon-sm" variant="ghost">
            <MailIcon />
          </Button>
          <Button size="icon-sm" variant="ghost" className="relative">
            <BellIcon />
            <Badge className="absolute -top-2 left-full min-w-5 -translate-x-1/2 px-1 text-[10px]">
              5
            </Badge>
          </Button>
        </div>
        <NavUser />
      </div>
    </header>
  );
}
