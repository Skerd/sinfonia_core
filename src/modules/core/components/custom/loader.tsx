import type { ComponentType } from "react";
import { Spinner } from "@coreModule/components/ui/spinner.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";

type SpinnerIconProps = {
    className?: string;
};

type LoaderProps = {
    className?: string;
    /** Rendered as a Tailwind size, so it tracks the type scale rather than a pixel value. */
    size?: number | string;
    /** Override the spinner glyph. Must accept a className. */
    Icon?: ComponentType<SpinnerIconProps>;
    title?: string;
    iconClassName?: string;
    /** Defaults to currentColor so the spinner follows whatever text color it sits in. */
    color?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "children">;

/** Legacy callers pass pixel sizes (`"20px"`, `24`); map those onto the icon box. */
function resolveSizeStyle(size: number | string | undefined) {
    if (size == null) return undefined;
    const value = typeof size === "number" ? `${size}px` : size;
    return { width: value, height: value };
}

export default function Loader({
    className,
    size = "20px",
    Icon = Spinner,
    iconClassName = "",
    title,
    color = "currentColor",
    ...rest
}: LoaderProps) {
    const ariaLabel = title ?? "Loading";
    return (
        <div
            role="status"
            aria-live="polite"
            aria-label={ariaLabel}
            className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg border border-border p-2 text-muted-foreground",
                className
            )}
            {...rest}
        >
            <span
                className="inline-flex shrink-0 items-center justify-center"
                style={{ ...resolveSizeStyle(size), color }}
            >
                <Icon className={cn("size-full", iconClassName)} />
            </span>
            {title && (
                <p className="animate-pulse text-xs font-bold text-muted-foreground">{title}</p>
            )}
        </div>
    );
}
