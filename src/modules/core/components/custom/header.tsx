import type {ReactNode} from "react";
import {Separator} from "@coreModule/components/ui/separator.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

type SimpleHeaderProps = {
    title: string,
    description: string,
    children?: ReactNode,
    className?: string,
}

/**
 * Page-level heading for panel views.
 *
 * Uses a real <h1>/<p> pair rather than two <p>s so screen readers and the
 * document outline reflect the page, and so the type scale is set once here
 * instead of per page.
 */
export default function Header({
    title,
    description,
    children,
    className,
}: SimpleHeaderProps) {
    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-0.5">
                    <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
                {children && (
                    <div className="flex shrink-0 items-center gap-2">{children}</div>
                )}
            </div>
            <Separator />
        </div>
    )
}
