import {afterEach, describe, expect, it, vi} from "vitest";
import type {NavItem} from "@coreModule/helpers/types/sidebarNav.types.ts";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {createAccountNavContributions} from "@coreModule/helpers/moduleContributions/loadAccountNavContributions.ts";

const path = (pkg: string) => `/src/modules/${pkg}/clients/panel/accountNavContribution.tsx`;
const item = (title: string) => ({
    title,
    url: "/account/addresses",
    permissions: [],
    usersPermissions: [],
    atLeastOnePermission: true,
}) as unknown as NavItem;
const resolve = ((key: string) => key.toUpperCase()) as ResolveLanguageKey;

afterEach(() => {
    vi.restoreAllMocks();
});

describe("createAccountNavContributions", () => {
    it("returns links per contribution, in order, built with the resolver", () => {
        const {getItems} = createAccountNavContributions({
            [path("b")]: {default: {id: "b", order: 40, getAccountNavItems: (r: ResolveLanguageKey) => [item(String(r("b")))]}},
            [path("a")]: {default: {id: "a", order: 20, getAccountNavItems: (r: ResolveLanguageKey) => [item(String(r("a")))]}},
        });
        expect(getItems(resolve).map((entry) => entry.title)).toEqual(["A", "B"]);
    });

    it("skips null/undefined results and throwing modules", () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => {});
        const {getItems} = createAccountNavContributions({
            [path("a")]: {default: [
                {id: "none", order: 1, getAccountNavItems: () => null},
                {id: "undef", order: 2, getAccountNavItems: () => undefined},
                {id: "broken", order: 3, getAccountNavItems: () => {
                    throw new Error("boom");
                }},
                {id: "ok", order: 4, getAccountNavItems: () => [item("ok")]},
            ]},
        });
        expect(getItems(resolve).map((entry) => entry.title)).toEqual(["ok"]);
        expect(error).toHaveBeenCalledTimes(1);
    });

    it("returns nothing for an empty glob", () => {
        expect(createAccountNavContributions({}).getItems(resolve)).toEqual([]);
    });

    it("rejects an entry without the hook", () => {
        const {getItems} = createAccountNavContributions({[path("bad")]: {default: [{id: "x"}]}});
        expect(() => getItems(resolve)).toThrow(`Invalid entry at ${path("bad")}[0]`);
    });
});
