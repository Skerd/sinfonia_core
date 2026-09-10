import { useCallback, useReducer } from "react";
import type { FilterDSL, FilterGroup, FilterRule } from "armonia/src/modules/core/database/filter";
import {generateUUID} from "@coreModule/helpers/general";

type FilterState = {
    root: FilterGroup;
};

function createId(): string {
    return generateUUID();
}

export function createEmptyGroup(): FilterGroup {
    return {
        id: createId(),
        operator: "and",
        rules: [],
        groups: [],
    };
}

export function createEmptyRule(): FilterRule {
    return {
        id: createId(),
        field: "",
        operator: "equals",
        value: null,
    };
}

/** True when a rule has field + operator + a usable value (ready to apply / show as chip). */
export function isCompleteRule(rule: FilterRule): boolean {
    if (!rule.field || !rule.operator) return false;
    if (rule.operator === "exists") return typeof rule.value === "boolean";
    if (rule.value == null) return false;
    if (typeof rule.value === "string" && rule.value.trim() === "") return false;
    if (Array.isArray(rule.value) && rule.value.length === 0) return false;
    return true;
}

/** Incomplete rule waiting for field/value (not shown as a chip yet). */
export function isDraftRule(rule: FilterRule): boolean {
    return !isCompleteRule(rule);
}

export function collectDraftRules(group: FilterGroup): FilterRule[] {
    const drafts: FilterRule[] = [];
    for (const rule of group.rules) {
        if (isDraftRule(rule)) drafts.push(rule);
    }
    for (const child of group.groups) {
        drafts.push(...collectDraftRules(child));
    }
    return drafts;
}

export function hasDraftRules(group: FilterGroup): boolean {
    return collectDraftRules(group).length > 0;
}

/**
 * URL hydrate replaces the whole tree. Re-attach in-progress drafts so a slower
 * `?filter=` echo cannot wipe a rule the user is still editing.
 */
export function withPreservedDrafts(urlRoot: FilterGroup, localRoot: FilterGroup): FilterGroup {
    const drafts = collectDraftRules(localRoot);
    if (drafts.length === 0) return urlRoot;
    const existingIds = new Set(urlRoot.rules.map((rule) => rule.id));
    const toAdd = drafts.filter((draft) => !existingIds.has(draft.id));
    if (toAdd.length === 0) return urlRoot;
    return {...urlRoot, rules: [...urlRoot.rules, ...toAdd]};
}

function collectCompleteRuleIds(group: FilterGroup): string[] {
    const ids: string[] = [];
    for (const rule of group.rules) {
        if (isCompleteRule(rule)) ids.push(rule.id);
    }
    for (const child of group.groups) {
        ids.push(...collectCompleteRuleIds(child));
    }
    return ids;
}

/** True when a previously applied complete rule is gone and is not an in-progress draft. */
export function completeRulesWereRemoved(lastCommitted: FilterGroup, localRoot: FilterGroup): boolean {
    const localComplete = new Set(collectCompleteRuleIds(localRoot));
    const localDrafts = new Set(collectDraftRules(localRoot).map((rule) => rule.id));
    return collectCompleteRuleIds(lastCommitted).some(
        (id) => !localComplete.has(id) && !localDrafts.has(id),
    );
}

/**
 * Auto-apply writes complete rules to the URL. Do not auto-clear while a draft
 * exists solely because changing a field nulls `value` — that would wipe `?filter=`.
 * Removing a chip/rule must still commit, even if a blank draft sits beside it
 * (popover open, leftover half-filled row).
 */
export function shouldAutoCommit(
    serialized: FilterDSL | undefined,
    localRoot: FilterGroup,
    lastCommitted?: FilterDSL | null,
): boolean {
    if (serialized) return true;
    if (!hasDraftRules(localRoot)) return true;
    if (!lastCommitted) return false;
    return completeRulesWereRemoved(lastCommitted, localRoot);
}

/**
 * Our `?filter=` writes use `replace` and can echo out of order. A slower
 * earlier write must not hydrate over the tree we just committed.
 *
 * - `echo` — URL matches the last write (clear pending, skip hydrate)
 * - `stale` — a write is in flight and this param is not it (ignore)
 * - `hydrate` — external change (back/forward, pasted URL, shared link)
 */
export function classifyUrlFilterParam(
    incomingParam: string | null,
    lastSyncedParam: string | null,
    pendingWrite: boolean,
): "echo" | "stale" | "hydrate" {
    if (incomingParam === lastSyncedParam) return "echo";
    if (pendingWrite) return "stale";
    return "hydrate";
}

