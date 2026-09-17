import {describe, expect, it} from "vitest";
import {createRolesPermissionsContributions} from "@baseModule/helpers/moduleContributions/loadRolesPermissionsContributions.ts";

const file = (pkg: string, locale: string) => `/src/modules/${pkg}/assets/languages/${locale}/rolesPermissions.json`;
const {applyModuleRolesPermissionsContributions: apply} = createRolesPermissionsContributions({
    [file("shop", "en-US")]: {
        groups: {Products: "Products"},
        permissions: {Products: {sku: "SKU", name: "Name"}},
    },
    [file("shop", "fr-FR")]: {permissions: {Products: {sku: "Référence"}}},
    [file("core", "en-US")]: {groups: {Users: "Core should be skipped"}},
}, ["en-US"]);

describe("createRolesPermissionsContributions", () => {
    it.each([
        ["a dictionary without either section", {title: "x"}],
        ["sections that are not dictionaries", {groups: "x", permissions: ["y"]}],
    ])("leaves %s untouched", (_label, language) => {
        expect(apply(language, "en-US")).toBe(language);
    });

    it("merges into both sections, keeping core labels", () => {
        const language = {groups: {Users: "Users"}, permissions: {Users: {email: "Email"}}, read: "Read"};
        expect(apply(language, "en-US")).toEqual({
            read: "Read",
            groups: {Users: "Users", Products: "Products"},
            permissions: {Users: {email: "Email"}, Products: {sku: "SKU", name: "Name"}},
        });
    });

    it("fills a missing section when the other one exists", () => {
        expect(apply({groups: {}}, "en-US")).toEqual({
            groups: {Products: "Products"},
            permissions: {Products: {sku: "SKU", name: "Name"}},
        });
    });

    it("lets module labels win over core labels for the same key", () => {
        const out = apply({groups: {Products: "Old"}}, "en-US");
        expect(out.groups).toEqual({Products: "Products"});
    });

    it("does not mutate the input", () => {
        const language = {groups: {Users: "Users"}};
        apply(language, "en-US");
        expect(language).toEqual({groups: {Users: "Users"}});
    });

    it("uses fallback labels for untranslated keys", () => {
        expect(apply({permissions: {}}, "fr-FR")).toEqual({
            groups: {Products: "Products"},
            permissions: {Products: {sku: "Référence", name: "Name"}},
        });
    });

    it("ignores fragment sections that are not dictionaries", () => {
        const odd = createRolesPermissionsContributions({
            [file("shop", "en-US")]: {groups: ["x"], permissions: {A: "a"}},
        }, ["en-US"]);
        const language = {groups: {Users: "Users"}};
        expect(odd.applyModuleRolesPermissionsContributions(language, "en-US")).toEqual({
            groups: {Users: "Users"},
            permissions: {A: "a"},
        });
    });

    it("returns the input when the fragment contributes nothing", () => {
        const none = createRolesPermissionsContributions({}, ["en-US"]);
        const language = {groups: {Users: "Users"}};
        expect(none.applyModuleRolesPermissionsContributions(language, "en-US")).toBe(language);
    });
});
