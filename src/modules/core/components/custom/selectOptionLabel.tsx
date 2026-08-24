import TruncatedValue from "@coreModule/components/custom/displayValue/truncatedValue.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

type SelectOptionLabelProps = {
    label: string;
    className?: string;
};

/** Truncated select label with tooltip when clipped (dropdown items and triggers). */
export default function SelectOptionLabel({label, className}: SelectOptionLabelProps) {
    const text = label.trim();
    if (!text) return null;

    return (
        <TruncatedValue text={text} className={cn("min-w-0 truncate", className)}>
            {text}
        </TruncatedValue>
    );
}
