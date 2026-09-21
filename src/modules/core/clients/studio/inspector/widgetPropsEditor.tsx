import {useMemo} from "react";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Switch} from "@coreModule/components/ui/switch.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {IconAlertTriangle} from "@tabler/icons-react";
import {resolveIcon} from "@coreModule/components/viewEngine/widgetRegistry.ts";
import type {WidgetPropMeta} from "@coreModule/components/viewEngine/widgetMeta.ts";
import JsonPropsEditor from "./jsonPropsEditor.tsx";

type WidgetPropsEditorProps = {
    label: string;
    description?: string;
    value: Record<string, unknown> | undefined;
    onChange: (value: Record<string, unknown> | undefined) => void;
    /** Described keys for this widget. Undescribed widgets fall back to raw JSON. */
    propMeta?: WidgetPropMeta[];
    /** Datalist of read/write paths, for `suggest: "readPath" | "writePath"`. */
    pathListId?: string;
    /** Datalist of registry tokens, for `suggest: "widgetToken"`. */
    widgetListId?: string;
};

/**
 * A form over the keys a widget is known to read, with an escape hatch for the rest.
 *
 * `widgetProps` is `Record<string, any>` in the contract because each widget reads its
 * own keys, and a raw JSON box was the honest surface for that while nothing described
 * them. Now that `widgetMeta` does, the documented keys can be real controls — but the
 * bag is still open, so anything undescribed stays editable as JSON and round-trips
 * untouched. Nothing is ever dropped for being unrecognised.
 */
export default function WidgetPropsEditor({
    label,
    description,
    value,
    onChange,
    propMeta,
    pathListId,
    widgetListId,
}: WidgetPropsEditorProps) {
    const described = useMemo(() => propMeta ?? [], [propMeta]);
    const describedNames = useMemo(() => new Set(described.map((p) => p.name)), [described]);

    const extras = useMemo(() => {
        const rest: Record<string, unknown> = {};
        for (const [key, entry] of Object.entries(value ?? {})) {
            if (!describedNames.has(key)) rest[key] = entry;
        }
        return Object.keys(rest).length > 0 ? rest : undefined;
    }, [value, describedNames]);

    if (described.length === 0) {
        /* Undescribed widget: exactly the previous behaviour. */
        return (
            <JsonPropsEditor
                label={label}
                value={value}
                onChange={onChange}
                description={description}
            />
        );
    }

    const commit = (next: Record<string, unknown>) => {
        for (const [key, entry] of Object.entries(next)) {
            if (entry === undefined) delete next[key];
        }
        onChange(Object.keys(next).length > 0 ? next : undefined);
    };

    const setKey = (name: string, next: unknown) => commit({...(value ?? {}), [name]: next});

    /** Replaces only the undescribed keys, leaving the typed controls' values intact. */
    const setExtras = (next: Record<string, unknown> | undefined) => {
        const kept: Record<string, unknown> = {};
        for (const [key, entry] of Object.entries(value ?? {})) {
            if (describedNames.has(key)) kept[key] = entry;
        }
        commit({...kept, ...(next ?? {})});
    };

    const listIdFor = (prop: WidgetPropMeta): string | undefined => {
        if (prop.suggest === "readPath" || prop.suggest === "writePath") return pathListId;
        if (prop.suggest === "widgetToken") return widgetListId;
        return undefined;
    };

    const renderControl = (prop: WidgetPropMeta) => {
        const current = value?.[prop.name];
        const placeholder = prop.default !== undefined ? String(prop.default) : undefined;

        if (prop.type === "boolean") {
            return (
                <Switch
                    checked={current === true}
                    onCheckedChange={(next) => setKey(prop.name, next || undefined)}
                />
            );
        }

        if (prop.type === "enum") {
            return (
                <select
                    value={typeof current === "string" ? current : ""}
                    onChange={(e) => setKey(prop.name, e.target.value || undefined)}
                    className="h-8 rounded border bg-background px-2 font-mono text-2xs"
                >
                    <option value="">{placeholder ? `(${placeholder})` : "(unset)"}</option>
                    {(prop.enum ?? []).map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            );
        }

        if (prop.type === "number") {
            return (
                <Input
                    type="number"
                    value={typeof current === "number" ? current : ""}
                    placeholder={placeholder}
                    className="h-8 font-mono text-2xs"
                    onChange={(e) =>
                        setKey(prop.name, e.target.value === "" ? undefined : Number(e.target.value))
                    }
                />
            );
        }

        if (prop.type === "string[]") {
            const list = Array.isArray(current) ? (current as unknown[]).map(String) : [];
            return (
                <Input
                    value={list.join(", ")}
                    list={listIdFor(prop)}
                    placeholder="comma-separated"
                    className="h-8 font-mono text-2xs"
                    onChange={(e) => {
                        const next = e.target.value
                            .split(",")
                            .map((part) => part.trim())
                            .filter(Boolean);
                        setKey(prop.name, next.length > 0 ? next : undefined);
                    }}
                />
            );
        }

        if (prop.type === "json") {
            return (
                <JsonPropsEditor
                    label=""
                    rows={3}
                    value={
                        current && typeof current === "object" && !Array.isArray(current)
                            ? (current as Record<string, unknown>)
                            : undefined
                    }
                    onChange={(next) => setKey(prop.name, next)}
                />
            );
        }

        return (
            <Input
                value={typeof current === "string" ? current : ""}
                list={listIdFor(prop)}
                placeholder={placeholder}
                className="h-8 font-mono text-2xs"
                onChange={(e) => setKey(prop.name, e.target.value || undefined)}
            />
        );
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
                <Label className="text-2xs">{label}</Label>
                {description && <p className="text-3xs text-muted-foreground">{description}</p>}
            </div>

            {described.map((prop) => {
                const current = value?.[prop.name];
                const missingRequired = prop.required && (current === undefined || current === "");
                const iconBroken =
                    prop.suggest === "icon" &&
                    typeof current === "string" &&
                    current !== "" &&
                    !resolveIcon(current);

                return (
                    <div key={prop.name} className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                            <Label className="font-mono text-2xs">{prop.name}</Label>
                            {prop.required && (
                                <Badge
                                    variant={missingRequired ? "destructive" : "outline"}
                                    className="px-1 text-3xs"
                                >
                                    required
                                </Badge>
                            )}
                        </div>
                        {renderControl(prop)}
                        {prop.docs && <p className="text-3xs text-muted-foreground">{prop.docs}</p>}
                        {iconBroken && (
                            <p className="flex items-start gap-1 text-3xs text-destructive">
                                <IconAlertTriangle className="mt-px size-3 shrink-0" />
                                <span>
                                    <code>{String(current)}</code> does not resolve to a Tabler icon
                                    — it will be dropped at render time.
                                </span>
                            </p>
                        )}
                    </div>
                );
            })}

            <JsonPropsEditor
                label="Other (JSON)"
                rows={3}
                value={extras}
                onChange={setExtras}
                description="Keys this widget has no description for. Kept verbatim."
            />
        </div>
    );
}
