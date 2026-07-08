import { Alert, AlertDescription } from "@coreModule/components/uiKit/ui/alert";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { XIcon } from "lucide-react";

export default function AlertComponent() {
  return (
    <Alert className="grid-cols-[auto_1fr_auto]! items-center">
      <AlertDescription>A friend request has been sent.</AlertDescription>
      <Button variant="ghost" size="icon-sm">
        <XIcon />
      </Button>
    </Alert>
  );
}
