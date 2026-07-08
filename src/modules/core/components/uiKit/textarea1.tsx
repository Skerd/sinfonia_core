import { Label } from "@coreModule/components/uiKit/ui/label";
import { Textarea } from "@coreModule/components/uiKit/ui/textarea";

export default function TextareaComponent() {
  return (
    <div className="grid w-full max-w-sm gap-1.5 *:not-first:mt-2">
      <Label htmlFor="message">Your message</Label>
      <Textarea placeholder="Type your message here." id="message" />
    </div>
  );
}
