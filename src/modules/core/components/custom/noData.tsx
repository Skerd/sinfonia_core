import type { KeyboardEvent, MouseEvent, MouseEventHandler } from "react";
import { Alert, AlertDescription, AlertTitle } from "@coreModule/components/ui/alert.tsx";
import { BrushCleaning } from "lucide-react";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";

type NoDataProps = {
    title: string;
    description?: string;
    onClick?: MouseEventHandler<HTMLDivElement>;
    /** Optional tooltip (e.g. for title-only alerts). When omitted and description is set, description is used as tooltip. */
    tooltip?: string;
    reasons?: string[];
};

export default function NoData({
    title,
    description,
    onClick,
    tooltip,
    reasons,
}: NoDataProps) {
    const isClickable = typeof onClick === "function";

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (!isClickable || !onClick) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(e as unknown as MouseEvent<HTMLDivElement>);
        }
    };

    const alert = (
        <Alert
            variant="warning"
            className={isClickable ? "cursor-pointer" : undefined}
            onClick={onClick}
            {...(isClickable && {
                role: "button",
                tabIndex: 0,
                onKeyDown: handleKeyDown,
            })}
        >
            <BrushCleaning />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>
                {description ? <p>{description}</p> : null}
                {Array.isArray(reasons) && reasons.length > 0 ? (
                    <ul className="list-inside list-disc text-sm mt-1">
                        {reasons.map((reason, index) => (
                            <li key={`${reason}-${index}`}>{reason}</li>
                        ))}
                    </ul>
                ) : null}
            </AlertDescription>
        </Alert>
    );

    const tooltipContent = tooltip ?? (description ?? undefined);
    return tooltipContent ? (
        <TooltipDisplayer tooltip={tooltipContent}>{alert}</TooltipDisplayer>
    ) : (
        alert
    );
}