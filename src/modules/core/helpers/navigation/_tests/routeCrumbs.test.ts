import {describe, expect, it} from "vitest";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {FlatPanelNavLink} from "@coreModule/helpers/navigation/flattenPanelNavLinks.ts";
import {buildRouteCrumbs, navPagePaths} from "@coreModule/helpers/navigation/routeCrumbs.ts";

const TRANSLATIONS: Record<string, string> = {
    "home.title": "Home",
    "menus.tenancy.title": "Tenancy",
    "menus.tenancy.systemSettings.title": "System settings",
    "menus.tenancy.systemSettings.countries.title": "Countries",
    "common.create": "Create",
};
const resolve = ((key: string) => TRANSLATIONS[key] ?? null) as ResolveLanguageKey;

const link = (url: string): FlatPanelNavLink => ({title: url, url, groupTitle: "G"});

describe("navPagePaths", () => {
    it("keeps the pathname of each sidebar page and drops its query", () => {
        const paths = navPagePaths([link("/eCommerce/orders?status=open"), link("/company/users"), link("?tab=1")]);

        expect([...paths]).toEqual(["/eCommerce/orders", "/company/users"]);
    });
});

describe("buildRouteCrumbs", () => {
    it("links only the crumbs that are pages; menu groups carry no path", () => {
        const pages = navPagePaths([link("/tenancy/systemSettings/countries")]);

        expect(buildRouteCrumbs("/tenancy/systemSettings/countries/create", resolve, pages)).toEqual([
            {label: "Tenancy", path: undefined},
            {label: "System settings", path: undefined},
            {label: "Countries", path: "/tenancy/systemSettings/countries"},
            {label: "Create", path: undefined},
        ]);
    });

    it("skips object ids and humanizes untranslated segments", () => {
        const pages = navPagePaths([link("/carRental/costControl")]);

        expect(buildRouteCrumbs("/carRental/costControl/0123456789abcdef01234567/edit", resolve, pages)).toEqual([
            {label: "Car Rental", path: undefined},
            {label: "Cost Control", path: "/carRental/costControl"},
            {label: "Edit", path: undefined},
        ]);
    });

    it("returns the home crumb for the root and /home", () => {
        expect(buildRouteCrumbs("/", resolve, new Set())).toEqual([{label: "Home", path: "/"}]);
        expect(buildRouteCrumbs("/home", resolve, new Set())).toEqual([{label: "Home", path: "/"}]);
    });
});
