import type { SVGProps } from "react";
import { cn } from "@coreModule/components/lib/utils.ts";

type CircularProgressProps = SVGProps<SVGSVGElement> & {
    /** Size of the SVG (width/height) in pixels. */
    size?: number;
    /** Thickness of the progress ring. */
    strokeWidth?: number;
    /** Progress from 0 to 100. Values are clamped to this range. */
    percentage: number;
    /** Tailwind class for the progress stroke (e.g. "text-blue-500"). Uses currentColor. */
    color?: string;
    /** Tailwind class or CSS color for the track. Defaults to a light gray. */
    trackClassName?: string;
};

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

export function CircularProgress({
    size = 100,
    strokeWidth = 10,
    percentage,
    color = "text-blue-500",
    trackClassName,
    className,
    "aria-label": ariaLabel,
    ...rest
}: CircularProgressProps) {
    const pct = clamp(percentage, 0, 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;

    return (
        <svg
            width={size}
            height={size}
            className={cn("transform -rotate-90", className)}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={ariaLabel}
            {...rest}
        >
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={trackClassName ? "currentColor" : "rgba(0,0,0,0.1)"}
                className={trackClassName}
                strokeWidth={strokeWidth}
                fill="transparent"
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="currentColor"
                className={color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
        </svg>
    );
}