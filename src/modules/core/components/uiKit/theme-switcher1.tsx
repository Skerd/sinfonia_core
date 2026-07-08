"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";

import { Switch } from "@coreModule/components/uiKit/ui/switch";

export default function ThemeSwitcher() {
  const [checked, setChecked] = React.useState(false);

  return (
    <div className="flex items-center space-x-3">
      <Sun className="size-4" />
      <Switch
        checked={checked}
        onCheckedChange={(value) => setChecked(value)}
        aria-label="Toggle theme"
      />
      <Moon className="size-4" />
    </div>
  );
}
