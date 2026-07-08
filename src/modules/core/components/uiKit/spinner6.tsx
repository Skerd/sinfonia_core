import { Button } from "@coreModule/components/uiKit/ui/button";
import { Spinner } from "@coreModule/components/uiKit/ui/spinner";

export default function SpinnerComponent() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Button size="icon" variant="destructive" disabled>
        <Spinner />
      </Button>
    </div>
  );
}
