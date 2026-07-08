import { Progress } from "@coreModule/components/uiKit/ui/progress";

export default function ProgressComponent() {
  return (
    <div className="w-full max-w-sm space-y-2">
      <Progress value={50} className="h-4" />
    </div>
  );
}
