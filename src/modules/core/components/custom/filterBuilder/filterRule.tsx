import {Trash2} from "lucide-react";
import {Button} from "@coreModule/components/ui/button.tsx";
import { SimpleSelect } from "@coreModule/components/custom/simpleSelect";
import type { FilterRule as FilterRuleType, FilterFieldConfig } from "armonia/src/modules/core/database/filter";
import {compose} from "redux";
import withLanguage, {TranslationValue, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {findFromLanguage} from "@coreModule/helpers/general";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import FilterValueInput from "@coreModule/components/custom/filterBuilder/filterValueInput.tsx";

type FilterRuleProps = WithLanguageType & {
    rule: FilterRuleType;
    groupId: string;
    index: number;
    fields: FilterFieldConfig[];
    onUpdate: (groupId: string, ruleId: string, patch: Partial<FilterRuleType>) => void;
    onRemove: (groupId: string, ruleId: string) => void;
    fieldsLanguage: TranslationValue;
};

export function FilterRuleComponent({
    rule,
    groupId,
    fields,
    onUpdate,
    onRemove,
    resolveLanguageKey,
    fieldsLanguage
}: FilterRuleProps) {

    const fieldConfig = fields.find((f) => f.path === rule.field);
    const hasField = Boolean(rule.field);
    const showValue = Boolean(fieldConfig && rule.operator);

    return (
        <div
            role="group"
            aria-label={resolveLanguageKey("filterRule")}
            className="flex items-center gap-2 w-full min-w-0 rounded-md border border-border bg-muted/5 px-2 py-1.5"
        >
            {/*
              Progressive widths:
              - no field → field 100%
              - field only → field + operator 50/50
              - field + operator → field + operator + value 33/33/33
            */}
            <div className={cn("min-w-0", showValue || hasField ? "flex-1 basis-0" : "w-full flex-1")}>
                <SimpleSelect
                    options={fields.map((f) => ({
                        value: f.path,
                        label: findFromLanguage(fieldsLanguage, f.path) ?? f.label ?? f.path,
                    }))}
                    value={rule.field}
                    onValueChange={(v: string | string[] | undefined) => {
                        const path = (v ?? "") as string;
                        const nextField = fields.find((f) => f.path === path);
                        const operators = nextField?.operators ?? [];
                        const operator = (
                            operators.includes("equals")
                                ? "equals"
                                : (operators[0] ?? "equals")
                        ) as FilterRuleType["operator"];
                        onUpdate(groupId, rule.id, {
                            field: path,
                            operator,
                            value: operator === "exists" ? true : null,
                        });
                    }}
                    placeholder={resolveLanguageKey("filterField")}
                    className="h-8 text-sm w-full min-w-0"
                />
            </div>

            {hasField && (
                <div className="min-w-0 flex-1 basis-0">
                    <SimpleSelect
                        options={(fieldConfig?.operators ?? []).map((op: string) => ({
                            value: op,
                            label: (resolveLanguageKey(`operators.${op}`)) ?? op,
                        }))}
                        value={rule.operator || undefined}
                        onValueChange={(v: string | string[] | undefined) => {
                            const operator = (v ?? "") as FilterRuleType["operator"];
                            onUpdate(groupId, rule.id, {
                                operator,
                                value: operator === "exists" ? true : null,
                            });
                        }}
                        placeholder={resolveLanguageKey("filterOperator")}
                        className="h-8 text-sm w-full min-w-0"
                    />
                </div>
            )}

            {showValue && (
                <div className="min-w-0 flex-1 basis-0">
                    <FilterValueInput
                        fieldConfig={fieldConfig}
                        operator={rule.operator}
                        value={rule.value}
                        onChange={(v: any) => onUpdate(groupId, rule.id, { value: v })}
                        resolveLanguageKey={resolveLanguageKey}
                    />
                </div>
            )}

            {!!onRemove && (
                <TooltipDisplayer tooltip={resolveLanguageKey("removeFilter")}>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={resolveLanguageKey("removeFilter")}
                        onClick={() => onRemove(groupId, rule.id)}
                        className="h-8 w-8 shrink-0 px-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </TooltipDisplayer>
            )}
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/filterBuilder/filterRule.tsx")
)(FilterRuleComponent)
