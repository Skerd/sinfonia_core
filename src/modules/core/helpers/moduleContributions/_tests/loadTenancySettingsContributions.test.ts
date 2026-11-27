import {afterEach, describe, expect, it, vi} from "vitest";
import {setCompanyModules} from "@coreModule/helpers/modules/enabledModules.ts";
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

describe("createTenancySettingsContributions: a module kept only for its platform lists (D195)", () => {
    const link = (url: string) => ({title: url, url, permissions: [], usersPermissions: [], atLeastOnePermission: true});
    const shopMenu = (): NavSubCollapsible => ({
        title: "Shop", permissions: [], usersPermissions: [], atLeastOnePermission: true,
        items: [
            link("/tenancy/systemSettings/whatWeSell"),
            link("/tenancy/systemSettings/categories"),
            {title: "POS", permissions: [], usersPermissions: [], atLeastOnePermission: true, items: [link("/tenancy/systemSettings/posconfigs")]},
        ],
    });
    const contributions = () => createTenancySettingsContributions(
        {[path("eCommerce")]: {default: {id: "eCommerce", getTenancySettingsItems: shopMenu}}},
        (moduleName) => (moduleName === "eCommerce" ? ["/tenancy/systemSettings/categories"] : []),
    );

    afterEach(() => {
        setCompanyModules(null);
    });

    it("keeps only the entries of its platform-list pages", () => {
        setCompanyModules(["core"], ["eCommerce"]);
        const [menu] = contributions().getSubCollapsibles(resolve);
        expect(menu.items.map((entry) => entry.title)).toEqual(["/tenancy/systemSettings/categories"]);
    });

    it("keeps the whole menu for a company that runs the module", () => {
        setCompanyModules(["eCommerce"]);
        expect(contributions().getSubCollapsibles(resolve)[0].items).toHaveLength(3);
    });
});
