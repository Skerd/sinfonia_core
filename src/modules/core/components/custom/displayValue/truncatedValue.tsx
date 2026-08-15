import {useCallback, useRef, useState, type ReactNode} from "react";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

function isOverflown(node: HTMLElement) {
    return node.offsetWidth < node.scrollWidth || node.offsetHeight < node.scrollHeight;
}

type TruncatedValueProps = {
    /** Full value shown in the hover tooltip once the visible text clips. */
    text: string;
    children: ReactNode;
    className?: string;
};

/**
 * Single-line ellipsis. Tooltip appears only after the box is narrower than
 * its content — including after the card column resizes.
 */
export default function TruncatedValue({text, children, className}: TruncatedValueProps) {
    const [overflown, setOverflown] = useState(false);
    const observerRef = useRef<ResizeObserver | null>(null);

    const ref = useCallback((node: HTMLDivElement | null) => {
        observerRef.current?.disconnect();
        observerRef.current = null;
        if (!node) return;

        const update = () => setOverflown(isOverflown(node));
        update();

        const ro = new ResizeObserver(update);
        ro.observe(node);
        observerRef.current = ro;
    }, []);

    return (
        <TooltipDisplayer tooltip={overflown ? text : undefined}>
            <div ref={ref} className={cn("min-w-0 truncate", className)}>
                {children}
            </div>
        </TooltipDisplayer>
    );
}
