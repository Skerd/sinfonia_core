import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Spinner } from "@coreModule/components/uiKit/ui/spinner";

export default function Component() {
  return (
    <div className="flex items-center">
      <Badge>
        <Spinner data-icon="inline-start" />
        Syncing
      </Badge>
    </div>
  );
}
