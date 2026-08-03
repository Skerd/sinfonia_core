import type { KeyboardEvent, MouseEvent, MouseEventHandler } from "react";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@coreModule/components/ui/empty.tsx";
import { BrushCleaning } from "lucide-react";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";

type NoDataProps = {
    title: string;
    description?: string;
    onClick?: MouseEventHandler<HTMLDivElement>;
    /** Optional tooltip (e.g. for title-only alerts). When omitted and description is set, description is used as tooltip. */
    tooltip?: string;
    reasons?: string[];
};

export default function NoData({
    title,
    description,
    onClick,
    tooltip,
    reasons,
}: NoDataProps) {
    const isClickable = typeof onClick === "function";
    const hasReasons = Array.isArray(reasons) && reasons.length > 0;

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (!isClickable || !onClick) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(e as unknown as MouseEvent<HTMLDivElement>);
        }
    };

    const empty = (
        <Empty
            className={
                isClickable
                    ? "border border-dashed border-border p-4 transition-colors hover:cursor-pointer hover:bg-muted/50"
                    : "border border-dashed border-border p-4"
            }
            onClick={onClick}
            {...(isClickable && {
                role: "button",
                tabIndex: 0,
                onKeyDown: handleKeyDown,
            })}
        >
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <BrushCleaning />
                </EmptyMedia>
                <EmptyTitle>{title}</EmptyTitle>
                {description && <EmptyDescription>{description}</EmptyDescription>}
            </EmptyHeader>
            {hasReasons && (
                <EmptyContent>
                    <ul className="list-inside list-disc text-left text-sm text-muted-foreground">
                        {reasons.map((reason, index) => (
                            <li key={`${reason}-${index}`}>{reason}</li>
                        ))}
                    </ul>
                </EmptyContent>
            )}
        </Empty>
    );

    const tooltipContent = tooltip ?? description ?? undefined;
    return tooltipContent ? (
        <TooltipDisplayer tooltip={tooltipContent}>{empty}</TooltipDisplayer>
    ) : (
        empty
    );
}
