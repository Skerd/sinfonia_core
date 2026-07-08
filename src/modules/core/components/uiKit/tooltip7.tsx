import { Button } from "@coreModule/components/uiKit/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@coreModule/components/uiKit/ui/tooltip";

export default function Component() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">
          No arrow
        </Button>
      </TooltipTrigger>
      <TooltipContent className="[&_svg]:invisible">
        <p>This tooltip don&apos;t have arrow</p>
      </TooltipContent>
    </Tooltip>
  );
}
