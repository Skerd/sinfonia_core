import { Search } from "lucide-react";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@coreModule/components/uiKit/ui/input-group";

export default function Component() {
  return (
    <InputGroup className="max-w-sm">
      <InputGroupInput placeholder="Search..." />
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">12 results</InputGroupAddon>
    </InputGroup>
  );
}
