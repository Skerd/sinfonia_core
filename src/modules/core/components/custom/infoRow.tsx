import type {LucideIcon} from "lucide-react";
import type {ReactNode} from "react";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type InfoRowProps = {
    show?: boolean;
    icon?: LucideIcon;
    iconReplacement?: ReactNode;
    label: string;
    tooltip?: string;
    tooltipRender?: any;
    value: ReactNode;
    hideTitle?: boolean;
    className?: string;
    dontRenderValue?: boolean;
};

export default function InfoRow({icon: Icon, iconReplacement, tooltip, tooltipRender, label, value, hideTitle, className, show = true, dontRenderValue = false}: InfoRowProps) {

    const checkValue = (v: ReactNode) => {
        if (v === null || v === undefined) return false;
        if (typeof v === "string") return v.trim().length > 0;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === "boolean"){
            return v
        }
        return true;
    };

    return (
        <div className={cn("flex items-center space-x-1 text-muted-foreground", className)}>
            <div className="hidden md:block">
                <TooltipDisplayer tooltipRender={tooltipRender ? tooltipRender : undefined} tooltip={tooltip}>
                    <div>
                        {
                            iconReplacement ? iconReplacement : <>{!!Icon && <Icon size={18}/>}</>
                        }
                    </div>
                </TooltipDisplayer>
            </div>
            {
                !hideTitle &&
                <p className="text-sm font-medium">{label}{!dontRenderValue && ":"}</p>
            }
            {
                !dontRenderValue &&
                <p className="hover:cursor-default">
                    <HiddenElement showLock={true} randomLength={0}>
                        {
                            show &&
                            <>
                                {checkValue(value) ? value : <ValueNotSet />}
                            </>
                        }
                    </HiddenElement>
                </p>
            }
        </div>
    );
}