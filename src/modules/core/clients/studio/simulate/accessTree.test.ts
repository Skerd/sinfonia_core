import {describe, expect, it} from "vitest";
import {pruneAccessTree} from "./accessTree.ts";
import {collectAccessPaths} from "../catalog/useStudioCatalog.ts";

/** Shaped like a real `useAccess` map: leaves are `true`, branches carry `keys`. */
const tree = () => ({
    name: true,
    address: {keys: {city: true, street: true}},
    currency: {keys: {abbreviation: true}},
});

describe("pruneAccessTree", () => {
    it("returns the tree untouched when nothing is revoked", () => {
        const original = tree();
        expect(pruneAccessTree(original, new Set())).toBe(original);
    });

    it("drops a leaf", () => {
        expect(collectAccessPaths(pruneAccessTree(tree(), new Set(["name"])))).toEqual([
            "address",
            "address.city",
            "address.street",
            "currency",
            "currency.abbreviation",
        ]);
    });

    it("drops a nested path without touching its siblings", () => {
        expect(collectAccessPaths(pruneAccessTree(tree(), new Set(["address.city"])))).toEqual([
            "name",
            "address",
            "address.street",
            "currency",
            "currency.abbreviation",
        ]);
    });

    it("takes the subtree with a revoked branch", () => {
        expect(collectAccessPaths(pruneAccessTree(tree(), new Set(["address"])))).toEqual([
            "name",
            "currency",
            "currency.abbreviation",
        ]);
    });

    it("does not mutate the map it was given", () => {
        const original = tree();
        pruneAccessTree(original, new Set(["address.city"]));
        expect(collectAccessPaths(original)).toContain("address.city");
    });
});
