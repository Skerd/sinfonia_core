import {useEffect, useState} from "react";
import {Textarea} from "@coreModule/components/ui/textarea.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

type JsonPropsEditorProps = {
    label: string;
    value: Record<string, unknown> | undefined;
    onChange: (value: Record<string, unknown> | undefined) => void;
    description?: string;
    rows?: number;
};

/**
 * `props` and `widgetProps` are open bags — the contract types them
 * `Record<string, any>` because each widget reads its own keys. A JSON editor is the
 * honest surface for that: it can express anything the renderer accepts, rather than a
 * form that would only cover the keys someone remembered to enumerate.
 *
 * Invalid JSON is held locally and never committed, so the draft can never contain a
 * half-typed object.
 */
export default function JsonPropsEditor({
    label,
    value,
    onChange,
    description,
    rows = 5,
}: JsonPropsEditorProps) {
    const serialized = value === undefined ? "" : JSON.stringify(value, null, 2);
    const [text, setText] = useState(serialized);
    const [error, setError] = useState<string | null>(null);

    /* Re-sync when the selection changes underneath us (different node, undo, redo). */
    useEffect(() => {
        setText(serialized);
        setError(null);
    }, [serialized]);

    const commit = (next: string) => {
        setText(next);
        const trimmed = next.trim();
        if (trimmed === "" || trimmed === "{}") {
            setError(null);
            onChange(undefined);
            return;
        }
        try {
            const parsed = JSON.parse(trimmed) as unknown;
            if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
                setError("Must be a JSON object");
                return;
            }
            setError(null);
            onChange(parsed as Record<string, unknown>);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Invalid JSON");
        }
    };

    return (
        <div className="flex flex-col gap-1">
            <Label className="text-2xs">{label}</Label>
            {description && <p className="text-3xs text-muted-foreground">{description}</p>}
            <Textarea
                value={text}
                rows={rows}
                spellCheck={false}
                onChange={(e) => commit(e.target.value)}
                className={cn("font-mono text-2xs", error && "border-destructive")}
            />
            {error && <p className="text-3xs text-destructive">{error}</p>}
        </div>
    );
}
