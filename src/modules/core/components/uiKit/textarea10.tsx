import { Label } from "@coreModule/components/uiKit/ui/label";
import { Textarea } from "@coreModule/components/uiKit/ui/textarea";
import { Tooltip } from "@coreModule/components/uiKit/ui/tooltip";
import { TooltipTrigger } from "@coreModule/components/uiKit/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { TooltipContent } from "@coreModule/components/uiKit/ui/tooltip";

export default function TextareaComponent() {
  return (
    <div className="grid w-full max-w-sm gap-1.5 *:not-first:mt-2">
      <Label htmlFor="message">
        Your message{" "}
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className="text-muted-foreground size-3" />
          </TooltipTrigger>
          <TooltipContent>
            <p>This is a tooltip</p>
          </TooltipContent>
        </Tooltip>
      </Label>
      <Textarea placeholder="Type your message here." id="message" />
    </div>
  );
}
