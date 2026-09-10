import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {Button} from "@coreModule/components/ui/button.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@coreModule/components/ui/popover.tsx";
import {Search, Trash2} from "lucide-react";
import { FilterBuilderProvider, useFilterBuilder } from "./filterBuilderContext.tsx";
import FilterGroup from "./filterGroup.tsx";
import FilterChip from "./filterChip.tsx";
import { classifyUrlFilterParam, hasDraftRules, isCompleteRule, isDraftRule, searchParamAfterSet, shouldAutoCommit, useFilterState, withPreservedDrafts } from "./useFilterState.ts";
import { cn } from "@coreModule/components/lib/utils.ts";
import type { FilterDSL, FilterRule, FilterFieldConfig } from "armonia/src/modules/core/database/filter";
import {
    decodeFilterFromUrl,
    decodeFilterLabelsFromUrl,
    encodeFilterLabelsToUrl,
    encodeFilterToUrl,
    FILTER_LABELS_URL_PARAM,
    FILTER_URL_PARAM,
    pruneFilterLabelsToDsl,
} from "@coreModule/helpers/filter/filterUrl.ts";
import { LIST_PAGE_PARAM } from "@coreModule/helpers/hooks/useListUrlState.ts";
import {compose} from "redux";
import withLanguage, {TranslationValue, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";

type RuleWithGroup = { groupId: string; rule: FilterRule };

const AUTO_COMMIT_MS = 300;

function collectRulesWithGroups(group: FilterDSL, fields: FilterFieldConfig[]): RuleWithGroup[] {
    const result: RuleWithGroup[] = [];
    for (const r of group.rules ?? []) {
        if (isCompleteRule(r)) result.push({ groupId: group.id, rule: r });
    }
    for (const g of group.groups ?? []) {
        result.push(...collectRulesWithGroups(g, fields));
    }
    return result;
}

function countActiveRules(group: FilterDSL): number {
    const rules = group.rules?.filter(isCompleteRule)?.length ?? 0;
    const nested = group.groups?.reduce((sum, g) => sum + countActiveRules(g), 0) ?? 0;
    return rules + nested;
}

type FilterBuilderProps = WithLanguageType & {
    resourceUrl: string;
    filters: Record<string, unknown>;
    setFilters: (
        filters: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>),
    ) => void;
    extraParams?: Record<string, unknown>;
    /** When provided, use these filter fields instead of fetching. Enables single-request flow with table-config. */
    filterFields?: import("armonia/src/modules/core/database/filter").FilterFieldConfig[];
    configuration: {
        placeholder: string;
        fields: TranslationValue
    };
    /** Namespaced `listPage` key when multiple lists share the route. */
    listPageParam?: string;
};

