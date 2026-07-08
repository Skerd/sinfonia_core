"use client";

import React from "react";
import { LaptopMinimalIcon, MoonIcon, SunIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@coreModule/components/uiKit/ui/dropdown-menu";
import { Button } from "@coreModule/components/uiKit/ui/button";

export default function ThemeSwitcher() {
  const [open, setOpen] = React.useState(true);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline">
          <SunIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <SunIcon /> Light
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LaptopMinimalIcon /> System
        </DropdownMenuItem>
        <DropdownMenuItem>
          <MoonIcon /> Dark
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
