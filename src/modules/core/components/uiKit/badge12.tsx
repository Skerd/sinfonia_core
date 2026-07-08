import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { ArrowDown, ArrowDownIcon, ArrowLeft, ArrowUp } from "lucide-react";

export default function BadgeComponent() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge className="bg-green-50 text-green-700 hover:bg-green-50 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900">
        <ArrowUp />
        9.3%
      </Badge>

      <Badge className="bg-red-50 text-red-700 hover:bg-red-50 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900">
        <ArrowDownIcon className="stroke-3" />
        1.9%
      </Badge>

      <Badge className="bg-green-600 text-white hover:bg-green-600 dark:bg-green-700 dark:text-green-200 dark:hover:bg-green-400">
        <ArrowUp />
        12.4%
      </Badge>

      <Badge variant="destructive">
        <ArrowDown />
        -2.3%
      </Badge>
    </div>
  );
}
