import {GitBranch, Plus, Trash2} from "lucide-react";
import {Button} from "@coreModule/components/ui/button.tsx";
import FilterRuleComponent from "./filterRule.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";
import type { FilterGroup as FilterGroupType, FilterFieldConfig, FilterRule } from "armonia/src/modules/core/database/filter";
import {compose} from "redux";
import withLanguage, {TranslationValue, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
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

function OperatorSegment({
    value,
    onChange,
    resolveLanguageKey,
}: {
    value: "and" | "or";
    onChange: (next: "and" | "or") => void;
    resolveLanguageKey: FilterGroupProps["resolveLanguageKey"];
}) {
    return (
        <div
            role="radiogroup"
            aria-label={String(resolveLanguageKey("matchMode"))}
            className="inline-flex items-center rounded-md border border-border bg-background p-0.5 shadow-xs"
        >
            <button
                type="button"
                role="radio"
                aria-checked={value === "and"}
                aria-label={String(resolveLanguageKey("matchAll"))}
                onClick={() => onChange("and")}
                className={cn(
                    "h-6 rounded-[5px] px-2 text-xs font-medium transition-colors",
                    value === "and"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                )}
            >
                {resolveLanguageKey("matchAllShort")}
            </button>
            <button
                type="button"
                role="radio"
                aria-checked={value === "or"}
                aria-label={String(resolveLanguageKey("matchAny"))}
                onClick={() => onChange("or")}
                className={cn(
                    "h-6 rounded-[5px] px-2 text-xs font-medium transition-colors",
                    value === "or"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                )}
            >
                {resolveLanguageKey("matchAnyShort")}
            </button>
        </div>
    );
}

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
            aria-label={depth > 0 ? String(resolveLanguageKey("filterGroup")) : undefined}
            className={cn(
                "flex flex-col gap-y-2",
                depth > 0 && "border border-l-4 border-l-primary/25 rounded-md bg-muted/5 p-3 my-2"
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
                    <span>{resolveLanguageKey("matchPrefix")}</span>
                    <OperatorSegment
                        value={group.operator}
                        onChange={(next) => onUpdateGroupOperator(group.id, next)}
                        resolveLanguageKey={resolveLanguageKey}
                    />
                    <span>{resolveLanguageKey("matchSuffix")}</span>
                </div>

                {depth > 0 && (
                    <TooltipDisplayer tooltip={resolveLanguageKey("removeGroup")}>
                        <Button
                            variant="ghost"
                            size="sm"
                            aria-label={String(resolveLanguageKey("removeGroup"))}
                            onClick={() => parentId != null && onRemoveGroup(parentId, group.id)}
                            className="h-7 w-7 shrink-0 px-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </TooltipDisplayer>
                )}
            </div>

            <div className="flex flex-col gap-y-2">
                {group.rules.map((rule: FilterRule, index: number) => (
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
                ))}

                {group.groups.map((child: FilterGroupType) => (
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
                        resolveLanguageKey={resolveLanguageKey}
                        currentLanguage={null}
                        languageCode={""}
                        fieldsLanguage={fieldsLanguage}
                    />
                ))}

                <div className={cn("flex items-center gap-x-1", group.rules.length > 0 || group.groups.length > 0 ? "mt-1" : "")}>
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

                    {!!onAddGroup && depth === 0 && depth < MAX_DEPTH && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-label={String(resolveLanguageKey("addGroup"))}
                            className="text-muted-foreground"
                            onClick={() => onAddGroup(group.id)}
                        >
                            <GitBranch className="size-4" />
                            {resolveLanguageKey("addGroup")}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/filterBuilder/filterGroup.tsx")
)(FilterGroup)
