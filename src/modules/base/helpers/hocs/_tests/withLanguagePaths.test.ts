// @vitest-environment node
import {readdirSync, readFileSync} from "node:fs";
import {join, relative, sep} from "node:path";
import {describe, expect, it} from "vitest";

/**
 * `withLanguage("src/…")` paths are typed by hand, so a copy-pasted component can silently load
 * another file's dictionary. Each literal must be the calling file's own path, unless the file
 * deliberately shares a dictionary and is listed here (caller → dictionary it loads).
 */
const SHARED_DICTIONARIES: Record<string, string[]> = {
    "src/modules/core/clients/panel/private/home/PanelHomePage.tsx": ["src/modules/core/clients/panel/private/sidebar/index.tsx"],
    "src/modules/core/components/custom/commandPalette.tsx": ["src/modules/core/clients/panel/private/sidebar/index.tsx"],
    "src/modules/base/components/viewEngine/sheet/widgets/addresses/sheetEmbeddedAddressCard.tsx": ["src/modules/core/components/custom/addresses/formAddressWithMap.tsx"],

    /*
     * Migration-temporary: these components sit under `base/` for now but keep their dictionaries
     * in `core/assets/languages`, where they stay once the package moves back into core. Drop the
     * entry (not the JSON) as each component returns to `src/modules/core/…`.
     */
    "src/modules/base/components/custom/loader/loader.tsx": ["src/modules/core/components/custom/loader/loader.tsx"],
    "src/modules/base/components/custom/sessionSetupScreen.tsx": ["src/modules/core/components/custom/sessionSetupScreen.tsx"],
    "src/modules/base/components/entityPage/quickFilterBar.tsx": ["src/modules/core/components/entityPage/quickFilterBar.tsx"],
    "src/modules/base/components/viewEngine/audit/sheetAuditHistory.tsx": ["src/modules/core/components/viewEngine/audit/sheetAuditHistory.tsx"],
    "src/modules/base/components/viewEngine/sheet/widgets/embeddedItems/sheetEmbeddedItemsList.tsx": ["src/modules/core/components/viewEngine/sheet/widgets/embeddedItems/sheetEmbeddedItemsList.tsx"],
    "src/modules/base/components/viewEngine/sheet/widgets/references/referencesViewModeToggle.tsx": ["src/modules/core/components/viewEngine/sheet/widgets/references/referencesViewModeToggle.tsx"],
    "src/modules/base/components/viewEngine/sheet/widgets/references/sheetPaginatedReferenceCardList.tsx": ["src/modules/core/components/viewEngine/sheet/widgets/references/sheetPaginatedReferenceCardList.tsx"],
    "src/modules/core/components/custom/apiSelect/adapters/createUserInlineAdapter.tsx": ["src/modules/core/clients/panel/private/users/createUser/index.tsx"],
    "src/modules/eCommerce/clients/panel/private/posConfigs/center/actions/posConfigsBulkMenu.tsx": ["src/modules/eCommerce/clients/panel/private/posConfigs/index.tsx"],
    "src/modules/propertyManagement/clients/panel/private/unitCosts/paymentCalendarTab.tsx": ["src/modules/propertyManagement/clients/panel/private/unitCosts/index.tsx"],
    "src/modules/propertyManagement/clients/client/public/shared/sections/contactLeadColumn.tsx": ["src/modules/propertyManagement/clients/client/public/contact/index.tsx"],
    "src/modules/propertyManagement/clients/client/public/shared/favorites/publicFavoritesPanelHost.tsx": ["src/modules/propertyManagement/clients/client/public/projects/index.tsx"],
    "src/modules/propertyManagement/clients/client/public/developers/sections/developersCatalogSection.tsx": ["src/modules/propertyManagement/clients/client/public/contact/index.tsx"],
};

const SINFONIA_ROOT = join(__dirname, "../../../../../..");
const WITH_LANGUAGE_LITERAL = /withLanguage\(\s*["'`](src\/[^"'`$]+)["'`]\s*\)/g;

function sourceFiles(dir: string): string[] {
    return readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) return sourceFiles(full);
        return /\.(tsx|ts)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [full] : [];
    });
}

describe("withLanguage paths", () => {
    const calls = sourceFiles(join(SINFONIA_ROOT, "src")).flatMap((file) => {
        const caller = relative(SINFONIA_ROOT, file).split(sep).join("/");
        return [...readFileSync(file, "utf8").matchAll(WITH_LANGUAGE_LITERAL)].map((match) => ({caller, path: match[1]}));
    });

    it("finds the withLanguage call sites", () => {
        expect(calls.length).toBeGreaterThan(100);
    });

    it("uses the calling file's own path unless the shared dictionary is listed", () => {
        const unexpected = calls
            .filter(({caller, path}) => path !== caller && !SHARED_DICTIONARIES[caller]?.includes(path))
            .map(({caller, path}) => `${caller} → ${path}`);

        expect(unexpected).toEqual([]);
    });

    it("keeps the shared-dictionary list free of stale entries", () => {
        const stale = Object.entries(SHARED_DICTIONARIES).flatMap(([caller, paths]) =>
            paths
                .filter((path) => !calls.some((call) => call.caller === caller && call.path === path))
                .map((path) => `${caller} → ${path}`),
        );

        expect(stale).toEqual([]);
    });
});
