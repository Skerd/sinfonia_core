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
    "src/modules/base/components/viewEngine/sheet/widgets/addresses/sheetEmbeddedAddressCard.tsx": ["src/modules/core/components/custom/addresses/formAddressWithMap.tsx"],

    /*
     * Migration-temporary: these components sit under `base/` for now but keep their dictionaries
     * in `core/assets/languages`, where they stay once the package moves back into core. Drop the
     * entry (not the JSON) as each component returns to `src/modules/core/…`.
     */
    "src/modules/base/components/custom/commandPalette/commandPalette.tsx": ["src/modules/core/components/custom/commandPalette/commandPalette.tsx"],
    "src/modules/base/components/custom/confirmDialog.tsx": ["src/modules/core/components/custom/confirmDialog.tsx"],
    "src/modules/base/components/custom/copyTooltip.tsx": ["src/modules/core/components/custom/copyTooltip.tsx"],
    "src/modules/base/components/custom/customDateDisplayer.tsx": ["src/modules/core/components/custom/customDateDisplayer.tsx"],
    "src/modules/base/components/custom/deletedTooltip.tsx": ["src/modules/core/components/custom/deletedTooltip.tsx"],
    "src/modules/base/components/custom/errors/errorViewWrapper.tsx": ["src/modules/core/components/custom/errors/errorViewWrapper.tsx"],
    "src/modules/base/components/custom/hiddenElement.tsx": ["src/modules/core/components/custom/hiddenElement.tsx"],
    "src/modules/base/components/custom/inputs/iconPickerInput.tsx": ["src/modules/core/components/custom/inputs/iconPickerInput.tsx"],
    "src/modules/base/components/custom/loader/loader.tsx": ["src/modules/core/components/custom/loader/loader.tsx"],
    "src/modules/base/components/custom/notifications/notificationBell.tsx": ["src/modules/core/components/custom/notifications/notificationBell.tsx"],
    "src/modules/base/components/custom/pages/forbidden.tsx": ["src/modules/core/components/custom/pages/forbidden.tsx"],
    "src/modules/base/components/custom/pages/notFound.tsx": ["src/modules/core/components/custom/pages/notFound.tsx"],
    "src/modules/base/components/custom/paginator/index.tsx": ["src/modules/core/components/custom/paginator/index.tsx"],
    "src/modules/base/components/custom/passwordStrength.tsx": ["src/modules/core/components/custom/passwordStrength.tsx"],
    "src/modules/base/components/custom/preferences/languageSwitch.tsx": ["src/modules/core/components/custom/preferences/languageSwitch.tsx"],
    "src/modules/base/components/custom/preferences/themeSwitch.tsx": ["src/modules/core/components/custom/preferences/themeSwitch.tsx"],
    "src/modules/base/components/custom/sessionSetupScreen.tsx": ["src/modules/core/components/custom/sessionSetupScreen.tsx"],
    "src/modules/base/components/custom/valueNotSet.tsx": ["src/modules/core/components/custom/valueNotSet.tsx"],
    "src/modules/base/components/entityPage/filters/filterBuilder/filterBuilder.tsx": ["src/modules/core/components/custom/filterBuilder/filterBuilder.tsx"],
    "src/modules/base/components/entityPage/filters/filterBuilder/filterBuilderContext.tsx": ["src/modules/core/components/custom/filterBuilder/filterBuilderContext.tsx"],
    "src/modules/base/components/entityPage/filters/filterBuilder/filterChip.tsx": ["src/modules/core/components/custom/filterBuilder/filterChip.tsx"],
    "src/modules/base/components/entityPage/filters/filterBuilder/filterGroup.tsx": ["src/modules/core/components/custom/filterBuilder/filterGroup.tsx"],
    "src/modules/base/components/entityPage/filters/filterBuilder/filterRule.tsx": ["src/modules/core/components/custom/filterBuilder/filterRule.tsx"],
    "src/modules/base/components/entityPage/filters/filterBuilder/filterValueInput.tsx": ["src/modules/core/components/custom/filterBuilder/filterValueInput.tsx"],
    "src/modules/base/components/entityPage/filters/quickFilterBar.tsx": ["src/modules/core/components/entityPage/quickFilterBar.tsx"],
    "src/modules/base/components/entityPage/list/cardAndTableView.tsx": ["src/modules/core/components/custom/cardAndTableView.tsx"],
    "src/modules/base/components/viewEngine/audit/sheetAuditHistory.tsx": ["src/modules/core/components/viewEngine/audit/sheetAuditHistory.tsx"],
    "src/modules/base/components/viewEngine/sheet/widgets/embeddedItems/sheetEmbeddedItemsList.tsx": ["src/modules/core/components/viewEngine/sheet/widgets/embeddedItems/sheetEmbeddedItemsList.tsx"],
    "src/modules/base/components/viewEngine/sheet/widgets/references/referencesViewModeToggle.tsx": ["src/modules/core/components/viewEngine/sheet/widgets/references/referencesViewModeToggle.tsx"],
    "src/modules/base/components/viewEngine/sheet/widgets/references/sheetPaginatedReferenceCardList.tsx": ["src/modules/core/components/viewEngine/sheet/widgets/references/sheetPaginatedReferenceCardList.tsx"],
    "src/modules/base/components/viewEngine/widgets/actions/deleteAction.tsx": ["src/modules/core/components/custom/actions/deleteAction.tsx"],
    "src/modules/base/components/viewEngine/widgets/actions/dropdowns/deleteDropdown.tsx": ["src/modules/core/components/custom/actions/dropdowns/deleteDropdown.tsx"],
    "src/modules/base/components/viewEngine/widgets/actions/dropdowns/editDropdown.tsx": ["src/modules/core/components/custom/actions/dropdowns/editDropdown.tsx"],
    "src/modules/base/components/viewEngine/widgets/actions/dropdowns/restoreDropdown.tsx": ["src/modules/core/components/custom/actions/dropdowns/restoreDropdown.tsx"],
    "src/modules/base/components/viewEngine/widgets/actions/dropdowns/viewDropdown.tsx": ["src/modules/core/components/custom/actions/dropdowns/viewDropdown.tsx"],
    "src/modules/base/components/viewEngine/widgets/actions/restoreAction.tsx": ["src/modules/core/components/custom/actions/restoreAction.tsx"],
    "src/modules/base/components/viewEngine/widgets/addresses/formAddressWithMap.tsx": ["src/modules/core/components/custom/addresses/formAddressWithMap.tsx"],
    "src/modules/base/components/viewEngine/widgets/display/deletedInfo.tsx": ["src/modules/core/components/custom/deletedInfo/index.tsx"],
    "src/modules/base/components/viewEngine/widgets/display/expandableText.tsx": ["src/modules/core/components/custom/expandableText.tsx"],
    "src/modules/base/components/viewEngine/widgets/inputs/apiSelect/apiSelect.tsx": ["src/modules/core/components/custom/apiSelect/index.tsx"],
    "src/modules/base/components/viewEngine/widgets/inputs/formMaxLengthControl.tsx": ["src/modules/core/components/custom/formMaxLengthControl.tsx"],
    "src/modules/base/components/viewEngine/widgets/inputs/simpleSelect.tsx": ["src/modules/core/components/custom/simpleSelect/index.tsx"],
    "src/modules/base/components/viewEngine/widgets/media/mediaField.tsx": ["src/modules/core/components/custom/files/mediaField.tsx"],
    "src/modules/base/components/viewEngine/widgets/media/singleFile.tsx": ["src/modules/core/components/custom/files/singleFile.tsx"],
    "src/modules/base/components/viewEngine/widgets/inputs/apiSelect/adapters/createUserInlineAdapter.tsx": ["src/modules/core/clients/panel/private/users/createUser/index.tsx"],
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