function FilterBuilderInner({
    filters,
    setFilters,
    extraParams,
    resolveLanguageKey,
    configuration,
    listPageParam = LIST_PAGE_PARAM,
}: Omit<FilterBuilderProps, "resourceUrl">) {

    const { fields, refLabelsByFieldPath, replaceRefLabels } = useFilterBuilder();
    const [searchParams, setSearchParams] = useSearchParams();

    const filterParam = searchParams.get(FILTER_URL_PARAM);
    const labelsParam = searchParams.get(FILTER_LABELS_URL_PARAM);
    const urlFilter = decodeFilterFromUrl(filterParam);
    const urlLabels = decodeFilterLabelsFromUrl(labelsParam);
    const initialFilter = (filters?.filter as FilterDSL | undefined) ?? urlFilter;

    const {
        root,
        addRule,
        removeRule,
        updateRule,
        addGroup,
        removeGroup,
        updateGroupOperator,
        setRoot,
        reset,
        serialize,
    } = useFilterState(initialFilter);

    const [popoverOpen, setPopoverOpen] = useState(false);
    /** Suppress auto-apply once after URL hydrate / programmatic commit. */
    const suppressAutoApplyRef = useRef(1);
    const lastCommittedKeyRef = useRef<string | null>(null);
    const lastCommittedDslRef = useRef<FilterDSL | null>(initialFilter ?? null);
    const lastSyncedFilterParam = useRef<string | null>(filterParam);
    const lastSyncedLabelsParam = useRef<string | null>(labelsParam);
    /** True after we `replace` the URL until that exact `?filter=` / `?filterLabels=` pair is visible. */
    const pendingUrlWriteRef = useRef(false);
    /** Chip/rule/group remove should commit on this turn, not after the typing debounce. */
    const commitImmediatelyRef = useRef(false);
    const rootRef = useRef(root);
    rootRef.current = root;
    const autoCommitTimerRef = useRef<number>(0);

    const commitFilters = useCallback(
        (dsl: FilterDSL | undefined, options?: { closePopover?: boolean }) => {
            window.clearTimeout(autoCommitTimerRef.current);
            const prunedLabels = pruneFilterLabelsToDsl(refLabelsByFieldPath, dsl);
            const encodedFilter = dsl ? encodeFilterToUrl(dsl) : null;
            const encodedLabels =
                dsl && Object.keys(prunedLabels).length > 0
                    ? encodeFilterLabelsToUrl(prunedLabels)
                    : null;
            lastSyncedFilterParam.current = searchParamAfterSet(FILTER_URL_PARAM, encodedFilter);
            lastSyncedLabelsParam.current = searchParamAfterSet(FILTER_LABELS_URL_PARAM, encodedLabels);
            pendingUrlWriteRef.current = true;
            setFilters((prev) => {
                const next = { ...prev, ...extraParams };
                if (dsl) next.filter = dsl;
                else delete next.filter;
                return next;
            });
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (encodedFilter) {
                    next.set(FILTER_URL_PARAM, encodedFilter);
                    if (encodedLabels) {
                        next.set(FILTER_LABELS_URL_PARAM, encodedLabels);
                    } else {
                        next.delete(FILTER_LABELS_URL_PARAM);
                    }
                } else {
                    next.delete(FILTER_URL_PARAM);
                    next.delete(FILTER_LABELS_URL_PARAM);
                }
                next.delete(listPageParam);
                return next;
            }, { replace: true });
            if (encodedLabels) replaceRefLabels(prunedLabels);
            else replaceRefLabels({});
            lastCommittedKeyRef.current = JSON.stringify(dsl ?? null);
            lastCommittedDslRef.current = dsl ?? null;
            if (options?.closePopover) setPopoverOpen(false);
        },
        [setFilters, extraParams, setSearchParams, refLabelsByFieldPath, replaceRefLabels, listPageParam],
    );

    // Re-sync UI + applied filters whenever the URL `filter` param changes
    // (refresh, shared links, browser back/forward). Apply/Clear write the URL;
    // this effect is the reader. Skip echoes of our own write — a slower `?filter=`
    // arriving after the next keystroke used to `setRoot` and wipe in-progress drafts.
    useEffect(() => {
        const writeLanded =
            lastSyncedFilterParam.current === filterParam &&
            lastSyncedLabelsParam.current === labelsParam;
        if (writeLanded) {
            pendingUrlWriteRef.current = false;
            return;
        }
        // Filter-only echo while labels are still in flight must not clear pending —
        // a slower empty `filterLabels` would then hydrate and wipe ObjectId chips.
        if (pendingUrlWriteRef.current) return;
        if (
            classifyUrlFilterParam(
                filterParam,
                lastSyncedFilterParam.current,
                pendingUrlWriteRef.current,
            ) === "echo"
        ) {
            return;
        }

        lastSyncedFilterParam.current = filterParam;
        suppressAutoApplyRef.current += 1;

        if (urlFilter) {
            setRoot(withPreservedDrafts(urlFilter, rootRef.current));
            setFilters((prev) => ({ ...prev, ...extraParams, filter: urlFilter }));
            lastCommittedKeyRef.current = JSON.stringify(urlFilter);
            lastCommittedDslRef.current = urlFilter;
            return;
        }

        // Only clear when the param is gone. If decode fails (corrupt / too long),
        // keep existing applied state — do not wipe filters or fight the URL.
        if (filterParam == null || filterParam === "") {
            setFilters((prev) => {
                const next = { ...prev, ...extraParams };
                delete next.filter;
                return next;
            });
            lastCommittedKeyRef.current = JSON.stringify(null);
            lastCommittedDslRef.current = null;
            // Keep in-progress drafts in the builder; still drop the applied filter.
            if (hasDraftRules(rootRef.current)) return;
            reset();
        }
    }, [filterParam, labelsParam, urlFilter, setRoot, reset, setFilters, extraParams]);

    // Keep ObjectId chip labels in sync with `filterLabels` (provider also seeds on mount).
    useEffect(() => {
        const kind = classifyUrlFilterParam(
            labelsParam,
            lastSyncedLabelsParam.current,
            pendingUrlWriteRef.current,
        );
        if (kind === "echo") return;
        if (kind === "stale") return;
        lastSyncedLabelsParam.current = labelsParam;
        if (urlLabels) {
            replaceRefLabels(urlLabels);
        } else if (labelsParam == null || labelsParam === "") {
            replaceRefLabels({});
        }
    }, [labelsParam, urlLabels, replaceRefLabels]);

    const activeCount = useMemo(() => countActiveRules(root), [root]);
    const rulesWithGroups = useMemo(() => collectRulesWithGroups(root, fields), [root, fields]);
    const appliedDsl = useMemo(() => serialize(), [serialize]);
    const appliedKey = useMemo(() => JSON.stringify(appliedDsl ?? null), [appliedDsl]);

    // Auto-apply when complete rules change (chip edit/remove, or draft → badge).
    // Debounce so typing a value does not replace `?filter=` on every keystroke —
    // a slower echo of an earlier write used to hydrate and drop later rules.
    useEffect(() => {
        if (suppressAutoApplyRef.current > 0) {
            suppressAutoApplyRef.current -= 1;
            lastCommittedKeyRef.current = appliedKey;
            lastCommittedDslRef.current = appliedDsl ?? null;
            commitImmediatelyRef.current = false;
            return;
        }
        if (appliedKey === lastCommittedKeyRef.current) {
            commitImmediatelyRef.current = false;
            return;
        }
        if (!shouldAutoCommit(appliedDsl, root, lastCommittedDslRef.current)) {
            commitImmediatelyRef.current = false;
            return;
        }
        window.clearTimeout(autoCommitTimerRef.current);
        const delay = commitImmediatelyRef.current ? 0 : AUTO_COMMIT_MS;
        commitImmediatelyRef.current = false;
        autoCommitTimerRef.current = window.setTimeout(() => {
            commitFilters(appliedDsl, { closePopover: false });
        }, delay);
        return () => window.clearTimeout(autoCommitTimerRef.current);
    }, [appliedKey, appliedDsl, commitFilters, root]);

    // When the builder opens, ensure there is a blank rule ready to edit.
    // After a draft becomes a chip (and auto-applies), add another blank rule.
    useEffect(() => {
        if (!popoverOpen) return;
        if (root.rules.some(isDraftRule)) return;
        addRule(root.id);
    }, [popoverOpen, root.rules, root.id, addRule]);

    const handleRemoveRule = useCallback(
        (groupId: string, ruleId: string) => {
            commitImmediatelyRef.current = true;
            removeRule(groupId, ruleId);
        },
        [removeRule],
    );

    const handleRemoveGroup = useCallback(
        (parentId: string, groupId: string) => {
            commitImmediatelyRef.current = true;
            removeGroup(parentId, groupId);
        },
        [removeGroup],
    );

    const onApply = useCallback(() => {
        commitFilters(serialize(), { closePopover: true });
    }, [commitFilters, serialize]);

    const onClear = useCallback(() => {
        window.clearTimeout(autoCommitTimerRef.current);
        reset();
        replaceRefLabels({});
        commitFilters(undefined, { closePopover: true });
    }, [reset, replaceRefLabels, commitFilters]);

    const handlePopoverOpenChange = useCallback((open: boolean) => {
        setPopoverOpen(open);
    }, []);

    return (
        <Popover open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
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
                                                    onRemove={handleRemoveRule}
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
                        onRemoveRule={handleRemoveRule}
                        onUpdateRule={updateRule}
                        onAddGroup={addGroup}
                        onRemoveGroup={handleRemoveGroup}
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
    const [searchParams] = useSearchParams();
    const initialRefLabels = useMemo(
        () => decodeFilterLabelsFromUrl(searchParams.get(FILTER_LABELS_URL_PARAM)) ?? {},
        // Depend on the raw param string so back/forward re-seeds labels.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [searchParams.get(FILTER_LABELS_URL_PARAM)],
    );

    return (
        <>
            <FilterBuilderProvider
                extraParams={extraParams}
                fields={filterFields}
                initialRefLabels={initialRefLabels}
            >
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


