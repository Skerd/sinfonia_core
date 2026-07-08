"use client";

import { useId, useState } from "react";

import { Label } from "@coreModule/components/uiKit/ui/label";
import { Switch } from "@coreModule/components/uiKit/ui/switch";

export default function SwitchComponent() {
  const id = useId();
  const [checked, setChecked] = useState<boolean>(true);

  return (
    <div className="inline-flex items-center gap-2">
      <Switch aria-label="Toggle switch" checked={checked} id={id} onCheckedChange={setChecked} />
      <Label className="text-sm font-medium" htmlFor={id}>
        {checked ? "On" : "Off"}
      </Label>
    </div>
  );
}
