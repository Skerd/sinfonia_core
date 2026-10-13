import {describe, expect, it} from "vitest";
import type {AccessContextValue} from "@coreModule/helpers/context/accessContext.tsx";
import {filterNavGroups, navItemAllowed} from "@coreModule/helpers/navigation/filterNavByAccess.ts";
import type {NavGroup, ProtectedNav} from "@coreModule/helpers/types/sidebarNav.types.ts";

const guard = (permissions: string[] = [], atLeastOnePermission = false): ProtectedNav => ({
    permissions,
    usersPermissions: [],
    atLeastOnePermission,
});

const map = {
    users: {self: {read: true}},
    orders: {self: {read: {status: true}}},
    invoices: {self: {read: false}},
} as unknown as AccessContextValue;

describe("navItemAllowed", () => {
    it("allows public entries", () => {
        expect(navItemAllowed(guard(), {}, true)).toBe(true);
    });

    it("allows everything while access is loading", () => {
        expect(navItemAllowed(guard(["invoices"]), {}, false)).toBe(true);
    });

    it("matches permissions case-insensitively, with true or field-level read", () => {
        expect(navItemAllowed(guard(["Users", "ORDERS"]), map, true)).toBe(true);
        expect(navItemAllowed(guard(["users", "invoices"]), map, true)).toBe(false);
    });

    it("needs only one permission when atLeastOnePermission is set", () => {
        expect(navItemAllowed(guard(["invoices", "users"], true), map, true)).toBe(true);
        expect(navItemAllowed(guard(["invoices", "missing"], true), map, true)).toBe(false);
    });

    it("denies protected entries outside the provider", () => {
        expect(navItemAllowed(guard(["users"]), {}, null)).toBe(false);
    });

    it("requires others-read when the entry lists other people's records", () => {
        const selfOnly = {
            users: {self: {read: true}, others: {read: false}},
        } as unknown as AccessContextValue;
        const othersRead = {
            users: {self: {read: true}, others: {read: {name: {}}}},
        } as unknown as AccessContextValue;
        const administration = {...guard(["users"], true), accessPerspective: "others" as const};

        expect(navItemAllowed(administration, selfOnly, true)).toBe(false);
        expect(navItemAllowed(administration, othersRead, true)).toBe(true);
        expect(navItemAllowed(guard(["users"], true), selfOnly, true)).toBe(true);
    });

    it("falls back to self when a loose schema omitted others", () => {
        const loose = {users: {self: {read: true}}} as unknown as AccessContextValue;
        expect(navItemAllowed({...guard(["users"], true), accessPerspective: "others"}, loose, true)).toBe(true);
    });
});

describe("filterNavGroups", () => {
    const groups: NavGroup[] = [
        {
            ...guard(),
            title: "Main",
            items: [
                {...guard(["users"]), title: "Users", url: "/users"},
                {...guard(["invoices"]), title: "Invoices", url: "/invoices"},
                {
                    ...guard(),
                    title: "Sales",
                    items: [
                        {...guard(["invoices"]), title: "Credit notes", url: "/credit"},
                        {...guard(), title: "Nested", items: [{...guard(["orders"]), title: "Orders", url: "/orders"}]},
                    ],
                },
            ],
        },
        {...guard(), title: "Finance", items: [{...guard(["invoices"]), title: "Ledger", url: "/ledger"}]},
    ];

    it("removes denied links, empty collapsibles, and empty groups", () => {
        const result = filterNavGroups(groups, map, true);
        expect(result.map((g) => g.title)).toEqual(["Main"]);
        expect(result[0].items).toEqual([
            groups[0].items[0],
            {
                ...groups[0].items[2],
                items: [{...guard(), title: "Nested", items: [{...guard(["orders"]), title: "Orders", url: "/orders"}]}],
            },
        ]);
    });

    it("hides a collapsible the user may not read even if children are visible", () => {
        const denied: NavGroup[] = [{
            ...guard(),
            title: "G",
            items: [{...guard(["invoices"]), title: "Parent", items: [{...guard(), title: "Child", url: "/c"}]}],
        }];
        expect(filterNavGroups(denied, map, true)).toEqual([]);
    });

    it("drops a group the user may not read", () => {
        const denied: NavGroup[] = [{
            ...guard(["invoices"]),
            title: "G",
            items: [{...guard(), title: "Public", url: "/public"}],
        }];
        expect(filterNavGroups(denied, map, true)).toEqual([]);
        expect(filterNavGroups(denied, map, false)).toHaveLength(1);
    });

    it("does not mutate the input", () => {
        const snapshot = structuredClone(groups);
        filterNavGroups(groups, map, true);
        expect(groups).toEqual(snapshot);
    });
});
