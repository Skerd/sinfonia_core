import {describe, expect, it} from "vitest";
import type {PlatformModule} from "armonia/src/modules/core/api/platform/private/companies/platformModules.dto.ts";
import {
    dependenciesOf,
    selectedDependentsOf,
    toggleModule,
} from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/dialogs/companyModuleSelection.ts";

const module = (name: string, dependsOn: string[] = ["core"]): PlatformModule =>
    ({name, dependsOn, required: name === "core", installed: true});
const catalog = [
    module("core", []),
    module("finance"),
    module("eCommerce", ["core", "finance"]),
    module("propertyManagement"),
    module("propertyDevelopment", ["core", "propertyManagement"]),
];

describe("company module selection", () => {
    it("resolves dependencies transitively", () => {
        expect(dependenciesOf("eCommerce", catalog).sort()).toEqual(["core", "finance"]);
        expect(dependenciesOf("core", catalog)).toEqual([]);
    });

    it("checking a module adds what it needs", () => {
        expect(toggleModule(["core"], "eCommerce", true, catalog).sort()).toEqual(["core", "eCommerce", "finance"]);
    });

    it("unchecking removes only that module", () => {
        expect(toggleModule(["core", "finance", "eCommerce"], "eCommerce", false, catalog)).toEqual(["core", "finance"]);
    });

    it("names the checked modules that block unchecking a dependency", () => {
        const selected = ["core", "finance", "eCommerce", "propertyManagement"];
        expect(selectedDependentsOf("finance", selected, catalog)).toEqual(["eCommerce"]);
        expect(selectedDependentsOf("propertyManagement", selected, catalog)).toEqual([]);
    });
});
