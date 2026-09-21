import type {ReactNode} from "react";
import {cn} from "@coreModule/components/lib/utils.ts";

type FormGridProps = {
    columns?: number;
    className?: string;
    children?: ReactNode;
};

const GRID_MAP: Record<string, string> = {
    "1": "grid-cols-1",
    "2": "grid-cols-1 sm:grid-cols-2",
    "3": "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
    "4": "grid-cols-1 sm:grid-cols-2 md:grid-cols-4",
    "5": "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
    "6": "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
    "7": "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7",
    "8": "grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8",
    "9": "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-9",
    "10": "grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10",
    "11": "grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11",
    "12": "grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12",
};

export function FormGrid({ columns = 2, className, children }: FormGridProps) {
    return (
        <div className={cn("grid", GRID_MAP[columns + ""], "gap-4", className)}>{children}</div>
    );
}