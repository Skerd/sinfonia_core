import {Trash2, ChevronUp, ChevronDown} from "lucide-react";
import {Button} from "@coreModule/components/ui/button.tsx";
import { SimpleSelect } from "@coreModule/components/custom/simpleSelect";
import type { FilterRule as FilterRuleType, FilterFieldConfig } from "armonia/src/modules/core/database/filter";
import {compose} from "redux";
import withLanguage, {TranslationValue, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@coreModule/components/ui/collapsible.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {useState} from "react";
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
    index,
    fields,
    onUpdate,
    onRemove,
    resolveLanguageKey,
    fieldsLanguage
}: FilterRuleProps) {

    const [open, setOpen] = useState(true);
    const fieldConfig = fields.find((f) => f.path === rule.field);

    return (
        <>
            <Collapsible
                open={open}
                onOpenChange={setOpen}
            >
                <CollapsibleTrigger asChild>
                    <div className={`${open ? "border-b-0 rounded-b-none" : ""} hover:cursor-pointer space-y-0 px-3 py-1 border rounded-md`}>
                        <div className="flex items-center">
                            <div className='flex-none grow'>
                                <h3 className={cn('flex items-center space-x-1.5 text-md font-medium')}>
                                    {resolveLanguageKey("rule")} {index + 1}
                                </h3>
                            </div>
                            {
                                !!onRemove &&
                                <TooltipDisplayer tooltip={resolveLanguageKey("removeFilter")}>
                                    <Button
                                        variant="ghost"
                                        size={"sm"}
                                        aria-label={resolveLanguageKey("removeFilter")}
                                        onClick={() => onRemove(groupId, rule.id)}
                                        className="text-destructive hover:text-destructive hover:bg-destructive hover:border hover:border-destructive/30"
                                    >
                                        <Trash2 className="size-4" />
                                        {/*<ButtonTitle hideMobile={true}>*/}
                                        {/*    {resolveLanguageKey("removeFilter")}*/}
                                        {/*</ButtonTitle>*/}
                                    </Button>
                                </TooltipDisplayer>
                            }
                            <Button type={"button"} className="" variant="ghost" size="icon-sm">
                                {
                                    open ?
                                    <ChevronUp className={cn("h-4 w-4")} />
                                    :
                                    <ChevronDown className={cn("h-4 w-4")} />
                                }
                            </Button>
                        </div>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="pt-1 px-2 pb-2 rounded-md rounded-t-none border border-t-0">
                        <div className="border-s-2 border-dashed border-primary/15 ps-1 md:ps-2">
                            <div className="space-y-2 py-2 rounded-md px-2 border border-dashed border-border bg-muted/5">
                                <div
                                    role="group"
                                    aria-label={resolveLanguageKey("filterRule")}
                                    className="flex flex-col items-center space-y-2 rounded-md min-w-0 group/rule hover:border-border/70"
                                >
                                    <div className="flex space-x-2 w-full">
                                        <SimpleSelect
                                            options={fields.map((f) => ({ value: f.path, label: findFromLanguage(fieldsLanguage, f.path) ?? f.label ?? f.path }))}
                                            value={rule.field}
                                            onValueChange={(v: string | string[] | undefined) => onUpdate(groupId, rule.id, { field: (v ?? "") as string, operator: "equals", value: null })}
                                            placeholder={resolveLanguageKey("filterField")}
                                        />
                                        {
                                            fieldConfig?.operators &&
                                            <SimpleSelect
                                                options={(fieldConfig?.operators)?.map((op: string) => ({
                                                    value: op,
                                                    label: (resolveLanguageKey(`operators.${op}`)) ?? op,
                                                }))}
                                                value={rule.operator}
                                                onValueChange={(v: string | string[] | undefined) => onUpdate(groupId, rule.id, { operator: (v ?? "equals") as FilterRuleType["operator"] })}
                                                placeholder={resolveLanguageKey("filterOperator")}
                                            />
                                        }
                                    </div>

                                    {
                                        fieldConfig && rule.operator &&
                                        <div className="flex-1 w-full">
                                            <FilterValueInput
                                                fieldConfig={fieldConfig}
                                                operator={rule.operator}
                                                value={rule.value}
                                                onChange={(v: any) => onUpdate(groupId, rule.id, { value: v })}
                                                resolveLanguageKey={resolveLanguageKey}
                                            />
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/filterBuilder/filterRule.tsx")
)(FilterRuleComponent)
