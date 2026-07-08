import {useEffect, useRef, useState} from "react";
import {compose} from "redux";
import {X, CalendarIcon} from "lucide-react";
import {format, isValid, parse} from "date-fns";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Calendar} from "@coreModule/components/ui/calendar.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import {SimpleSelect} from "@coreModule/components/custom/simpleSelect";
import {ApiSelect} from "@coreModule/components/custom/apiSelect";
import {cn} from "@coreModule/components/lib/utils.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators";
import type {FilterGroup, FilterOperator, FilterRule, FilterValue} from "armonia/src/modules/core/database/filter";
import {generateUUID} from "@coreModule/helpers/general";

export type QuickFilterDef = {
    field: string;
    label: string;
    type: COLUMN_TYPE;
    operator?: FilterOperator;
    placeholder?: string;
    enumValues?: Array<{value: string; label: string}>;
    apiUrl?: string;
    postBodyKeys?: string[];
};

type QuickFilterBarProps = WithLanguageType & {
    defs: QuickFilterDef[];
    values: Record<string, FilterValue | null>;
    onChange: (field: string, value: FilterValue | null) => void;
    onClearAll: () => void;
    extraParams?: Record<string, unknown>;
};

function defaultOperator(type: COLUMN_TYPE): FilterOperator {
    if (type === COLUMN_TYPE.STRING) return "contains";
    return "equals";
}

function hasActiveValue(v: FilterValue | null | undefined): boolean {
    if (v == null) return false;
    if (typeof v === "string") return v.trim() !== "";
    if (Array.isArray(v)) return v.length > 0;
    return true;
}

export function buildQuickFilterDSL(
    defs: QuickFilterDef[],
    values: Record<string, FilterValue | null>,
): FilterGroup | undefined {
    const rules: FilterRule[] = [];
    for (const def of defs) {
        const val = values[def.field];
        if (!hasActiveValue(val)) continue;
        rules.push({
            id: generateUUID(),
            field: def.field,
            operator: def.operator ?? defaultOperator(def.type),
            value: val as FilterValue,
        });
    }
    if (rules.length === 0) return undefined;
    return {id: generateUUID(), operator: "and", rules, groups: []};
}

// ---------------------------------------------------------------------------
// Individual input types
// ---------------------------------------------------------------------------

type QuickFilterInputProps = {
    def: QuickFilterDef;
    value: FilterValue | null;
    onChange: (value: FilterValue | null) => void;
    extraParams?: Record<string, unknown>;
    resolveLanguageKey: WithLanguageType["resolveLanguageKey"];
};

function TextOrNumberInput({def, value, onChange}: QuickFilterInputProps) {
    const isNumber = def.type === COLUMN_TYPE.NUMBER || def.type === COLUMN_TYPE.PERCENTAGE;
    const [local, setLocal] = useState<string>(value != null ? String(value) : "");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setLocal(value != null ? String(value) : "");
    }, [value]);

    const handleChange = (raw: string) => {
        setLocal(raw);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            if (raw.trim() === "") {
                onChange(null);
            } else {
                onChange(isNumber ? Number(raw) : raw);
            }
        }, 300);
    };

    return (
        <Input
            type={isNumber ? "number" : "text"}
            value={local}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={def.placeholder ?? def.label}
            className="h-8 text-sm min-w-[140px] max-w-[200px]"
        />
    );
}

function DateInput({def, value, onChange}: QuickFilterInputProps) {
    const strVal = typeof value === "string" ? value : "";
    const dateFromStr = (s: string) => (!s ? undefined : parse(s, "yyyy-MM-dd", new Date()));
    const selectedDate = strVal ? dateFromStr(strVal) : undefined;
    const displayText =
        strVal && selectedDate && isValid(selectedDate) ? format(selectedDate, "PPP") : null;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    className={cn(
                        "h-8 min-w-[140px] max-w-[200px] justify-start text-left font-normal text-sm",
                        !displayText && "text-muted-foreground",
                    )}
                >
                    <CalendarIcon className="mr-2 size-3.5 shrink-0" />
                    <span className="truncate">{displayText ?? (def.placeholder ?? def.label)}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : null)}
                    captionLayout="dropdown"
                />
            </PopoverContent>
        </Popover>
    );
}

