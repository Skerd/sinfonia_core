import { Avatar, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@coreModule/components/uiKit/ui/tooltip";

const users = [
  {
    id: "1",
    name: "Jane Cooper",
    avatar: "https://i.pravatar.cc/150?img=1"
  },
  {
    id: "2",
    name: "Devon Lane",
    avatar: "https://i.pravatar.cc/150?img=2"
  },
  {
    id: "3",
    name: "Courtney Henry",
    avatar: "https://i.pravatar.cc/150?img=3"
  },
  {
    id: "4",
    name: "Leslie Alexander",
    avatar: "https://i.pravatar.cc/150?img=4"
  }
];

export default function AvatarComponent() {
  return (
    <div className="flex -space-x-1.5">
      {users.map((user) => (
        <Tooltip key={user.id}>
          <TooltipTrigger asChild>
            <Avatar className="ring-background rounded-full ring-1">
              <AvatarImage alt={user.name} src={user.avatar} />
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>{user.name}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
