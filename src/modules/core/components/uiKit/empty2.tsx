import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@coreModule/components/uiKit/ui/empty";

export default function EmptyComponent() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <div className="flex -space-x-2 items-center justify-center">
            <Avatar className="size-10 border-2 border-background">
              <AvatarImage src="https://i.pravatar.cc/150?u=a" alt="User 1" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar className="size-14 z-10 border-4 border-background">
              <AvatarImage src="https://i.pravatar.cc/150?u=b" alt="User 2" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar className="size-10 border-2 border-background">
              <AvatarImage src="https://i.pravatar.cc/150?u=c" alt="User 3" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
        </EmptyMedia>
        <EmptyTitle>No designers found</EmptyTitle>
        <EmptyDescription>
          Sorry, we couldn&apos;t find any designers with the name
          &ldquo;Elizabeth Mazen&rdquo;. Please try again or{" "}
          <a href="#" className="font-medium text-foreground">
            create a profile
          </a>
          .
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" variant="outline">Clear search</Button>
      </EmptyContent>
    </Empty>
  );
}
