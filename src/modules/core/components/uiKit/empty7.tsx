import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@coreModule/components/uiKit/ui/empty";
import { Button } from "@coreModule/components/uiKit/ui/button";

export default function EmptyComponent() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle className="font-heading text-8xl">404</EmptyTitle>
        <EmptyDescription>
          The page you're looking for might have been moved or doesn't exist.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button size="sm">Go back</Button>
        <Button size="sm" variant="outline">
          Contact support
        </Button>
      </EmptyContent>
    </Empty>
  );
}
