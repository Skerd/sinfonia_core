import {
  BanIcon,
  EllipsisIcon,
  Send,
  Share2,
  TrashIcon,
  UserIcon,
} from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@coreModule/components/uiKit/ui/card";
import { ScrollArea } from "@coreModule/components/uiKit/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coreModule/components/uiKit/ui/dropdown-menu";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Input } from "@coreModule/components/uiKit/ui/input";
import MessageListItem from "./message-list-item";

import { messagesData } from "./data";

export default function ChatCard() {
  return (
    <Card className="shadow-none md:w-96">
      <CardHeader>
        <CardTitle>Toby Belhome</CardTitle>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="ghost" className="-mt-2">
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <UserIcon size={16} aria-hidden="true" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 size={16} aria-hidden="true" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BanIcon size={16} aria-hidden="true" />
                Block
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive">
                <TrashIcon size={16} aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {messagesData.map((message) => (
              <MessageListItem key={message.id} message={message} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form className="flex w-full items-center space-x-2">
          <Input
            id="message"
            placeholder="Type your message..."
            className="flex-1"
            autoComplete="off"
          />
          <Button type="submit" variant="outline" size="icon">
            <Send />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
