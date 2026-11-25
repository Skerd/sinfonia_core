// Loads the real module contributions (no mocks): catches malformed attach files, id clashes and
// wiring breaks that the fake-glob unit tests cannot see. Module-specific checks only run when
// that module is enabled (`VITE_ENABLED_MODULES`) and present: a deploy clones only its own modules.
import {existsSync} from "node:fs";
import {join} from "node:path";
import {describe, expect, it} from "vitest";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {isModuleEnabled} from "@coreModule/helpers/modules/enabledModules.ts";
import {SITE_ROOM_ID_PATTERN} from "@coreModule/helpers/websocket/resolveSiteRoom.ts";
import {getSortedSidebarContributions, getModuleSidebarNavGroups} from "../loadSidebarContributions.ts";
import {getTenancySettingsSubCollapsibles} from "../loadTenancySettingsContributions.ts";
import {getAccountNavItems} from "../loadAccountNavContributions.ts";
import {runRouteConfigContributions} from "../loadRouteConfigContributions.ts";
import {resolveCenterPanelClassName} from "../loadPanelLayoutContributions.ts";
import {getAuthPanelComponents, resolveAuthPanelComponent} from "../loadAuthPanelContributions.ts";
import {getContributedPathRoomOverrides, getContributedSystemSettingsRooms} from "../loadSiteRoomContributions.ts";
import {getSortedWidgetContributions} from "../loadWidgetContributions.ts";
import {getAccountSettingsNotificationSections} from "../loadAccountSettingsContributions.ts";
import {getMergedModuleMenus} from "../loadMenuLanguageContributions.ts";
import {getMergedModuleRolesPermissions} from "../loadRolesPermissionsContributions.ts";
import {CORE_AUTH_PANEL_KEYS} from "../coreAuthPanelKeys.ts";
import {getStudioPages} from "../loadStudioRouteContributions.ts";
import {getNotificationTypeGroups, notificationMessage} from "../loadNotificationTypesContributions.ts";

const resolve = ((key: string) => key) as ResolveLanguageKey;
const MODULES_ROOT = join(__dirname, "../../../..");
const itIf = (moduleName: string) =>
    (isModuleEnabled(moduleName) && existsSync(join(MODULES_ROOT, moduleName)) ? it : it.skip);
const expectUniqueIds = (entries: readonly {id?: string}[]) => {
    const ids = entries.map((entry) => entry.id).filter((id) => id !== undefined);
    expect(ids).toEqual([...new Set(ids)]);
};

