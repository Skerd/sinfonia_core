import {useEffect, useId, useMemo, useRef, useState} from "react";
import {compose} from "redux";
import {X, CalendarIcon} from "lucide-react";
import {format, isValid, parse} from "date-fns";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Calendar} from "@coreModule/components/ui/calendar.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import {SimpleSelect} from "@coreModule/components/viewEngine/widgets/inputs/simpleSelect.tsx";
import {ApiSelect} from "@coreModule/components/viewEngine/widgets/inputs/apiSelect/apiSelect.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators.ts";
import type {FilterGroup, FilterOperator, FilterRule, FilterValue} from "armonia/src/modules/core/database/filter";
import {generateUUID} from "@coreModule/helpers/general/uuid.ts";

export type QuickFilterDef = {
    field: string;
    label: string;
    type: COLUMN_TYPE;
    operator?: FilterOperator;
    placeholder?: string;
    enumValues?: Array<{value: string; label: string}>;
    apiUrl?: string;
    postBodyKeys?: string[];
    /**
     * Filter select options by one or more other quick-filter fields.
     * Active parents are combined with AND (e.g. floor → edifice and/or project).
     */
    dependsOn?: string | string[];
    /**
     * When true, the value is sent as a list `extraParam` instead of a DSL filter rule.
     * Use for fields that are not on the collection (e.g. project on inspections).
     */
    asExtraParam?: boolean;
};

function dependsOnFields(def: QuickFilterDef): string[] {
    if (!def.dependsOn) return [];
    return Array.isArray(def.dependsOn) ? def.dependsOn : [def.dependsOn];
}

/** Fields that cascade off `field` (direct + transitive), for clearing on parent change. */
export function collectDependentQuickFilterFields(defs: QuickFilterDef[], field: string): string[] {
    const result: string[] = [];
    let frontier = [field];
    while (frontier.length) {
        const next: string[] = [];
        for (const d of defs) {
            const parents = dependsOnFields(d);
            if (parents.some((p) => frontier.includes(p)) && !result.includes(d.field)) {
                result.push(d.field);
                next.push(d.field);
            }
        }
        frontier = next;
    }
    return result;
}

type QuickFilterBarProps = WithLanguageType & {
    defs: QuickFilterDef[];
    values: Record<string, FilterValue | null>;
    /** Cached ObjectId labels from `qf_<field>_label` (skip select hydrate). */
    labels?: Record<string, string | null>;
    onChange: (field: string, value: FilterValue | null, label?: string | null) => void;
    onClearAll: () => void;
    extraParams?: Record<string, unknown>;
};

function defaultOperator(type: COLUMN_TYPE): FilterOperator {
    if (type === COLUMN_TYPE.STRING || type === COLUMN_TYPE.ARRAY) return "contains";
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
        if (def.asExtraParam) continue;
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

/** Active asExtraParam quick-filter values for the list request body. */
export function buildQuickFilterExtraParams(
    defs: QuickFilterDef[],
    values: Record<string, FilterValue | null>,
): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const def of defs) {
        if (!def.asExtraParam) continue;
        const val = values[def.field];
        if (!hasActiveValue(val)) continue;
        out[def.field] = val;
    }
    return out;
}

// ---------------------------------------------------------------------------
// Individual input types
// ---------------------------------------------------------------------------

const TEXT_DEBOUNCE_MS = 300;
const FIELD_WIDTH = "h-8 text-sm min-w-[140px] max-w-[200px] max-md:w-full max-md:max-w-none";
/** Room for the bar's own clear button, which sits over the right edge of text/date inputs. */
const CLEARABLE_PADDING = "pr-7";

/** Types whose control already renders its own clear affordance (SimpleSelect / ApiSelect). */
const SELF_CLEARING_TYPES = new Set<COLUMN_TYPE>([COLUMN_TYPE.ENUM, COLUMN_TYPE.BOOLEAN, COLUMN_TYPE.OBJECT_ID]);

type QuickFilterInputProps = {
    id: string;
    def: QuickFilterDef;
    value: FilterValue | null;
    label?: string | null;
    onChange: (value: FilterValue | null, label?: string | null) => void;
    values: Record<string, FilterValue | null>;
    extraParams?: Record<string, unknown>;
    resolveLanguageKey: WithLanguageType["resolveLanguageKey"];
};

function TextOrNumberInput({id, def, value, onChange}: QuickFilterInputProps) {
    const isNumber = def.type === COLUMN_TYPE.NUMBER || def.type === COLUMN_TYPE.PERCENTAGE;
    const [local, setLocal] = useState<string>(value != null ? String(value) : "");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelPending = () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
    };

    // An outside change (clear button, "clear filters", URL navigation) wins over a
    // pending keystroke — otherwise the debounced value would re-apply the old filter.
    useEffect(() => {
        cancelPending();
        setLocal(value != null ? String(value) : "");
    }, [value]);

    useEffect(() => cancelPending, []);

    const handleChange = (raw: string) => {
        setLocal(raw);
        cancelPending();
        timer.current = setTimeout(() => {
            timer.current = null;
            const trimmed = raw.trim();
            if (trimmed === "") return onChange(null);
            if (!isNumber) return onChange(raw);
            // Skip partial input such as "-" or "1e" instead of filtering by NaN.
            const num = Number(trimmed);
            if (Number.isFinite(num)) onChange(num);
        }, TEXT_DEBOUNCE_MS);
    };

    return (
        <Input
            id={id}
            type={isNumber ? "number" : "text"}
            inputMode={isNumber ? "decimal" : undefined}
            value={local}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={def.placeholder ?? def.label}
            className={cn(FIELD_WIDTH, local !== "" && CLEARABLE_PADDING)}
        />
    );
}

