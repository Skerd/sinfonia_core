"use client";

import * as React from "react";
import { Check, Plus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@coreModule/components/uiKit/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@coreModule/components/uiKit/ui/dialog";

const users = [
  {
    name: "Olivia Martin",
    email: "m@example.com",
    avatar: `/images/avatars/01.png`,
  },
  {
    name: "Isabella Nguyen",
    email: "isabella.nguyen@email.com",
    avatar: `/images/avatars/07.png`,
  },
  {
    name: "Emma Wilson",
    email: "emma@example.com",
    avatar: `/images/avatars/02.png`,
  },
  {
    name: "Jackson Lee",
    email: "lee@example.com",
    avatar: `/images/avatars/09.png`,
  },
  {
    name: "William Kim",
    email: "will@email.com",
    avatar: `/images/avatars/06.png`,
  },
] as const;

type User = (typeof users)[number];

export default function ChatWidget() {
  const [open, setOpen] = React.useState(true);
  const [selectedUsers, setSelectedUsers] = React.useState<User[]>([]);

  const [messages, setMessages] = React.useState([
    {
      role: "agent",
      content: "Hi, how can I help you today?",
    },
    {
      role: "user",
      content: "Hey, I'm having trouble with my account.",
    },
    {
      role: "agent",
      content: "What seems to be the problem?",
    },
    {
      role: "user",
      content: "I can't log in.",
    },
  ]);
  const [input, setInput] = React.useState("");
  const inputLength = input.trim().length;

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => setOpen(true)}>
              <Plus />
              New message
            </Button>
          </DialogTrigger>
          <DialogContent className="gap-0 p-0 outline-hidden">
            <DialogHeader className="px-4 pt-5 pb-4">
              <DialogTitle>New message</DialogTitle>
              <DialogDescription>
                Invite a user to this thread. This will create a new group
                message.
              </DialogDescription>
            </DialogHeader>
            <Command className="overflow-hidden rounded-t-none border-t">
              <CommandInput placeholder="Search user..." />
              <CommandList>
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup className="p-2">
                  {users.map((user) => (
                    <CommandItem
                      key={user.email}
                      className="flex items-center p-2"
                      onSelect={() => {
                        if (selectedUsers.includes(user)) {
                          return setSelectedUsers(
                            selectedUsers.filter(
                              (selectedUser) => selectedUser !== user,
                            ),
                          );
                        }

                        return setSelectedUsers(
                          [...users].filter((u) =>
                            [...selectedUsers, user].includes(u),
                          ),
                        );
                      }}
                    >
                      <Avatar>
                        <AvatarImage src={user.avatar} alt="Image" />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="ml-2">
                        <p className="text-sm leading-none font-medium">
                          {user.name}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {user.email}
                        </p>
                      </div>
                      {selectedUsers.includes(user) ? (
                        <Check className="text-primary ml-auto flex h-5 w-5" />
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            <DialogFooter className="flex items-center border-t p-4 sm:justify-between">
              {selectedUsers.length > 0 ? (
                <div className="flex -space-x-2 overflow-hidden">
                  {selectedUsers.map((user) => (
                    <Avatar
                      key={user.email}
                      className="border-background inline-block border-2"
                    >
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Select users to add to this thread.
                </p>
              )}
              <Button
                disabled={selectedUsers.length < 2}
                onClick={() => {
                  setOpen(false);
                }}
              >
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
