import { Button } from "@coreModule/components/uiKit/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@coreModule/components/uiKit/ui/popover";
import { Textarea } from "@coreModule/components/uiKit/ui/textarea";

export default function PopoverComponent() {
  return (
    <div className="flex flex-col gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Feedback</Button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <h2 className="mb-2 text-sm font-semibold">Send us feedback</h2>
          <form className="space-y-3">
            <Textarea
              aria-label="Send feedback"
              id="feedback"
              placeholder="How can we improve shadcnuikit?"
            />
            <div className="flex flex-col sm:flex-row sm:justify-end">
              <Button size="sm">Send feedback</Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
}
