import {GitBranch, Plus, Trash2} from "lucide-react";
import {Button} from "@coreModule/components/ui/button.tsx";
import FilterRuleComponent from "./filterRule.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";
import type { FilterGroup as FilterGroupType, FilterFieldConfig } from "armonia/src/modules/core/database/filter";
import {compose} from "redux";
import withLanguage, {TranslationValue, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {ButtonGroup} from "@coreModule/components/ui/button-group.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";

const MAX_DEPTH = 5;

type FilterGroupProps = WithLanguageType & {
    group: FilterGroupType;
    parentId: string | null;
    depth: number;
    fields: FilterFieldConfig[];
    onAddRule: (groupId: string) => void;
    onRemoveRule: (groupId: string, ruleId: string) => void;
    onUpdateRule: (groupId: string, ruleId: string, patch: Record<string, unknown>) => void;
    onAddGroup: (parentId: string) => void;
    onRemoveGroup: (parentId: string, groupId: string) => void;
    onUpdateGroupOperator: (groupId: string, operator: "and" | "or") => void;
    fieldsLanguage: TranslationValue;
};

export function FilterGroup({
    group,
    parentId,
    depth,
    fields,
    onAddRule,
    onRemoveRule,
    onUpdateRule,
    onAddGroup,
    onRemoveGroup,
    onUpdateGroupOperator,
    resolveLanguageKey,
    fieldsLanguage
}: FilterGroupProps) {

    return (
        <div
            role="group"
            aria-label={depth > 0 ? (resolveLanguageKey("filterGroup")) : undefined}
            className={cn(
                "space-y-2",
                depth > 0 && "border border-l-6 rounded-md bg-muted/5 p-3 my-2"
            )}
        >

            {/*pl-2.5 border-l-2 border-muted-foreground/25 rounded-r bg-muted/5  p-3 rounded-md my-4*/}

            <div className={cn("flex items-center justify-between", {"mb-6": depth === 0})}>
                <ButtonGroup>
                    <Button
                        size="sm"
                        variant={group.operator === "and" ? "default" : "outline"}
                        onClick={() => onUpdateGroupOperator(group.id, "and")}
                    >
                        {resolveLanguageKey("matchAll")}
                    </Button>
                    <Button
                        size="sm"
                        variant={group.operator === "or" ? "default" : "outline"}
                        onClick={() => onUpdateGroupOperator(group.id, "or")}
                    >
                        {resolveLanguageKey("matchAny")}
                    </Button>
                </ButtonGroup>

                {
                    depth > 0 &&
                    <div>
                        <TooltipDisplayer tooltip={resolveLanguageKey("removeGroup")}>
                            <Button
                                variant="ghost"
                                size={"sm"}
                                aria-label={resolveLanguageKey("removeGroup")}
                                onClick={() => parentId != null && onRemoveGroup(parentId, group.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive hover:border hover:border-destructive/30"
                            >
                                <Trash2 className="size-4" />
                                {/*<ButtonTitle hideMobile={true}>*/}
                                {/*{resolveLanguageKey("removeGroup")}*/}
                                {/*</ButtonTitle>*/}
                            </Button>
                        </TooltipDisplayer>
                    </div>
                }
            </div>

            <div className="space-y-2 ">

                {
                    group.rules.map((rule: import("armonia/src/modules/core/database/filter").FilterRule, index: number) => {
                        return (
                            <FilterRuleComponent
                                key={rule.id}
                                index={index}
                                rule={rule}
                                groupId={group.id}
                                fieldsLanguage={fieldsLanguage}
                                fields={fields}
                                onUpdate={onUpdateRule}
                                onRemove={onRemoveRule}
                            />
                        )
                    })
                }

                {
                    group.groups.map((child: FilterGroupType) => {
                        return (
                            <FilterGroup
                                key={child.id}
                                group={child}
                                parentId={group.id}
                                depth={depth + 1}
                                fields={fields}
                                onAddRule={onAddRule}
                                onRemoveRule={onRemoveRule}
                                onUpdateRule={onUpdateRule}
                                onAddGroup={onAddGroup}
                                onRemoveGroup={onRemoveGroup}
                                onUpdateGroupOperator={onUpdateGroupOperator}
                                resolveLanguageKey={resolveLanguageKey} currentLanguage={null} languageCode={""}
                                fieldsLanguage={fieldsLanguage}
                            />
                        )
                    })
                }

                <div className={cn("flex items-center space-x-1", {"mt-6": depth === 0})}>
                    <div className="flex-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex grow w-full rounded-md"
                            onClick={() => onAddRule(group.id)}
                        >
                            <Plus className="size-4" />
                            {resolveLanguageKey("newRule")}
                        </Button>
                    </div>

                    {
                        !!onAddGroup && depth === 0 && depth < MAX_DEPTH &&
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-label={resolveLanguageKey("addGroup")}
                            className="text-muted-foreground"
                            onClick={() => onAddGroup(group.id)}
                        >
                            <GitBranch className="size-4" />
                            {resolveLanguageKey("addGroup")}
                        </Button>
                    }
                </div>

            </div>

        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/filterBuilder/filterGroup.tsx")
)(FilterGroup)
