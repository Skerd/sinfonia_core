import { Separator } from "@coreModule/components/uiKit/ui/separator";

export default function Example() {
  return (
    <div className="flex flex-col space-y-3 text-sm">
      <div>Blog</div>
      <Separator />
      <div>Docs</div>
      <Separator />
      <div>Source</div>
    </div>
  );
}
