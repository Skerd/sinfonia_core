import { useId } from "react";

import { Label } from "@coreModule/components/uiKit/ui/label";
import { Textarea } from "@coreModule/components/uiKit/ui/textarea";

export default function TextareaComponent() {
  const id = useId();
  return (
    <div className="group relative w-full max-w-sm">
      <Label
        className="bg-background text-foreground absolute start-1 top-0 z-10 block -translate-y-1/2 px-2 text-xs font-medium group-has-disabled:opacity-50"
        htmlFor={id}>
        Textarea with overlapping label
      </Label>
      <Textarea id={id} />
    </div>
  );
}
