import { Avatar, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";

export default function AvatarComponent() {
  return (
    <div className="flex items-center rounded-full border p-1">
      <div className="bg-muted flex -space-x-1.5">
        <Avatar className="ring-background rounded-full ring-1">
          <AvatarImage alt="Avatar 01" src="https://i.pravatar.cc/150?img=1" />
        </Avatar>
        <Avatar className="ring-background rounded-full ring-1">
          <AvatarImage alt="Avatar 02" src="https://i.pravatar.cc/150?img=2" />
        </Avatar>
        <Avatar className="ring-background rounded-full ring-1">
          <AvatarImage alt="Avatar 03" src="https://i.pravatar.cc/150?img=3" />
        </Avatar>
        <Avatar className="ring-background rounded-full ring-1">
          <AvatarImage alt="Avatar 04" src="https://i.pravatar.cc/150?img=4" />
        </Avatar>
      </div>
      <div className="text-muted-foreground flex items-center justify-center px-2 text-xs">
        Trusted by 10K+ developers.
      </div>
    </div>
  );
}
