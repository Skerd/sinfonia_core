import type {ReactNode, MouseEvent} from "react";
import {cn} from "@coreModule/components/lib/utils.ts";

type EntityCardActionMenuProps = {
    children: ReactNode;
    className?: string;
    /** inline = header row on text-first cards */
    variant?: "overlay" | "inline";
};

export function EntityCardActionMenu({
    children,
    className,
    variant = "overlay",
}: EntityCardActionMenuProps) {
    const stopPropagation = (e: MouseEvent) => e.stopPropagation();

    if (variant === "inline") {
        return (
            <div className={cn("shrink-0 flex justify-end", className)} onClick={stopPropagation}>
                {children}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "absolute top-0 right-0 flex justify-center gap-1 transition-all duration-200 ease-in-out transform z-20 p-2 rounded-es-lg",
                className,
            )}
            onClick={stopPropagation}
        >
            {children}
        </div>
    );
}
