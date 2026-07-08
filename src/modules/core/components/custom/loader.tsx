import type { ComponentType } from "react";
import { HashLoader } from "react-spinners";
import { cn } from "@coreModule/components/lib/utils.ts";

/** Props accepted by react-spinners size-based loaders (e.g. HashLoader, MoonLoader). */
type SpinnerIconProps = {
    loading?: boolean;
    color?: string;
    size?: number | string;
    className?: string;
};

type LoaderProps = {
    className?: string;
    size?: number | string;
    /** Spinner component from react-spinners or compatible (loading, color, size, className). */
    Icon?: ComponentType<SpinnerIconProps>;
    title?: string;
    iconClassName?: string;
    /** Spinner color. Default "currentColor" so it follows theme (e.g. text-muted-foreground). */
    color?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "children">;

export default function Loader({
    className,
    size = "20px",
    Icon = HashLoader,
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
                "flex p-2 gap-2 items-center justify-center w-full rounded-lg border border-border text-muted-foreground",
                className
            )}
            {...rest}
        >
            <Icon color={color} className={cn(iconClassName)} size={size} loading />
            {
                title && 
                <p className="text-xs font-bold animate-pulse text-muted-foreground">{title}</p>
            }
        </div>
    );
}