import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@coreModule/components/uiKit/ui/input-group";
import { Spinner } from "@coreModule/components/uiKit/ui/spinner";
import { ArrowUpIcon } from "lucide-react";

export default function Component() {
  return (
    <div className="w-full max-w-xs">
      <InputGroup>
        <InputGroupTextarea placeholder="Send a message..." disabled />
        <InputGroupAddon align="block-end">
          <Spinner /> Validating...
          <InputGroupButton
            size="icon-sm"
            className="ml-auto rounded-full"
            variant="default"
          >
            <ArrowUpIcon />
            <span className="sr-only">Send</span>
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
