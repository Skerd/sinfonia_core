import { cn } from "@coreModule/components/lib/utils";
import { Check, CheckCheck } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";

import { Message } from "./data";

export default function MessageListItem({ message }: { message: Message }) {
  return (
    <div
      className={cn(
        "flex gap-2",
        message.type === "sent" && "flex-row-reverse",
      )}
    >
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
          <span className="text-muted-foreground block text-xs">
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
    </div>
  );
}
