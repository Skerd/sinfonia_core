import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {Button} from "@coreModule/components/ui/button.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@coreModule/components/ui/popover.tsx";
import {Search, Trash2} from "lucide-react";
import { FilterBuilderProvider, useFilterBuilder } from "./filterBuilderContext.tsx";
import FilterGroup from "./filterGroup.tsx";
import FilterChip from "./filterChip.tsx";
import { useFilterState } from "./useFilterState.ts";
import { cn } from "@coreModule/components/lib/utils.ts";
import type { FilterDSL, FilterRule, FilterFieldConfig } from "armonia/src/modules/core/database/filter";
import {
    decodeFilterFromUrl,
    encodeFilterToUrl,
    FILTER_URL_PARAM,
} from "@coreModule/helpers/filter/filterUrl.ts";
import {compose} from "redux";
import withLanguage, {TranslationValue, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";

type RuleWithGroup = { groupId: string; rule: FilterRule };

function collectRulesWithGroups(group: FilterDSL, fields: FilterFieldConfig[]): RuleWithGroup[] {
    const result: RuleWithGroup[] = [];
    for (const r of group.rules ?? []) {
        if (r.field && r.value != null) result.push({ groupId: group.id, rule: r });
    }
    for (const g of group.groups ?? []) {
        result.push(...collectRulesWithGroups(g, fields));
    }
    return result;
}

function countActiveRules(group: FilterDSL): number {
    const rules = group.rules?.filter((r) => r.field && r.value != null)?.length ?? 0;
    const nested = group.groups?.reduce((sum, g) => sum + countActiveRules(g), 0) ?? 0;
    return rules + nested;
}

type FilterBuilderProps = WithLanguageType & {
    resourceUrl: string;
    filters: Record<string, unknown>;
    setFilters: (filters: Record<string, unknown>) => void;
    extraParams?: Record<string, unknown>;
    /** When provided, use these filter fields instead of fetching. Enables single-request flow with table-config. */
    filterFields?: import("armonia/src/modules/core/database/filter").FilterFieldConfig[];
    configuration: {
        placeholder: string;
        fields: TranslationValue
    }
};

function FilterBuilderInner({
    filters,
    setFilters,
    extraParams,
    resolveLanguageKey,
    configuration
}: Omit<FilterBuilderProps, "resourceUrl">) {

    const { fields } = useFilterBuilder();
    const [searchParams, setSearchParams] = useSearchParams();

    const urlFilter = decodeFilterFromUrl(searchParams.get(FILTER_URL_PARAM));
    const initialFilter = (filters?.filter as FilterDSL | undefined) ?? urlFilter;

    const { root, addRule, removeRule, updateRule, addGroup, removeGroup, updateGroupOperator, reset, serialize } = useFilterState(initialFilter);

    const hasAppliedUrlFilter = useRef(false);
    useEffect(() => {
        if (urlFilter && !hasAppliedUrlFilter.current) {
            hasAppliedUrlFilter.current = true;
            setFilters({ ...extraParams, filter: urlFilter });
        }
    }, [urlFilter, setFilters, extraParams]);

    const activeCount = useMemo(() => countActiveRules(root), [root]);
    const rulesWithGroups = useMemo(() => collectRulesWithGroups(root, fields), [root, fields]);
    const [popoverOpen, setPopoverOpen] = useState(false);

    const onApply = useCallback(() => {
        const dsl = serialize();
        setFilters({ ...extraParams, ...(dsl ? { filter: dsl } : {}) });
        if (dsl) {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set(FILTER_URL_PARAM, encodeFilterToUrl(dsl));
                return next;
            }, { replace: true });
        } else {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete(FILTER_URL_PARAM);
                return next;
            }, { replace: true });
        }
        setPopoverOpen(false);
    }, [serialize, setFilters, extraParams, setSearchParams]);

    const onClear = useCallback(() => {
        reset();
        setFilters({ ...extraParams });
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete(FILTER_URL_PARAM);
            return next;
        }, { replace: true });
        setPopoverOpen(false);
    }, [reset, setFilters, extraParams, setSearchParams]);

    return (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
                <div
                    role="button"
                    tabIndex={0}
                    aria-label={configuration.placeholder}
                    aria-expanded={popoverOpen}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setPopoverOpen((prev) => !prev);
                        }
                    }}
                    className={cn(
                        "flex items-center w-full min-w-[280px] max-w-[560px] min-h-9 rounded-md border border-input bg-background pl-3 pr-1.5 py-1",
                        "hover:border-input/80 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-0 transition-colors text-left text-sm cursor-pointer",
                        activeCount > 0 && "border-primary/40 ring-1 ring-primary/10"
                    )}
                >
                    <Search className="size-4 shrink-0 text-muted-foreground mr-2.5" />
                    <div className="flex flex-1 min-w-0 items-center gap-1.5 overflow-x-auto scrollbar-none py-1.5">
                        {
                            rulesWithGroups.length > 0 ?
                            <>
                                {
                                    rulesWithGroups.map(({ groupId, rule }) => {
                                        return (
                                            <div key={rule.id} onClick={(e) => e.stopPropagation()}>
                                                <FilterChip
                                                    rule={rule}
                                                    groupId={groupId}
                                                    fields={fields}
                                                    fieldsLanguage={configuration.fields}
                                                    onUpdate={updateRule}
                                                    onRemove={removeRule}
                                                />
                                            </div>
                                        )
                                    })
                                }
                            </>
                            :
                            <span className="text-muted-foreground text-sm truncate">{configuration.placeholder}</span>
                        }
                    </div>
                    <div className="flex items-center shrink-0 gap-1 ml-1 border-l border-border pl-1.5" onClick={(e) => e.stopPropagation()}>
                        {
                            activeCount > 0 &&
                            <TooltipDisplayer tooltip={resolveLanguageKey("clearFilters")}>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClear();
                                    }}
                                    className="h-7 px-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="size-4" />
                                    {/*<ButtonTitle hideMobile={true} className="ml-1">*/}
                                    {/*    {resolveLanguageKey("clearFilters")}*/}
                                    {/*</ButtonTitle>*/}
                                </Button>
                            </TooltipDisplayer>
                        }
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                onApply();
                            }}
                        >
                            {resolveLanguageKey("apply")}
                        </Button>
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                // sideOffset={4}
                avoidCollisions={true}
                // collisionPadding={16}
                className="w-(--radix-popover-trigger-width) p-0 rounded-md shadow-md border border-border bg-popover overflow-hidden gap-0"
            >
                {/*<div className="px-3 py-2 border-b border-border bg-muted/30">*/}
                {/*    <p className="text-base text-muted-foreground">{resolveLanguageKey("addCustomFilter")}</p>*/}
                {/*</div>*/}
                <div className="p-3 max-h-[min(60vh,360px)] overflow-y-auto overscroll-contain">
                    <FilterGroup
                        group={root}
                        parentId={null}
                        depth={0}
                        fieldsLanguage={configuration.fields}
                        fields={fields}
                        onAddRule={addRule}
                        onRemoveRule={removeRule}
                        onUpdateRule={updateRule}
                        onAddGroup={addGroup}
                        onRemoveGroup={removeGroup}
                        onUpdateGroupOperator={updateGroupOperator}
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}

function FilterBuilderView({
    filters,
    setFilters,
    extraParams,
    filterFields,
    configuration,
    resolveLanguageKey,
    languageCode,
    currentLanguage
}: FilterBuilderProps) {
    return (
        <>
            <FilterBuilderProvider extraParams={extraParams} fields={filterFields}>
                <FilterBuilderInner
                    filters={filters}
                    setFilters={setFilters}
                    extraParams={extraParams}
                    configuration={configuration}
                    resolveLanguageKey={resolveLanguageKey}
                    languageCode={languageCode}
                    currentLanguage={currentLanguage}
                />
            </FilterBuilderProvider>
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/filterBuilder/filterBuilder.tsx")
)(FilterBuilderView)


