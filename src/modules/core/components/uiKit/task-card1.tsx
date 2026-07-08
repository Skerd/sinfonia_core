import React from "react";
import { cn } from "@coreModule/components/lib/utils";
import { CalendarDays, MoreVertical } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Card, CardContent, CardFooter } from "@coreModule/components/uiKit/ui/card";
import { Checkbox } from "@coreModule/components/uiKit/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@coreModule/components/uiKit/ui/dropdown-menu";

type TaskPriority = "high" | "medium" | "low";

type Task = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate: string;
  priority: TaskPriority;
  assignee: {
    name: string;
    avatar: string;
  };
};

const data: Task = {
  id: "task-1",
  title: "Implement new feature",
  description: "Add user authentication functionality to the application",
  dueDate: "10 May 2025",
  priority: "medium",
  assignee: {
    name: "Toby Belhome",
    avatar: "/images/avatars/01.png"
  },
  completed: false
};

const priorityColor = {
  low: "bg-green-100 dark:bg-green-900 dark:text-green-200 text-green-800 hover:bg-green-100",
  medium:
    "bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200 text-yellow-800 hover:bg-yellow-100",
  high: "bg-red-100 dark:bg-red-900 dark:text-red-200 text-red-800 hover:bg-red-100"
};

export default function TaskCard() {
  const [checked, setChecked] = React.useState(data.completed);

  return (
    <Card className={cn("w-full shadow-none md:w-[400px]", { "opacity-50": checked })}>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`task-${data.id}`}
              defaultChecked={checked}
              onCheckedChange={(value) => setChecked(value as boolean)}
            />
            <label
              htmlFor={`task-${data.id}`}
              className={`text-lg font-medium ${data.completed ? "text-muted-foreground line-through" : ""}`}>
              {data.title}
            </label>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <span>Edit</span>
                  <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Archive</span>
                  <DropdownMenuShortcut>⌘A</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>Share</DropdownMenuItem>
                <DropdownMenuItem>Add to favorites</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <span>Delete</span>
                <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-muted-foreground">{data.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarDays className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground text-sm">{data.dueDate}</span>
          </div>
          <Badge className={cn("capitalize", priorityColor[data.priority])}>{data.priority}</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="size-8">
            <AvatarImage src={data.assignee.avatar} alt={data.assignee.name} />
            <AvatarFallback>
              {data.assignee.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground text-sm">{data.assignee.name}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
