import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";

export default function AvatarComponent() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex -space-x-1.5">
        <Avatar>
          <AvatarImage
            src="https://i.pravatar.cc/150?img=1"
            alt="Sarah Belhome"
          />
          <AvatarFallback>SB</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage
            src="https://i.pravatar.cc/150?img=2"
            alt="Max Belhome"
          />
          <AvatarFallback>MB</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage
            src="https://i.pravatar.cc/150?img=3"
            alt="Evil Rabbit"
          />
          <AvatarFallback>BR</AvatarFallback>
        </Avatar>
        <Avatar className="ring-background bg-muted text-muted-foreground flex items-center justify-center rounded-full text-sm ring-1">
          <AvatarFallback>+4</AvatarFallback>
        </Avatar>
      </div>
      <div className="space-y-0.5">
        <h6 className="text-sm font-medium">No active collaborators</h6>
        <p className="text-muted-foreground text-xs">
          Invite teammates to start working together.
        </p>
      </div>
    </div>
  );
}
