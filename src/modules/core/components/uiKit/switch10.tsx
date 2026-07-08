import { useId } from "react";

import { Label } from "@coreModule/components/uiKit/ui/label";
import { Switch } from "@coreModule/components/uiKit/ui/switch";

export default function SwitchComponent() {
  const id = useId();
  return (
    <div className="border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
      <Switch
        aria-describedby={`${id}-description`}
        className="order-1 h-4 w-6 after:absolute after:inset-0 [&_span]:size-3 data-[state=checked]:[&_span]:translate-x-2 data-[state=checked]:[&_span]:rtl:-translate-x-2"
        id={id}
      />
      <div className="grid grow gap-2">
        <Label htmlFor={id}>
          Label{" "}
          <span className="text-muted-foreground text-xs leading-[inherit] font-normal">
            (Sublabel)
          </span>
        </Label>
        <p className="text-muted-foreground text-xs" id={`${id}-description`}>
          A short description goes here.
        </p>
      </div>
    </div>
  );
}
