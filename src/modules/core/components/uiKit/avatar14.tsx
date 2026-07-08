"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@coreModule/components/uiKit/ui/dropdown-menu";

const users = [
  {
    id: "1",
    name: "Jane Cooper",
    initials: "JC",
    avatar: "https://i.pravatar.cc/150?img=5"
  },
  {
    id: "2",
    name: "Devon Lane",
    initials: "DL",
    avatar: "https://i.pravatar.cc/150?img=6"
  },
  {
    id: "3",
    name: "Courtney Henry",
    initials: "CH",
    avatar: "https://i.pravatar.cc/150?img=7"
  },
  {
    id: "4",
    name: "Leslie Alexander",
    initials: "LA",
    avatar: "https://i.pravatar.cc/150?img=8"
  }
];

export default function AvatarComponent() {
  return (
    <div className="flex -space-x-1.5">
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="ring-background bg-muted text-muted-foreground focus-visible:ring-ring flex size-8 items-center justify-center rounded-full text-sm ring-1 focus-visible:ring-2 z-1 focus-visible:outline-none">
            +4
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {users.map((user) => (
            <DropdownMenuItem key={user.id}>
              <Avatar className="ring-background mr-2 size-7 rounded-full ring-1">
                <AvatarImage alt={user.name} src={user.avatar} />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <span className="truncate text-sm">{user.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
