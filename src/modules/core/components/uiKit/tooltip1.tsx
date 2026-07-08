import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@coreModule/components/uiKit/ui/tooltip";
import { Button } from "@coreModule/components/uiKit/ui/button";

export default function Component() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add to library</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
