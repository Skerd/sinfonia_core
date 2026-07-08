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
        rules: group.rules.filter((r: FilterRule) => r.field || r.value !== null),
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