/** What `searchParams.get` returns after `URLSearchParams.set` of an encoded filter. */
export function searchParamAfterSet(key: string, encoded: string | null): string | null {
    if (encoded == null) return null;
    const probe = new URLSearchParams();
    probe.set(key, encoded);
    return probe.get(key);
}

type FilterAction =
    | { type: "addRule"; groupId: string }
    | { type: "removeRule"; groupId: string; ruleId: string }
    | { type: "updateRule"; groupId: string; ruleId: string; patch: Partial<FilterRule> }
    | { type: "addGroup"; parentId: string }
    | { type: "removeGroup"; parentId: string; groupId: string }
    | { type: "updateGroupOperator"; groupId: string; operator: "and" | "or" }
    | { type: "setRoot"; root: FilterGroup }
    | { type: "reset" };

function updateGroup(group: FilterGroup, groupId: string, updater: (g: FilterGroup) => FilterGroup): FilterGroup {
    if (group.id === groupId) {
        return updater(group);
    }
    return {
        ...group,
        groups: group.groups.map((g: FilterGroup) => updateGroup(g, groupId, updater)),
    };
}

function pruneEmpty(group: FilterGroup): FilterGroup {
    return {
        ...group,
        // Only complete rules are sent to the API / URL — field-only drafts must not filter.
        rules: group.rules.filter(isCompleteRule),
        groups: group.groups.map(pruneEmpty).filter((g: FilterGroup) => g.rules.length > 0 || g.groups.length > 0),
    };
}

function filterReducer(state: FilterState, action: FilterAction): FilterState {
    switch (action.type) {
        case "addRule": {
            return {
                root: updateGroup(state.root, action.groupId, (g) => ({
                    ...g,
                    rules: [...g.rules, createEmptyRule()],
                })),
            };
        }
        case "removeRule": {
            return {
                root: updateGroup(state.root, action.groupId, (g) => ({
                    ...g,
                    rules: g.rules.filter((r: FilterRule) => r.id !== action.ruleId),
                })),
            };
        }
        case "updateRule": {
            return {
                root: updateGroup(state.root, action.groupId, (g) => ({
                    ...g,
                    rules: g.rules.map((r: FilterRule) =>
                        r.id === action.ruleId ? { ...r, ...action.patch } : r
                    ),
                })),
            };
        }
        case "addGroup": {
            return {
                root: updateGroup(state.root, action.parentId, (g) => ({
                    ...g,
                    groups: [...g.groups, createEmptyGroup()],
                })),
            };
        }
        case "removeGroup": {
            return {
                root: updateGroup(state.root, action.parentId, (g) => ({
                    ...g,
                    groups: g.groups.filter((child: FilterGroup) => child.id !== action.groupId),
                })),
            };
        }
        case "updateGroupOperator": {
            return {
                root: updateGroup(state.root, action.groupId, (g) => ({
                    ...g,
                    operator: action.operator,
                })),
            };
        }
        case "setRoot": {
            return { root: action.root };
        }
        case "reset": {
            return { root: createEmptyGroup() };
        }
        default:
            return state;
    }
}

export function useFilterState(initial?: FilterDSL) {
    const [state, dispatch] = useReducer(filterReducer, {
        root: initial ?? createEmptyGroup(),
    });

    const addRule = useCallback((groupId: string) => dispatch({ type: "addRule", groupId }), []);
    const removeRule = useCallback(
        (groupId: string, ruleId: string) => dispatch({ type: "removeRule", groupId, ruleId }),
        []
    );
    const updateRule = useCallback(
        (groupId: string, ruleId: string, patch: Partial<FilterRule>) =>
            dispatch({ type: "updateRule", groupId, ruleId, patch }),
        []
    );
    const addGroup = useCallback((parentId: string) => dispatch({ type: "addGroup", parentId }), []);
    const removeGroup = useCallback(
        (parentId: string, groupId: string) => dispatch({ type: "removeGroup", parentId, groupId }),
        []
    );
    const updateGroupOperator = useCallback(
        (groupId: string, operator: "and" | "or") =>
            dispatch({ type: "updateGroupOperator", groupId, operator }),
        []
    );
    const setRoot = useCallback((root: FilterGroup) => dispatch({ type: "setRoot", root }), []);
    const reset = useCallback(() => dispatch({ type: "reset" }), []);

    const serialize = useCallback((): FilterDSL | undefined => {
        const pruned = pruneEmpty(state.root);
        if (pruned.rules.length === 0 && pruned.groups.length === 0) return undefined;
        return pruned;
    }, [state.root]);

    return {
        root: state.root,
        addRule,
        removeRule,
        updateRule,
        addGroup,
        removeGroup,
        updateGroupOperator,
        setRoot,
        reset,
        serialize,
    };
}
