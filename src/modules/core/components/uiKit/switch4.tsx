import { useId } from "react";

import { Label } from "@coreModule/components/uiKit/ui/label";
import { Switch } from "@coreModule/components/uiKit/ui/switch";

export default function SwitchComponent() {
  const id = useId();
  return (
    <div className="inline-flex items-center gap-2">
      <Switch
        className="[&_span]:border-input h-3 w-9 border-none outline-offset-[6px] [&_span]:border"
        id={id}
      />
      <Label className="sr-only" htmlFor={id}>
        M2-style switch
      </Label>
    </div>
  );
}