const parseIsoDate = (s: string) => {
    const d = parse(s, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : undefined;
};

function DateInput({id, def, value, onChange}: QuickFilterInputProps) {
    const [open, setOpen] = useState(false);
    const selectedDate = typeof value === "string" && value ? parseIsoDate(value) : undefined;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    size="sm"
                    type="button"
                    className={cn(
                        FIELD_WIDTH,
                        "justify-start text-left font-normal",
                        selectedDate ? CLEARABLE_PADDING : "text-muted-foreground",
                    )}
                >
                    <CalendarIcon className="mr-2 size-3.5 shrink-0" />
                    <span className="truncate">
                        {selectedDate ? format(selectedDate, "PPP") : (def.placeholder ?? def.label)}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    defaultMonth={selectedDate}
                    onSelect={(d) => {
                        onChange(d ? format(d, "yyyy-MM-dd") : null);
                        setOpen(false);
                    }}
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
            className={FIELD_WIDTH}
        />
    );
}

function BooleanInput({def, value, onChange, resolveLanguageKey}: QuickFilterInputProps) {
    const boolOptions = useMemo(() => [
        {value: "true", label: String(resolveLanguageKey("yes"))},
        {value: "false", label: String(resolveLanguageKey("no"))},
    ], [resolveLanguageKey]);
    const boolVal = value === true ? "true" : value === false ? "false" : "";
    return (
        <SimpleSelect
            options={boolOptions}
            value={boolVal}
            onValueChange={(v: string | string[] | undefined) => onChange(v ? v === "true" : null)}
            placeholder={def.placeholder ?? def.label}
            className="h-8 text-sm min-w-[120px] max-w-[160px] max-md:w-full max-md:max-w-none"
        />
    );
}

function ObjectIdInput({def, value, label, onChange, values, extraParams}: QuickFilterInputProps) {
    const parentFields = dependsOnFields(def);
    const activeParents = parentFields
        .map((field) => {
            const raw = values[field] ?? null;
            if (!hasActiveValue(raw) || raw == null) return null;
            return {field, value: String(raw)};
        })
        .filter((p): p is {field: string; value: string} => p != null);
    const remountKey = activeParents.map((p) => `${p.field}:${p.value}`).join("|") || "none";

    const postBody = useMemo(() => {
        const base = Object.fromEntries(
            (def.postBodyKeys ?? []).map((k) => [k, extraParams?.[k]]),
        );
        if (activeParents.length === 0) {
            return Object.keys(base).length ? base : undefined;
        }
        return {
            ...base,
            filters: {
                id: `qf-${def.field}-deps`,
                operator: "and" as const,
                rules: activeParents.map((p) => ({
                    id: `qf-${def.field}-dep-${p.field}`,
                    field: p.field,
                    operator: "equals" as const,
                    value: p.value,
                })),
                groups: [],
            },
        };
        // remountKey encodes active parent field/value pairs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [def.field, def.postBodyKeys, extraParams, remountKey]);

    const strVal = typeof value === "string" ? value : undefined;
    const cachedLabel = label != null && label !== "" ? label : undefined;
    const defaultOptions = useMemo(
        () => (strVal && cachedLabel ? [{value: strVal, label: cachedLabel}] : []),
        [strVal, cachedLabel],
    );

    if (!def.apiUrl) return null;

    return (
        <ApiSelect
            key={`${def.field}-${remountKey}`}
            apiUrl={def.apiUrl}
            postBody={postBody}
            value={strVal}
            defaultOptions={defaultOptions}
            onValueChange={(v: string | string[] | undefined, nextLabel?: string | string[]) => {
                const next = typeof v === "string" && v !== "" ? v : null;
                const resolvedLabel =
                    typeof nextLabel === "string" && nextLabel !== "" ? nextLabel : null;
                // Same id: only persist a newly resolved label (no dependent clears).
                if (next === (strVal ?? null)) {
                    if (next && resolvedLabel && resolvedLabel !== cachedLabel) {
                        onChange(next, resolvedLabel);
                    }
                    return;
                }
                onChange(next as FilterValue | null, resolvedLabel);
            }}
            placeholder={def.placeholder ?? def.label}
            className={cn(FIELD_WIDTH, "max-w-[220px]")}
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
    labels,
    onChange,
    onClearAll,
    extraParams,
    resolveLanguageKey,
}: QuickFilterBarProps) {
    const idPrefix = useId();
    const anyActive = defs.some((d) => hasActiveValue(values[d.field]));

    return (
        <div
            role="group"
            aria-label={String(resolveLanguageKey("groupLabel"))}
            className="flex flex-col items-stretch gap-2 pb-1 md:flex-row md:flex-wrap md:items-end"
        >
            {defs.map((def) => {
                const active = hasActiveValue(values[def.field]);
                const inputId = `${idPrefix}-${def.field}`;
                return (
                    <div key={def.field} className="flex flex-col gap-2 min-w-0 max-md:w-full">
                        <label htmlFor={inputId} className="text-xs text-muted-foreground leading-none">
                            {def.label}
                        </label>
                        <div className={cn("relative flex items-center max-md:w-full", active && "ring-1 ring-primary/30 rounded-md")}>
                            <QuickFilterInput
                                id={inputId}
                                def={def}
                                value={values[def.field] ?? null}
                                label={labels?.[def.field] ?? null}
                                onChange={(v, lbl) => onChange(def.field, v, lbl)}
                                values={values}
                                extraParams={extraParams}
                                resolveLanguageKey={resolveLanguageKey}
                            />
                            {active && !SELF_CLEARING_TYPES.has(def.type) && (
                                <button
                                    type="button"
                                    onClick={() => onChange(def.field, null, null)}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
                                    aria-label={`${String(resolveLanguageKey("clear"))} ${def.label}`}
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
