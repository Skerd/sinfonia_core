import { Italic } from "lucide-react";

import { Toggle } from "@coreModule/components/uiKit/ui/toggle";

export default function ToggleComponent() {
  return (
    <Toggle aria-label="Toggle italic">
      <Italic />
      Italic
    </Toggle>
  );
}
