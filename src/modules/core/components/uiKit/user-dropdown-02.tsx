"use client";

import React from "react";
import { Edit3Icon, EyeIcon, MoreHorizontalIcon, Redo2Icon, Trash2Icon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@coreModule/components/uiKit/ui/dropdown-menu";
import { Button } from "@coreModule/components/uiKit/ui/button";

export default function UserActionsMenu() {
  const [open, setOpen] = React.useState(true);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem>
          <EyeIcon />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Edit3Icon />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Redo2Icon /> Assign
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive">
          <Trash2Icon /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
