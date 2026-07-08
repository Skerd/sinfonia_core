"use client";

import { Progress } from "@coreModule/components/uiKit/ui/progress";
import { Label } from "@coreModule/components/uiKit/ui/label";

export default function ProgressComponent() {
  return (
    <div className="w-full max-w-sm space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="progress">Upload Progress</Label>
        <span className="text-muted-foreground text-sm">75%</span>
      </div>
      <Progress id="progress" value={75} />
    </div>
  );
}

