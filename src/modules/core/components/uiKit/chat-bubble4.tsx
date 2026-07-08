import { PlusIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@coreModule/components/uiKit/ui/card";
import { Input } from "@coreModule/components/uiKit/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@coreModule/components/uiKit/ui/tooltip";
import { ScrollArea } from "@coreModule/components/uiKit/ui/scroll-area";
import Link from "next/link";

const users = [
  {
    name: "Sofia Chen",
    email: "sofia.chen@email.com",
    avatar: "https://i.pravatar.cc/150?img=1",
    last_message: {
      body: "Can we reschedule for tomorrow?",
      date: "2m ago",
      unread_message_count: 1,
    },
  },
  {
    name: "Marcus Webb",
    email: "marcus.webb@email.com",
    avatar: "https://i.pravatar.cc/150?img=3",
    last_message: {
      body: "Thanks, that works for me.",
      date: "15m ago",
      unread_message_count: 0,
    },
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@email.com",
    avatar: "https://i.pravatar.cc/150?img=5",
    last_message: {
      body: "I've sent the files over.",
      date: "1h ago",
      unread_message_count: 2,
    },
  },
  {
    name: "James Okonkwo",
    email: "j.okonkwo@email.com",
    avatar: "https://i.pravatar.cc/150?img=12",
    last_message: {
      body: "Let me check and get back to you.",
      date: "Yesterday",
      unread_message_count: 0,
    },
  },
  {
    name: "Elena Vasquez",
    email: "elena.v@email.com",
    avatar: "https://i.pravatar.cc/150?img=9",
    last_message: {
      body: "The meeting link is in the calendar.",
      date: "Yesterday",
      unread_message_count: 0,
    },
  },
  {
    name: "Alex Turner",
    email: "alex.turner@email.com",
    avatar: "https://i.pravatar.cc/150?img=11",
    last_message: {
      body: "Sure, no problem at all.",
      date: "Mon",
      unread_message_count: 0,
    },
  },
  {
    name: "Yuki Tanaka",
    email: "yuki.tanaka@email.com",
    avatar: "https://i.pravatar.cc/150?img=16",
    last_message: {
      body: "Looking forward to the demo.",
      date: "Mon",
      unread_message_count: 0,
    },
  },
] as const;

export default function ChatCard() {
  return (
    <>
      <Card className="pb-0 shadow-none md:w-96">
        <CardHeader>
          <CardTitle>Chats</CardTitle>
          <CardAction>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    className="-mt-2 rounded-full"
                  >
                    <PlusIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={10}>New Chat</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          <form className="mb-4 flex w-full items-center space-x-2 px-6">
            <Input
              placeholder="Search chats..."
              className="flex-1"
              autoComplete="off"
            />
          </form>
          <ScrollArea className="h-80">
            <div className="divide-y">
              {users.map((user, index) => (
                <Link
                  href="#"
                  key={index}
                  className="group hover:bg-muted/50 relative flex min-w-0 cursor-pointer items-center gap-3 px-6 py-3"
                >
                  <Avatar>
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n: any) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 grow">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {user.last_message.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground truncate text-start text-sm">
                        {user.last_message.body}
                      </span>
                      {user.last_message.unread_message_count ? (
                        <div className="ms-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-xs text-white dark:bg-green-800">
                          {user.last_message.unread_message_count}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
