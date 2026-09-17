import {describe, expect, it} from "vitest";
import {createMenuLanguageContributions} from "@baseModule/helpers/moduleContributions/loadMenuLanguageContributions.ts";

const file = (pkg: string, locale: string) => `/src/modules/${pkg}/assets/languages/${locale}/menus.json`;
const glob = {
    [file("finance", "en-US")]: {finance: {title: "Finance", invoices: {title: "Invoices"}}},
    [file("finance", "de-CH")]: {finance: {title: "Finanzen"}},
    [file("shop", "de-CH")]: {company: {users: {title: "Shop users"}}},
};
const {applyModuleMenuContributions, getMergedModuleMenus} = createMenuLanguageContributions(glob, ["en-US"]);

describe("createMenuLanguageContributions", () => {
    it("returns the same dictionary when no module has menus", () => {
        const empty = createMenuLanguageContributions({}, ["en-US"]);
        const language = {title: "x"};
        expect(empty.applyModuleMenuContributions(language, "en-US")).toBe(language);
    });

    it("adds module menus to a dictionary without its own, sharing the frozen fragment", () => {
        const language = {title: "Page"};
        const out = applyModuleMenuContributions(language, "en-US");
        expect(out).toEqual({title: "Page", menus: {finance: {title: "Finance", invoices: {title: "Invoices"}}}});
        expect(out.menus).toBe(getMergedModuleMenus("en-US"));
        expect(Object.isFrozen(out.menus)).toBe(true);
    });

    it("deep-merges into existing menus, modules winning, core keys kept", () => {
        const language = {menus: {company: {users: {title: "Users"}, info: {title: "Info"}}}, other: 1};
        const out = applyModuleMenuContributions(language, "de-CH");
        expect(out).toEqual({
            other: 1,
            menus: {
                company: {users: {title: "Shop users"}, info: {title: "Info"}},
                finance: {title: "Finanzen", invoices: {title: "Invoices"}},
            },
        });
    });

    it("does not mutate the input dictionary", () => {
        const language = {menus: {company: {users: {title: "Users"}}}};
        applyModuleMenuContributions(language, "de-CH");
        expect(language).toEqual({menus: {company: {users: {title: "Users"}}}});
    });

    it.each([["an array", ["x"]], ["a string", "menus"], ["null", null]])("replaces menus that are %s", (_label, menus) => {
        const out = applyModuleMenuContributions({menus}, "en-US");
        expect(out.menus).toBe(getMergedModuleMenus("en-US"));
    });

    it("fills untranslated module keys from the fallback locale", () => {
        expect(getMergedModuleMenus("fr-FR")).toEqual({finance: {title: "Finance", invoices: {title: "Invoices"}}});
        expect((getMergedModuleMenus("de-CH").finance as Record<string, unknown>).invoices).toEqual({title: "Invoices"});
    });
});
