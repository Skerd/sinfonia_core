import {describe, expect, it} from "vitest";
import {
    createRolesPermissionsContributions,
    defaultRoleBaseSlug,
} from "@coreModule/helpers/moduleContributions/loadRolesPermissionsContributions.ts";

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

describe("translateDefaultRole", () => {
    const {translateDefaultRole: translate, applyModuleRolesPermissionsContributions: applyRoles} = createRolesPermissionsContributions({
        [file("shop", "en-US")]: {roles: {shop_clerk: {name: "Shop clerk", description: "Sells things."}}},
        [file("shop", "fr-FR")]: {roles: {shop_clerk: {name: "Vendeur", description: "Vend des choses."}}},
        [file("shop", "de-CH")]: {roles: {shop_clerk: {name: "Verkäufer"}}},
        [file("core", "en-US")]: {roles: {sys_admin: {name: "SysAdmin", description: "Full access."}}},
        [file("core", "fr-FR")]: {roles: {sys_admin: {name: "Administrateur système", description: "Accès complet."}}},
    }, ["en-US"]);
    const clerk = {slug: "acme corp:default:shop_clerk", name: "Shop clerk", description: "Sells things."};

    it("reads the definition slug of default roles only", () => {
        expect(defaultRoleBaseSlug("acme:default:re_sales_agent")).toBe("re_sales_agent");
        expect(defaultRoleBaseSlug("acme:reserved:sys_admin")).toBe("sys_admin");
        expect(defaultRoleBaseSlug("acme:site_lead")).toBeNull();
        expect(defaultRoleBaseSlug(undefined)).toBeNull();
    });

    it("translates a default role's name and description", () => {
        expect(translate(clerk, "fr-FR")).toEqual({name: "Vendeur", description: "Vend des choses."});
    });

    it("translates core's own default roles", () => {
        expect(translate({slug: "acme:reserved:sys_admin", name: "SysAdmin", description: "Full access."}, "fr-FR"))
            .toEqual({name: "Administrateur système", description: "Accès complet."});
    });

    it("keeps the stored text of a field an administrator changed", () => {
        expect(translate({...clerk, name: "Front desk"}, "fr-FR")).toEqual({name: "Front desk", description: "Vend des choses."});
        expect(translate({...clerk, description: "Our own words."}, "fr-FR")).toEqual({name: "Vendeur", description: "Our own words."});
    });

    it("falls back to the stored text for an untranslated field", () => {
        expect(translate(clerk, "de-CH")).toEqual({name: "Verkäufer", description: "Sells things."});
        expect(translate(clerk, "it-IT")).toEqual({name: "Shop clerk", description: "Sells things."});
    });

    it("leaves custom roles and unknown default slugs alone", () => {
        expect(translate({slug: "acme:shop_clerk", name: "Shop clerk"}, "fr-FR")).toEqual({name: "Shop clerk", description: undefined});
        expect(translate({slug: "acme:default:gone", name: "Gone"}, "fr-FR")).toEqual({name: "Gone", description: undefined});
        expect(translate({name: "No slug"}, "fr-FR")).toEqual({name: "No slug", description: undefined});
    });

    it("never merges role labels or core's file into the permissions table", () => {
        expect(applyRoles({groups: {Users: "Users"}}, "fr-FR")).toEqual({groups: {Users: "Users"}});
    });
});
