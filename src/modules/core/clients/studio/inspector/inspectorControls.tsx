import type {ReactNode} from "react";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Switch} from "@coreModule/components/ui/switch.tsx";

/**
 * The controls both inspectors are built from.
 *
 * `nodeInspector` and `columnInspector` grew the same `Row` / `ToggleRow` / `csvToList` /
 * `prune` four times over; keeping one copy means a change to how a labelled control looks
 * lands in both places rather than in whichever was edited last.
 */

export function Row({
    label,
    children,
    hint,
}: {
    label: string;
    children: ReactNode;
    hint?: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            <Label className="text-2xs">{label}</Label>
            {children}
            {hint && <p className="text-3xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

export function ToggleRow({
    label,
    checked,
    onCheckedChange,
    hint,
}: {
    label: string;
    checked: boolean;
    onCheckedChange: (value: boolean) => void;
    hint?: string;
}) {
    return (
        <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
                <Label className="text-2xs">{label}</Label>
                {hint && <p className="text-3xs text-muted-foreground">{hint}</p>}
            </div>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </div>
    );
}

/** Comma-separated text → list, or `undefined` when empty so the key is pruned. */
export function csvToList(raw: string): string[] | undefined {
    const list = raw
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    return list.length > 0 ? list : undefined;
}

/** Drops keys whose value became `undefined`, so exported configs stay free of noise. */
export function prune<T extends object>(value: T): T {
    const next = {...value} as Record<string, unknown>;
    for (const [key, entry] of Object.entries(next)) {
        if (entry === undefined) delete next[key];
    }
    return next as T;
}
