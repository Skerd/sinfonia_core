import {afterEach, describe, expect, it, vi} from "vitest";
import type {NavSubCollapsible} from "@coreModule/helpers/types/sidebarNav.types.ts";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {createTenancySettingsContributions} from "@coreModule/helpers/moduleContributions/loadTenancySettingsContributions.ts";

const path = (pkg: string) => `/src/modules/${pkg}/clients/panel/tenancySettingsContribution.tsx`;
const item = (title: string) => ({title, items: [], permissions: [], usersPermissions: [], atLeastOnePermission: true}) as unknown as NavSubCollapsible;
const resolve = ((key: string) => key.toUpperCase()) as ResolveLanguageKey;

afterEach(() => {
    vi.restoreAllMocks();
});

describe("createTenancySettingsContributions", () => {
    it("returns one collapsible per contribution, in order, built with the resolver", () => {
        const {getSubCollapsibles} = createTenancySettingsContributions({
            [path("b")]: {default: {id: "b", order: 40, getTenancySettingsItems: (r: ResolveLanguageKey) => item(String(r("b")))}},
            [path("a")]: {default: {id: "a", order: 20, getTenancySettingsItems: (r: ResolveLanguageKey) => item(String(r("a")))}},
        });
        expect(getSubCollapsibles(resolve).map((i) => i.title)).toEqual(["A", "B"]);
    });

    it("skips null/undefined results and throwing modules", () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => {});
        const {getSubCollapsibles} = createTenancySettingsContributions({
            [path("a")]: {default: [
                {id: "none", order: 1, getTenancySettingsItems: () => null},
                {id: "undef", order: 2, getTenancySettingsItems: () => undefined},
                {id: "broken", order: 3, getTenancySettingsItems: () => {
                    throw new Error("boom");
                }},
                {id: "ok", order: 4, getTenancySettingsItems: () => item("ok")},
            ]},
        });
        expect(getSubCollapsibles(resolve).map((i) => i.title)).toEqual(["ok"]);
        expect(error).toHaveBeenCalledTimes(1);
    });

    it("returns nothing for an empty glob", () => {
        expect(createTenancySettingsContributions({}).getSubCollapsibles(resolve)).toEqual([]);
    });

    it("rejects an entry without the hook", () => {
        const {getSubCollapsibles} = createTenancySettingsContributions({[path("bad")]: {default: [{id: "x"}]}});
        expect(() => getSubCollapsibles(resolve)).toThrow(`Invalid entry at ${path("bad")}[0]`);
    });
});
