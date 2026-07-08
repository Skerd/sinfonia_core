import { Avatar, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@coreModule/components/uiKit/ui/popover";
import { ChevronDown, UserPlusIcon } from "lucide-react";

export default function AvatarComponent() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-1">
          <Avatar className="ring-background cursor-pointer rounded-full ring-1">
            <AvatarImage alt="Tobias Whetton" src="https://i.pravatar.cc/150?img=1" />
          </Avatar>
          <ChevronDown className="text-muted-foreground size-4" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full max-w-96">
        <div className="flex gap-4">
          <Avatar className="ring-background mt-1 size-14 rounded-full ring-1">
            <AvatarImage alt="Tobias Whetton" src="https://i.pravatar.cc/150?img=1" />
          </Avatar>
          <div className="space-y-1">
            <div className="flex justify-between">
              <div>
                <p className="text-base font-semibold tracking-tight">Toby Belhome</p>
                <p className="text-muted-foreground text-xs">@tobybelhome</p>
              </div>
              <Button variant="outline" size="sm">
                <UserPlusIcon />
                Follow
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              Engineer, designer &amp; developer that can be found inhabiting coffee houses
            </p>
            <div className="text-muted-foreground mt-4 flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-foreground font-semibold">321</span> <span>Points</span>
              </div>
              <div>
                <span className="text-foreground font-semibold">30</span> <span>Friends</span>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