describe("real module contributions", () => {
    // TD-B173: core notices are translated; security notices cannot be turned off, so they are not listed.
    it("translate core notices and list only the ones a user may turn off", () => {
        expect(notificationMessage({code: "ACCOUNT_STATUS_CHANGED_BY_ADMIN", params: {actor: "Ada", variant: "activated"}}, "de-CH"))
            .toBe("Ada hat Ihr Konto für diese Firma aktiviert");
        const listed = getNotificationTypeGroups("en-US").flatMap((group) => group.types.map((type) => type.code));
        expect(listed).toContain("MESSAGE_MENTIONED");
        expect(listed).not.toContain("USER_LOGGED_IN");
        expect(listed).not.toContain("MFA_DISABLED");
    });

    // TD-B173: the role notice showed the stored (English) default-role name.
    it("translate default role names in role notices and keep custom names", () => {
        const notice = {
            code: "ROLE_ASSIGNED",
            params: {assigner: "Ada", role: "General Administrator, Night shift", roleSlugs: "acme:reserved:general_administrator,acme:night-shift"},
        };
        expect(notificationMessage(notice, "de-CH")).toBe("Ada hat Ihnen die Rolle zugewiesen: Hauptadministrator, Night shift");
        expect(notificationMessage({...notice, params: {...notice.params, roleSlugs: "acme:reserved:general_administrator"}}, "de-CH"))
            .toBe("Ada hat Ihnen die Rolle zugewiesen: General Administrator, Night shift");
    });

    it("parse, and have unique ids per kind", () => {
        expectUniqueIds(getSortedSidebarContributions());
        expectUniqueIds(getSortedWidgetContributions());
        expect(() => getTenancySettingsSubCollapsibles(resolve)).not.toThrow();
        expect(() => getAccountNavItems(resolve)).not.toThrow();
        expect(() => getAuthPanelComponents()).not.toThrow();
        expect(() => getContributedPathRoomOverrides()).not.toThrow();
        expect(() => getAccountSettingsNotificationSections({})).not.toThrow();
        expect(() => getStudioPages()).not.toThrow();
    });

    itIf("propertyDevelopment")("serve the property development system map and workflow in the Studio, not the panel", () => {
        expect(getStudioPages().map((page) => page.path)).toEqual(
            expect.arrayContaining(["propertyDevelopment/systemMap", "propertyDevelopment/workflow"]),
        );
        for (const subview of ["systemmap", "workflow"]) {
            expect(runRouteConfigContributions({
                menu: "propertyDevelopment",
                subview,
                segments: ["propertyDevelopment", subview],
                searchParams: new URLSearchParams(),
                resolveLanguageKey: resolve,
            })).toBeUndefined();
        }
    });

    it("give account-settings notification sections unique ids", () => {
        const sections = getAccountSettingsNotificationSections({});
        const ids = sections.map((s) => s.id);
        expect(ids).toEqual([...new Set(ids)]);
        expect(sections.every((s) => typeof s.render === "function")).toBe(true);
    });

    itIf("propertyManagement")("contribute the real-estate marketing preferences section", () => {
        const ids = getAccountSettingsNotificationSections({}).map((s) => s.id);
        expect(ids).toContain("propertyManagement:marketingPreferences");
    });

    itIf("propertyManagement")("keep the marketing preferences section when an admin inspects another user", () => {
        const ids = getAccountSettingsNotificationSections({specificUserId: "someone-else"}).map((s) => s.id);
        expect(ids).toContain("propertyManagement:marketingPreferences");
    });

    it("keep the core sidebar groups around the module groups", () => {
        const ids = getSortedSidebarContributions().map((c) => c.id);
        expect(ids[0]).toBe("core-company");
        expect(ids.slice(-2)).toEqual(["core-account", "core-tenancy"]);

        const titles = getModuleSidebarNavGroups(resolve).map((g) => g.title);
        expect(titles[0]).toBe("menus.company.title");
        expect(titles.at(-1)).toBe("menus.tenancy.title");
    });

    it("never let a module claim a core auth panel", () => {
        for (const key of CORE_AUTH_PANEL_KEYS) {
            expect(resolveAuthPanelComponent(key)).toBeUndefined();
        }
        expect(resolveAuthPanelComponent("constructor")).toBeUndefined();
    });

    itIf("eCommerce")("wire the eCommerce auth panel and POS layout", () => {
        expect(resolveAuthPanelComponent("resetPosManagerPin")).toBeDefined();
        expect(resolveCenterPanelClassName({menu: "eCommerce", subview: "pos", isMobile: false})).toBe("overflow-hidden");
        expect(resolveCenterPanelClassName({menu: "eCommerce", subview: "orders", isMobile: false})).toBeUndefined();
    });

    it("contribute only valid site-room ids", () => {
        const rooms = {...getContributedSystemSettingsRooms(), ...getContributedPathRoomOverrides()};
        for (const room of Object.values(rooms)) {
            expect(room).toMatch(SITE_ROOM_ID_PATTERN);
        }
    });

    itIf("finance")("contribute the finance gift card room", () => {
        expect(getContributedSystemSettingsRooms().giftcards).toBe("giftCards_configurations");
    });

    itIf("propertyManagement")("contribute the property management rooms", () => {
        expect(getContributedSystemSettingsRooms().unitTypes).toBe("unitTypes_configurations");
    });

    it("leave unknown menus to core", () => {
        expect(runRouteConfigContributions({
            menu: "__noSuchMenu__",
            subview: "x",
            segments: ["__noSuchMenu__", "x"],
            searchParams: new URLSearchParams(),
            resolveLanguageKey: resolve,
        })).toBeUndefined();
    });

    itIf("finance")("translate finance menus in every locale, falling back to en-US (fr-FR has no file)", () => {
        const english = getMergedModuleMenus("en-US");
        const french = getMergedModuleMenus("fr-FR");
        expect(english.finance).toBeDefined();
        expect(Object.keys(french.finance as object)).toEqual(expect.arrayContaining(Object.keys(english.finance as object)));
    });

    it("give every locale at least the en-US module menu and permission keys", () => {
        const topLevel = (dictionary: Record<string, unknown>) => Object.keys(dictionary).sort();
        for (const locale of ["de-CH", "fr-FR", "it-IT", "sq-AL"]) {
            expect(topLevel(getMergedModuleMenus(locale))).toEqual(expect.arrayContaining(topLevel(getMergedModuleMenus("en-US"))));
            const permissions = getMergedModuleRolesPermissions(locale).permissions as Record<string, unknown> | undefined;
            const englishPermissions = getMergedModuleRolesPermissions("en-US").permissions as Record<string, unknown> | undefined;
            expect(topLevel(permissions ?? {})).toEqual(expect.arrayContaining(topLevel(englishPermissions ?? {})));
        }
    });
});
