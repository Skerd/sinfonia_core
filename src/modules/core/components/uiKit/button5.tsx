import { Button } from "@coreModule/components/uiKit/ui/button";

export default function Component() {
  return (
    <div className="inline-flex items-center gap-2">
      <Button variant="secondary">Cancel</Button>
      <Button>Save</Button>
    </div>
  );
}
