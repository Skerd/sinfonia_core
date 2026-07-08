import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Badge } from "@coreModule/components/uiKit/ui/badge";

export default function AvatarComponent() {
  return (
    <div className="relative">
      <Avatar>
        <AvatarImage alt="Kelly King" src="https://i.pravatar.cc/150?img=10" />
        <AvatarFallback>KK</AvatarFallback>
      </Avatar>
      <Badge className="border-background absolute -top-1.5 left-full min-w-5 -translate-x-3.5 px-1">
        6
      </Badge>
    </div>
  );
}
