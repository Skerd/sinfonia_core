import {useId, type ReactNode} from "react";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@coreModule/components/ui/card.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Empty, EmptyDescription, EmptyHeader} from "@coreModule/components/ui/empty.tsx";

export type DashboardWidgetCardProps = {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    footerClassName?: string;
    /** Header trailing slot (badge, menu, link) — uses Card's action grid. */
    action?: ReactNode;
    /** Subtle glass elevation on analytics widgets. */
    glass?: boolean;
    footer?: ReactNode;
};

/**
 * Shared shell for dashboard / analytics widgets: titled Card with optional
 * description, header action, body, and footer. Content already drops top
 * padding under the header — callers should not re-pass `pt-0`.
 */
export function DashboardWidgetCard({
    title,
    description,
    children,
    className,
    contentClassName,
    footerClassName,
    action,
    glass = true,
    footer,
}: DashboardWidgetCardProps) {
    const titleId = useId();

    return (
        // Card already supplies the ring; `glass` only adds the translucent surface.
        <Card
            role="region"
            aria-labelledby={titleId}
            className={cn(glass && "bg-card/80 backdrop-blur-sm", className)}
        >
            <CardHeader className="pb-2">
                <CardTitle id={titleId} className="font-display text-lg">
                    {title}
                </CardTitle>
                {description ? <CardDescription>{description}</CardDescription> : null}
                {action != null ? <CardAction>{action}</CardAction> : null}
            </CardHeader>
            <CardContent className={cn("pt-0", contentClassName)}>{children}</CardContent>
            {footer != null ? (
                <CardFooter className={cn("w-full", footerClassName)}>{footer}</CardFooter>
            ) : null}
        </Card>
    );
}

export function DashboardWidgetEmpty({message}: {message: string}) {
    return (
        <Empty className="border border-dashed py-8">
            <EmptyHeader>
                <EmptyDescription>{message}</EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
