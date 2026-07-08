import { Alert, AlertDescription } from "@coreModule/components/uiKit/ui/alert";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { CheckCircle2Icon } from "lucide-react";

export default function AlertComponent() {
  return (
    <Alert className="grid-cols-[auto_1fr_auto]! items-center">
      <CheckCircle2Icon className="size-4 shrink-0 translate-y-0! text-green-600!" />
      <AlertDescription>All the files have been moved.</AlertDescription>
      <Button variant="outline" size="sm">
        Undo
      </Button>
    </Alert>
  );
}
