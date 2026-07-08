import { Check, CheckCheck, EllipsisIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { cn } from "@coreModule/components/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coreModule/components/uiKit/ui/dropdown-menu";
import { Button } from "@coreModule/components/uiKit/ui/button";

interface Message {
  id: number;
  content: string;
  sender: string;
  avatar: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
  type: "sent" | "received";
}

export default function ChatCard() {
  const message: Message = {
    id: 1,
    content:
      "I'm doing great! Just finished working on that new feature we discussed.",
    sender: "You",
    avatar: "https://i.pravatar.cc/150?img=1",
    timestamp: "05:30 AM",
    status: "read",
    type: "sent",
  };

  return (
    <div className="flex gap-4 md:w-96">
      <Avatar>
        <AvatarImage src={message.avatar} alt={message.sender} />
        <AvatarFallback>{message.sender[0]}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "group flex flex-col space-y-1",
          message.type === "sent" && "items-end",
        )}
      >
        <div
          className={cn(
            "rounded-lg px-3 py-2",
            message.type === "sent"
              ? "bg-primary text-primary-foreground rounded-br-none"
              : "bg-muted rounded-bl-none",
          )}
        >
          <p className="text-sm">{message.content}</p>
        </div>
        <div className="flex items-center gap-1 px-2">
          <span className="text-muted-foreground text-xs">
            {message.timestamp}
          </span>
          {message.type === "sent" && (
            <div className="text-muted-foreground text-xs">
              {message.status === "sent" && <Check className="size-3" />}
              {message.status === "delivered" && (
                <CheckCheck className="size-3" />
              )}
              {message.status === "read" && (
                <CheckCheck className="size-3 text-blue-500" />
              )}
            </div>
          )}
        </div>
      </div>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost">
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Forward</DropdownMenuItem>
            <DropdownMenuItem>Reply</DropdownMenuItem>
            <DropdownMenuItem>Share</DropdownMenuItem>
            <DropdownMenuItem>Delete from me</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
