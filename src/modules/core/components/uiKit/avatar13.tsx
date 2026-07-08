import { Avatar, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@coreModule/components/uiKit/ui/tooltip";

export default function AvatarComponent() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Avatar className="ring-background rounded-full ring-1">
          <AvatarImage alt="Jane Cooper" src="https://i.pravatar.cc/150?img=1" />
        </Avatar>
      </TooltipTrigger>
      <TooltipContent>Jane Cooper</TooltipContent>
    </Tooltip>
  );
}
