"use client";

import { Progress } from "@coreModule/components/uiKit/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@coreModule/components/uiKit/ui/card";

export default function ProgressComponent() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Project Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Design Phase</span>
            <span className="text-muted-foreground font-medium">85%</span>
          </div>
          <Progress value={85} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Development</span>
            <span className="text-muted-foreground font-medium">60%</span>
          </div>
          <Progress value={60} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Testing</span>
            <span className="text-muted-foreground font-medium">30%</span>
          </div>
          <Progress value={30} />
        </div>
      </CardContent>
    </Card>
  );
}

