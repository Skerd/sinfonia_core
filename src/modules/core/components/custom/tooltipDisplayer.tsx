import {ReactNode, useEffect, useState} from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@coreModule/components/ui/tooltip.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";
import withVisibility, {VisibilityProps} from "@coreModule/helpers/hocs/withVisibility.tsx";
import {compose} from "redux";

type TooltipDisplayerProps = VisibilityProps & {
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

    const [internalOpen, setInternalOpen] = useState(open ?? false);

    const tooltipStr = tooltip != null && tooltip !== "" ? String(tooltip) : "";
    const hasContent = !!tooltipRender || tooltipStr !== "";

    useEffect(() => {
        setInternalOpen(!!open);
    }, [open]);

    if (!hasContent) {
        return <>{children}</>;
    }

    return (
        <TooltipProvider>
            <Tooltip open={internalOpen} onOpenChange={(value) => { setInternalOpen(value); onOpenChange?.(value) }}>
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
                        !!tooltipRender ?
                        <>{tooltipRender()}</>
                        :
                        <p className="text-sm">{tooltipStr}</p>
                    }
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export default compose(
    withVisibility()
)(TooltipDisplayer)