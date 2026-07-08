"use client";

import { useState } from "react";

import { Label } from "@coreModule/components/uiKit/ui/label";
import { Textarea } from "@coreModule/components/uiKit/ui/textarea";

export default function TextareaComponent() {
  const [value, setValue] = useState("");
  const maxLength = 200;

  return (
    <div className="flex w-full max-w-sm flex-col gap-2 *:not-first:mt-2">
      <Label htmlFor="message">Message</Label>
      <Textarea
        className="bg-background"
        id="message"
        maxLength={maxLength}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter your message here..."
        value={value}
      />
      <p className="text-muted-foreground text-right text-sm">
        {value.length}/{maxLength}
      </p>
    </div>
  );
}
