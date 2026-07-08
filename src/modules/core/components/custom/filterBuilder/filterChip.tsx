import { X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@coreModule/components/ui/popover.tsx";
import { SimpleSelect } from "@coreModule/components/custom/simpleSelect";
import FilterValueInput from "./filterValueInput.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";
import type { FilterRule, FilterFieldConfig } from "armonia/src/modules/core/database/filter";
import withLanguage, {ResolveLanguageKey, TranslationValue, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {findFromLanguage} from "@coreModule/helpers/general";
import { useFilterBuilder } from "./filterBuilderContext.tsx";

function formatChipValue(
    val: unknown,
    resolveLanguageKey: ResolveLanguageKey,
    fieldConfig: FilterFieldConfig | undefined,
    refLabels?: Record<string, string>
): string {
    if (val == null) return "";
    if (typeof val === "boolean") return val ? resolveLanguageKey("yes") : resolveLanguageKey("no");
    const isRefObjectId = fieldConfig?.type === "objectId" && !!fieldConfig.apiUrl;
    if (isRefObjectId && refLabels) {
        if (Array.isArray(val)) {
            return val.map((id) => (typeof id === "string" && refLabels[id] ? refLabels[id] : String(id))).join(", ");
        }
        if (typeof val === "string" && refLabels[val]) return refLabels[val];
    }
    if (Array.isArray(val)) {
        return val.join(", ");
    }
    return String(val);
}
function formatChipLabel(
    rule: FilterRule,
    fields: FilterFieldConfig[],
    resolveLanguageKey: ResolveLanguageKey,
    fieldsLanguage: TranslationValue,
    refLabelsByFieldPath: Record<string, Record<string, string>>
): string {
    const fc = fields.find((f) => f.path === rule.field);
    const label = findFromLanguage(fieldsLanguage, fc?.label ?? rule.field);
    if (rule.operator === "exists") return `${label} ${resolveLanguageKey(rule.value ? "exists" : "empty")}`;
    const refLabels = fc?.path ? refLabelsByFieldPath[fc.path] : undefined;
    const val = formatChipValue(rule.value, resolveLanguageKey, fc, refLabels);
    const needsQuotes = typeof rule.value === "string" || (Array.isArray(rule.value) && rule.value.every((v) => typeof v === "string"));
    return `${label} ${resolveLanguageKey(`chipOperators.${rule.operator}`)} ${val ? (needsQuotes ? `"${val}"` : val) : "?"}`;
}

type FilterChipProps = WithLanguageType & {
    rule: FilterRule;
    groupId: string;
    fields: FilterFieldConfig[];
    onUpdate: (groupId: string, ruleId: string, patch: Partial<FilterRule>) => void;
    onRemove: (groupId: string, ruleId: string) => void;
    fieldsLanguage: TranslationValue;
};

export function FilterChip({
    rule,
    groupId,
    fields,
    onUpdate,
    onRemove,
    resolveLanguageKey,
    fieldsLanguage,
}: FilterChipProps) {

    const fieldConfig = fields.find((f) => f.path === rule.field);
    const { refLabelsByFieldPath } = useFilterBuilder();

    return (
        <div className="inline-flex items-center rounded-md bg-secondary/50 border border-border/50 overflow-hidden shrink-0 h-6">
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            "px-2 py-0.5 text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors text-left h-full min-w-0  hover:cursor-pointer",
                            "focus:outline-none focus:ring-0"
                        )}
                    >
                        <span className="max-w-40 truncate">
                            {formatChipLabel(rule, fields, resolveLanguageKey, fieldsLanguage, refLabelsByFieldPath)}
                        </span>
                    </button>
                </PopoverTrigger>
                <PopoverContent align="start" sideOffset={4} className="w-[min(360px,calc(100vw-24px))] p-2.5 rounded-md" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-1.5">
                        <p className="text-[11px] font-medium text-muted-foreground">
                            {resolveLanguageKey("editFilter")}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <SimpleSelect
                                options={fields.map((f) => ({ value: f.path, label: findFromLanguage(fieldsLanguage, f.path) ?? f.label ?? f.path }))}
                                value={rule.field}
                                onValueChange={(v: any) =>
                                    onUpdate(groupId, rule.id, { field: (v ?? "") as string, operator: "equals", value: null })
                                }
                                placeholder={resolveLanguageKey("filterField")}
                                className="h-7 text-xs min-w-[90px]"
                            />
                            {
                                !!fieldConfig?.operators &&
                                <SimpleSelect
                                    options={fieldConfig?.operators.map((op: string) => ({
                                        value: op,
                                        label: (resolveLanguageKey(`operators.${op}`)) ?? op,
                                    }))}
                                    value={rule.operator}
                                    onValueChange={(v: any) =>
                                        onUpdate(groupId, rule.id, { operator: (v ?? "equals") as FilterRule["operator"] })
                                    }
                                    placeholder={resolveLanguageKey("filterOperator")}
                                    className="h-7 text-xs min-w-[72px]"
                                />
                            }

                            <FilterValueInput
                                fieldConfig={fieldConfig}
                                operator={rule.operator}
                                value={rule.value}
                                onChange={(v: any) => onUpdate(groupId, rule.id, { value: v })}
                                resolveLanguageKey={resolveLanguageKey}
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(groupId, rule.id);
                }}
                className="w-5 h-6 flex items-center justify-center shrink-0 hover:bg-destructive/15 hover:text-destructive transition-colors border-l border-border/50 hover:cursor-pointer"
                aria-label={resolveLanguageKey("removeFilter")}
            >
                <X className="size-3" />
            </button>
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/filterBuilder/filterChip.tsx")
)(FilterChip)
