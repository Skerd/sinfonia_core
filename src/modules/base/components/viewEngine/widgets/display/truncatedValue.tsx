import {useCallback, useRef, useState, type ReactNode} from "react";
import TooltipDisplayer from "@baseModule/components/custom/tooltipDisplayer.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import {useCanHover} from "@baseModule/helpers/hooks/useCanHover.ts";
import {cn} from "@coreModule/components/lib/utils.ts";

function isOverflown(node: HTMLElement) {
    return node.offsetWidth < node.scrollWidth || node.offsetHeight < node.scrollHeight;
}

/**
 * Tracks whether `node` is currently clipping its content, live -- via
 * ResizeObserver rather than a one-time check, so a later resize (column
 * resize, sidebar collapse) is picked up too.
 */
function useOverflowMeasurement<T extends HTMLElement>() {
    const [overflown, setOverflown] = useState(false);
    const observerRef = useRef<ResizeObserver | null>(null);

    const ref = useCallback((node: T | null) => {
        observerRef.current?.disconnect();
        observerRef.current = null;
        if (!node) return;

        const update = () => setOverflown(isOverflown(node));
        update();

        const ro = new ResizeObserver(update);
        ro.observe(node);
        observerRef.current = ro;
    }, []);

    return [overflown, ref] as const;
}

type TruncatedValueBaseProps = {
    children: ReactNode;
    className?: string;
    /**
     * Element the truncated box itself renders as. Defaults to "div" -- pass a
     * heading tag when this IS the page's/section's heading, so truncating it does
     * not also strip its semantic role (screen readers, `getByRole("heading")`).
     */
    as?: "div" | "span" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
};

type TruncatedValueProps = TruncatedValueBaseProps & (
    | {
        /** Compact hover tooltip (default). For short single-line values (ids, names, dates). */
        preview?: "tooltip";
        /** Full value shown in the tooltip once the visible text clips. Falls back to `children` when omitted and `children` is a plain string. */
        text?: string;
    }
    | {
        /**
         * Scrollable, format-preserving peek for long free text (chat bodies, notes,
         * raw cell values): hover popover on desktop, tap-to-open popover on mobile --
         * hover has no touch equivalent. Re-renders `children` itself (not a plain-text
         * copy), so links/formatting inside survive into the peek.
         */
        preview: "popover";
        /** Merged onto the `<pre>` wrapping the peeked content. */
        contentClassName?: string;
    }
);

/**
 * Single-line ellipsis with a full-value peek once the box is narrower than its
 * content -- including after a later resize (column/sidebar collapse), via
 * ResizeObserver rather than a one-time check at mount.
 */
export default function TruncatedValue(props: TruncatedValueProps) {
    const {children, className, as: Tag = "div"} = props;
    const canHover = useCanHover();

    // Both hooks are always called, regardless of `preview`/`canHover` -- conditionally
    // calling one of them would break the rules of hooks. Only one of the two ever
    // actually gets attached to a real node; the other just stays at its initial `false`.
    const [primaryOverflown, primaryRef] = useOverflowMeasurement<HTMLElement>();
    const [mobileOverflown, mobileRef] = useOverflowMeasurement<HTMLButtonElement>();

    const box = (
        <Tag ref={primaryRef} className={cn("min-w-0 truncate", className)}>
            {children}
        </Tag>
    );

    if (props.preview !== "popover") {
        const tooltipText = props.text ?? (typeof children === "string" ? children : undefined);
        return (
            <TooltipDisplayer tooltip={primaryOverflown ? tooltipText : undefined}>
                {box}
            </TooltipDisplayer>
        );
    }

    const renderPeek = () => (
        <div className="max-w-sm max-h-72 min-w-0 overflow-y-auto overflow-x-hidden">
            <pre className={cn("max-w-full whitespace-pre-wrap wrap-break-word", props.contentClassName)}>{children}</pre>
        </div>
    );

    // No hover capability means a tap-to-open popover instead of the hover peek --
    // picked via `useCanHover` (an actual pointer-capability check, live-updating)
    // rather than rendering both and hiding one with CSS, or gating on viewport width
    // (a narrow-but-still-mouse-driven desktop window is not a touch device). Two
    // copies of `children` mounted at once means two copies of anything interactive
    // inside it (a link, say): a real browser only *shows* one, but that's still two
    // focusable controls in the accessibility tree, and a test environment with no
    // media queries shows both at once.
    if (!canHover) {
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        ref={mobileRef}
                        type="button"
                        className={cn("block w-full truncate text-left", className)}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {children}
                    </button>
                </PopoverTrigger>
                {mobileOverflown && (
                    <PopoverContent className={cn("w-fit", props.contentClassName)}>
                        {renderPeek()}
                    </PopoverContent>
                )}
            </Popover>
        );
    }

    return (
        <TooltipDisplayer tooltipRender={primaryOverflown ? renderPeek : undefined}>
            {box}
        </TooltipDisplayer>
    );
}
