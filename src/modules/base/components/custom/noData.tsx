import type { MouseEventHandler } from "react";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@coreModule/components/ui/empty.tsx";
import { BrushCleaning } from "lucide-react";
import TooltipDisplayer from "@baseModule/components/custom/tooltipDisplayer.tsx";
import TruncatedValue from "@coreModule/components/custom/displayValue/truncatedValue.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

type NoDataProps = {
    title: string;
    description?: string;
    onClick?: MouseEventHandler<HTMLDivElement>;
    /** Optional tooltip (e.g. for title-only alerts). When omitted and a description is set, the description is used as a tooltip. */
    tooltip?: string;
    reasons?: string[];
    className?: string;
};

export default function NoData({
    title,
    description,
    onClick,
    tooltip,
    reasons,
    className,
}: NoDataProps) {
    const isClickable = typeof onClick === "function";
    const hasReasons = Array.isArray(reasons) && reasons.length > 0;

    const empty = (
        <Empty className={cn("border border-dashed border-border p-4", isClickable && "transition-colors hover:cursor-pointer hover:bg-muted/50", className)} onClick={onClick}>

            <EmptyHeader className="w-full">
                <EmptyMedia variant="icon">
                    <BrushCleaning />
                </EmptyMedia>
                <EmptyTitle className="w-full">
                    <TruncatedValue className="w-full">{title}</TruncatedValue>
                </EmptyTitle>
                {
                    description &&
                    <EmptyDescription className="w-full">
                        <TruncatedValue className="w-full">{description}</TruncatedValue>
                    </EmptyDescription>
                }
            </EmptyHeader>
            {
                hasReasons &&
                <EmptyContent>
                    <ul className="w-full flex flex-col gap-1 text-left text-sm text-muted-foreground">
                        {reasons.map((reason, index) => (
                            <li key={`${reason}-${index}`} className="flex items-center gap-2">
                                <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                                <TruncatedValue className="flex-1">{reason}</TruncatedValue>
                            </li>
                        ))}
                    </ul>
                </EmptyContent>
            }
        </Empty>
    );

    if( !!(tooltip) ){
        return (
            <TooltipDisplayer tooltip={tooltip}>{empty}</TooltipDisplayer>
        )
    }

    return empty;

}
