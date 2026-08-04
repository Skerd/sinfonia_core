import type {ReactNode} from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@coreModule/components/ui/card.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Empty, EmptyHeader, EmptyTitle} from "@coreModule/components/ui/empty.tsx";

type DashboardWidgetCardProps = {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    /** Subtle glass elevation on analytics widgets. */
    glass?: boolean;
    footer?: ReactNode;
};

export function DashboardWidgetCard({
    title,
    description,
    children,
    className,
    contentClassName,
    glass = true,
    footer,
}: DashboardWidgetCardProps) {
    return (
        // Card already supplies the ring; `glass` only adds the translucent surface.
        <Card className={cn(glass && "bg-card/80 backdrop-blur-sm", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg">{title}</CardTitle>
                {description != null && description !== "" && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent className={cn("pt-0", contentClassName)}>{children}</CardContent>
            {footer != null && <CardFooter className="justify-center">{footer}</CardFooter>}
        </Card>
    );
}

export function DashboardWidgetEmpty({message}: {message: string}) {
    return (
        <Empty className="border border-dashed">
            <EmptyHeader>
                <EmptyTitle className="text-sm font-normal text-muted-foreground">{message}</EmptyTitle>
            </EmptyHeader>
        </Empty>
    );
}
