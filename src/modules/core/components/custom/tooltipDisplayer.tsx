import {ReactNode, useState} from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@coreModule/components/ui/tooltip.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";

type TooltipDisplayerProps = {
    children: ReactNode;
    tooltip?: string | number | boolean | null | undefined;
    tooltipRender?: () => ReactNode;
    contentClassName?: string;
    side?: "top" | "right" | "bottom" | "left";
    open?: boolean,
    onOpenChange?: (open: boolean) => void
    container?: HTMLElement | null
    disablePortal?: boolean
};

export function TooltipDisplayer({
    children,
    tooltip,
    tooltipRender,
    contentClassName,
    side = "top",
    open,
    onOpenChange = () => {},
    container,
    disablePortal,
}: TooltipDisplayerProps) {

    // Standard controlled/uncontrolled split: when `open` is supplied the prop *is* the state.
    // Mirroring it into local state through an effect made the tooltip lag one render behind
    // its parent, which showed as a flash on open.
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : uncontrolledOpen;

    const tooltipStr = tooltip != null && tooltip !== "" ? String(tooltip) : "";
    const hasContent = !!tooltipRender || tooltipStr !== "";

    if (!hasContent) {
        return <>{children}</>;
    }

    return (
        <TooltipProvider>
            <Tooltip
                open={isOpen}
                onOpenChange={(value) => {
                    if (!isControlled) setUncontrolledOpen(value);
                    onOpenChange?.(value);
                }}
            >
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent
                    side={side}
                    className={cn(contentClassName)}
                    container={container}
                    disablePortal={disablePortal}
                >
                    {
                        tooltipRender ?
                        <>{tooltipRender()}</>
                        :
                        <p className="text-sm">{tooltipStr}</p>
                    }
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export default TooltipDisplayer;