function EnumInput({def, value, onChange}: QuickFilterInputProps) {
    return (
        <SimpleSelect
            options={def.enumValues ?? []}
            value={typeof value === "string" ? value : ""}
            onValueChange={(v: string | string[] | undefined) => onChange((v as string) || null)}
            placeholder={def.placeholder ?? def.label}
            className="h-8 text-sm min-w-[140px] max-w-[200px]"
        />
    );
}

function BooleanInput({def, value, onChange, resolveLanguageKey}: QuickFilterInputProps) {
    const boolOptions = [
        {value: "true", label: String(resolveLanguageKey("yes"))},
        {value: "false", label: String(resolveLanguageKey("no"))},
    ];
    const boolVal = value === true ? "true" : value === false ? "false" : "";
    return (
        <SimpleSelect
            options={boolOptions}
            value={boolVal}
            onValueChange={(v: string | string[] | undefined) => {
                if (!v) return onChange(null);
                onChange(v === "true");
            }}
            placeholder={def.placeholder ?? def.label}
            className="h-8 text-sm min-w-[120px] max-w-[160px]"
        />
    );
}

function ObjectIdInput({def, value, onChange, extraParams}: QuickFilterInputProps) {
    if (!def.apiUrl) return null;
    const postBody = Object.fromEntries(
        (def.postBodyKeys ?? []).map((k) => [k, extraParams?.[k]]),
    );
    const strVal = typeof value === "string" ? value : undefined;
    return (
        <ApiSelect
            apiUrl={def.apiUrl}
            postBody={postBody}
            value={strVal}
            onValueChange={(v: string | string[] | undefined) =>
                onChange((typeof v === "string" ? v : null) as FilterValue | null)
            }
            placeholder={def.placeholder ?? def.label}
            className="h-8 text-sm min-w-[140px] max-w-[220px]"
            pageSize={50}
        />
    );
}

function QuickFilterInput(props: QuickFilterInputProps) {
    switch (props.def.type) {
        case COLUMN_TYPE.NUMBER:
        case COLUMN_TYPE.PERCENTAGE:
        case COLUMN_TYPE.STRING:
            return <TextOrNumberInput {...props} />;
        case COLUMN_TYPE.DATE:
        case COLUMN_TYPE.DATETIME:
            return <DateInput {...props} />;
        case COLUMN_TYPE.ENUM:
            return <EnumInput {...props} />;
        case COLUMN_TYPE.BOOLEAN:
            return <BooleanInput {...props} />;
        case COLUMN_TYPE.OBJECT_ID:
            return <ObjectIdInput {...props} />;
        default:
            return <TextOrNumberInput {...props} />;
    }
}

// ---------------------------------------------------------------------------
// QuickFilterBar
// ---------------------------------------------------------------------------

function QuickFilterBar({
    defs,
    values,
    onChange,
    onClearAll,
    extraParams,
    resolveLanguageKey,
}: QuickFilterBarProps) {
    const anyActive = defs.some((d) => hasActiveValue(values[d.field]));

    return (
        <div className="flex items-center gap-2 flex-wrap pb-1">
            {defs.map((def) => {
                const active = hasActiveValue(values[def.field]);
                return (
                    <div key={def.field} className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground shrink-0">{def.label}</span>
                        <div className={cn("relative flex items-center", active && "ring-1 ring-primary/30 rounded-md")}>
                            <QuickFilterInput
                                def={def}
                                value={values[def.field] ?? null}
                                onChange={(v) => onChange(def.field, v)}
                                extraParams={extraParams}
                                resolveLanguageKey={resolveLanguageKey}
                            />
                            {active && (
                                <button
                                    type="button"
                                    onClick={() => onChange(def.field, null)}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label={String(resolveLanguageKey("clear"))}
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
            {anyActive && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                    <X className="size-3.5 mr-1" />
                    {String(resolveLanguageKey("clearFilters"))}
                </Button>
            )}
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/components/entityPage/quickFilterBar.tsx"),
)(QuickFilterBar);
