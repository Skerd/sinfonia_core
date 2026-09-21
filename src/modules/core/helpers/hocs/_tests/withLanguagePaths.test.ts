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
    "src/modules/core/components/custom/commandPalette/commandPalette.tsx": ["src/modules/core/clients/panel/private/sidebar/index.tsx"],
    "src/modules/core/components/customUnchecked/polygonSelector.tsx": ["src/modules/core/components/custom/polygonSelector.tsx"],
    "src/modules/core/components/entityPage/filters/filterBuilder/filterBuilder.tsx": ["src/modules/core/components/custom/filterBuilder/filterBuilder.tsx"],
    "src/modules/core/components/entityPage/filters/filterBuilder/filterBuilderContext.tsx": ["src/modules/core/components/custom/filterBuilder/filterBuilderContext.tsx"],
    "src/modules/core/components/entityPage/filters/filterBuilder/filterChip.tsx": ["src/modules/core/components/custom/filterBuilder/filterChip.tsx"],
    "src/modules/core/components/entityPage/filters/filterBuilder/filterGroup.tsx": ["src/modules/core/components/custom/filterBuilder/filterGroup.tsx"],
    "src/modules/core/components/entityPage/filters/filterBuilder/filterRule.tsx": ["src/modules/core/components/custom/filterBuilder/filterRule.tsx"],
    "src/modules/core/components/entityPage/filters/filterBuilder/filterValueInput.tsx": ["src/modules/core/components/custom/filterBuilder/filterValueInput.tsx"],
    "src/modules/core/components/entityPage/filters/quickFilterBar.tsx": ["src/modules/core/components/entityPage/quickFilterBar.tsx"],
    "src/modules/core/components/entityPage/list/cardAndTableView.tsx": ["src/modules/core/components/custom/cardAndTableView.tsx"],
    "src/modules/core/components/viewEngine/sheet/widgets/addresses/sheetEmbeddedAddressCard.tsx": ["src/modules/core/components/custom/addresses/formAddressWithMap.tsx"],
    "src/modules/core/components/viewEngine/widgets/actions/deleteAction.tsx": ["src/modules/core/components/custom/actions/deleteAction.tsx"],
    "src/modules/core/components/viewEngine/widgets/actions/dropdowns/deleteDropdown.tsx": ["src/modules/core/components/custom/actions/dropdowns/deleteDropdown.tsx"],
    "src/modules/core/components/viewEngine/widgets/actions/dropdowns/editDropdown.tsx": ["src/modules/core/components/custom/actions/dropdowns/editDropdown.tsx"],
    "src/modules/core/components/viewEngine/widgets/actions/dropdowns/restoreDropdown.tsx": ["src/modules/core/components/custom/actions/dropdowns/restoreDropdown.tsx"],
    "src/modules/core/components/viewEngine/widgets/actions/dropdowns/viewDropdown.tsx": ["src/modules/core/components/custom/actions/dropdowns/viewDropdown.tsx"],
    "src/modules/core/components/viewEngine/widgets/actions/restoreAction.tsx": ["src/modules/core/components/custom/actions/restoreAction.tsx"],
    "src/modules/core/components/viewEngine/widgets/addresses/formAddressWithMap.tsx": ["src/modules/core/components/custom/addresses/formAddressWithMap.tsx"],
    "src/modules/core/components/viewEngine/widgets/display/deletedInfo.tsx": ["src/modules/core/components/custom/deletedInfo/index.tsx"],
    "src/modules/core/components/viewEngine/widgets/display/expandableText.tsx": ["src/modules/core/components/custom/expandableText.tsx"],
    "src/modules/core/components/viewEngine/widgets/inputs/apiSelect/adapters/createUserInlineAdapter.tsx": ["src/modules/core/clients/panel/private/users/createUser/index.tsx"],
    "src/modules/core/components/viewEngine/widgets/inputs/apiSelect/apiSelect.tsx": ["src/modules/core/components/custom/apiSelect/index.tsx"],
    "src/modules/core/components/viewEngine/widgets/inputs/formMaxLengthControl.tsx": ["src/modules/core/components/custom/formMaxLengthControl.tsx"],
    "src/modules/core/components/viewEngine/widgets/inputs/simpleSelect.tsx": ["src/modules/core/components/custom/simpleSelect/index.tsx"],
    "src/modules/core/components/viewEngine/widgets/media/mediaField.tsx": ["src/modules/core/components/custom/files/mediaField.tsx"],
    "src/modules/core/components/viewEngine/widgets/media/singleFile.tsx": ["src/modules/core/components/custom/files/singleFile.tsx"],
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
