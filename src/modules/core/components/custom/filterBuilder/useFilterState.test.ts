import {describe, expect, it} from "vitest";
import type {FilterGroup, FilterRule} from "armonia/src/modules/core/database/filter";
import {
    classifyUrlFilterParam,
    completeRulesWereRemoved,
    hasDraftRules,
    searchParamAfterSet,
    shouldAutoCommit,
    withPreservedDrafts,
} from "./useFilterState.ts";

function group(rules: FilterRule[], id = "root"): FilterGroup {
    return {id, operator: "and", rules, groups: []};
}

function complete(id: string, value = "lobby"): FilterRule {
    return {id, field: "sharedSpaces", operator: "contains", value};
}

function draft(id: string): FilterRule {
    return {id, field: "name", operator: "contains", value: null};
}

describe("filter builder URL sync helpers", () => {
    it("does not auto-clear while a draft is in progress", () => {
        const local = group([complete("a"), draft("b")]);
        expect(hasDraftRules(local)).toBe(true);
        expect(shouldAutoCommit(undefined, local)).toBe(false);
    });

    it("auto-clears when the tree is actually empty", () => {
        expect(shouldAutoCommit(undefined, group([]))).toBe(true);
    });

    it("auto-commits a complete DSL even when a blank draft sits beside it", () => {
        const dsl = group([complete("a")]);
        const local = group([complete("a"), draft("b")]);
        expect(shouldAutoCommit(dsl, local)).toBe(true);
    });

    it("does not wipe ?filter= when the applied rule is demoted to a draft", () => {
        const last = group([complete("a")]);
        const local = group([draft("a")]);
        expect(completeRulesWereRemoved(last, local)).toBe(false);
        expect(shouldAutoCommit(undefined, local, last)).toBe(false);
    });

    it("commits the empty tree when a chip is removed and only a leftover draft remains", () => {
        const last = group([complete("a")]);
        const local = group([draft("blank")]);
        expect(completeRulesWereRemoved(last, local)).toBe(true);
        expect(shouldAutoCommit(undefined, local, last)).toBe(true);
    });

    it("commits when one complete rule is removed even if another was demoted to a draft", () => {
        const last = group([complete("a"), complete("b")]);
        const local = group([draft("b")]);
        expect(completeRulesWereRemoved(last, local)).toBe(true);
        expect(shouldAutoCommit(undefined, local, last)).toBe(true);
    });

    it("detects a removed nested complete rule", () => {
        const last: FilterGroup = {
            id: "root",
            operator: "and",
            rules: [],
            groups: [group([complete("nested")], "child")],
        };
        const local: FilterGroup = {
            id: "root",
            operator: "and",
            rules: [draft("blank")],
            groups: [group([], "child")],
        };
        expect(completeRulesWereRemoved(last, local)).toBe(true);
        expect(shouldAutoCommit(undefined, local, last)).toBe(true);
    });

    it("re-attaches local drafts after a slower URL hydrate", () => {
        const url = group([complete("a", "lob")]);
        const local = group([complete("a", "lobby"), draft("editing")]);
        const merged = withPreservedDrafts(url, local);
        expect(merged.rules.map((rule) => rule.id)).toEqual(["a", "editing"]);
        expect(merged.rules[1]).toMatchObject({id: "editing", value: null});
    });

    it("does not duplicate a draft the URL tree already has", () => {
        const url = group([complete("a"), draft("editing")]);
        const local = group([complete("a"), draft("editing")]);
        expect(withPreservedDrafts(url, local)).toBe(url);
    });

    it("ignores a slower echo of an earlier ?filter= write", () => {
        expect(classifyUrlFilterParam("old", "new", true)).toBe("stale");
        expect(classifyUrlFilterParam("new", "new", true)).toBe("echo");
        expect(classifyUrlFilterParam("shared", "new", false)).toBe("hydrate");
        expect(classifyUrlFilterParam(null, "new", true)).toBe("stale");
        expect(classifyUrlFilterParam(null, null, false)).toBe("echo");
    });

    it("round-trips the visible search param after URLSearchParams.set", () => {
        const encoded = encodeURIComponent("abc+def");
        expect(searchParamAfterSet("filter", encoded)).toBe(encoded);
        expect(searchParamAfterSet("filter", null)).toBeNull();
    });
});
