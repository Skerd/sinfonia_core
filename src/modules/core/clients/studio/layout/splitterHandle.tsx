import {cn} from "@coreModule/components/lib/utils.ts";
import type {Splitter} from "./useSplitter.ts";

/**
 * The visible grab area for a {@link useSplitter}.
 *
 * Deliberately wider than it looks: a 1px border is the right visual weight but a miserable
 * hit target, so the element is 5px of transparent padding around a hairline that only
 * colours on hover or drag.
 */
export default function SplitterHandle({
    splitter,
    direction = "horizontal",
}: {
    splitter: Splitter;
    direction?: "horizontal" | "vertical";
}) {
    const vertical = direction === "horizontal";

    return (
        <div
            {...splitter.handleProps}
            className={cn(
                "group/split relative shrink-0",
                vertical ? "w-1.5 cursor-col-resize" : "h-1.5 cursor-row-resize",
                "focus-visible:outline-none",
            )}
        >
            <div
                className={cn(
                    "absolute bg-border transition-colors",
                    vertical ? "inset-y-0 left-1/2 w-px -translate-x-1/2" : "inset-x-0 top-1/2 h-px -translate-y-1/2",
                    "group-hover/split:bg-primary group-focus-visible/split:bg-primary",
                    splitter.dragging && "bg-primary",
                )}
            />
        </div>
    );
}
