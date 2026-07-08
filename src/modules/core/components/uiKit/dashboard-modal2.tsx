"use client";

import React from "react";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Input } from "@coreModule/components/uiKit/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@coreModule/components/uiKit/ui/dialog";
import { Label } from "@coreModule/components/uiKit/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@coreModule/components/uiKit/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@coreModule/components/uiKit/ui/tooltip";
import { CopyIcon } from "lucide-react";

const formSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

export default function LoginForm() {
  const [open, setOpen] = React.useState(true);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Share Link</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share link</DialogTitle>
              <DialogDescription>
                Anyone who has this link will be able to view this.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="link" className="sr-only">
                  Link
                </Label>
                <InputGroup>
                  <InputGroupInput
                    defaultValue="https://ui.shadcn.com/docs/installation"
                    readOnly
                    placeholder="Search..."
                  />
                  <InputGroupAddon align="inline-end">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InputGroupButton
                          className="rounded-full"
                          size="icon-xs"
                        >
                          <CopyIcon />
                        </InputGroupButton>
                      </TooltipTrigger>
                      <TooltipContent>Copy to link</TooltipContent>
                    </Tooltip>
                  </InputGroupAddon>
                </InputGroup>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
