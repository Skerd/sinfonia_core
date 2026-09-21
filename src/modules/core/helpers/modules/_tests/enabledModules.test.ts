import {afterEach, describe, expect, it, vi} from "vitest";
import {parseModuleList, resolveModuleSelection} from "@coreModule/helpers/modules/moduleSelection.ts";

const manifest = {
    core: {},
    finance: {dependsOn: ["core"]},
    propertyManagement: {dependsOn: ["core"]},
    propertyDevelopment: {dependsOn: ["core", "propertyManagement"]},
    eCommerce: {dependsOn: ["core", "finance"]},
    broken: {dependsOn: ["ghost"]},
};

describe("parseModuleList", () => {
    it("treats unset or blank as all modules", () => {
        expect(parseModuleList(undefined)).toBeNull();
        expect(parseModuleList(" , ")).toBeNull();
    });

    it("trims and de-duplicates names", () => {
        expect(parseModuleList(" finance, eCommerce ,finance")).toEqual(["finance", "eCommerce"]);
    });
});

describe("resolveModuleSelection", () => {
    it("adds transitive dependencies and the always-enabled modules", () => {
        expect(resolveModuleSelection(["propertyDevelopment", "eCommerce"], manifest)).toEqual({
            modules: ["core", "eCommerce", "finance", "propertyDevelopment", "propertyManagement"],
            unknown: [],
        });
    });

    it("reports unknown names, including unknown dependencies", () => {
        expect(resolveModuleSelection(["ecommerce", "broken"], manifest).unknown).toEqual(["ecommerce", "ghost"]);
    });
});

describe("enabledModules", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    const load = async (value: string) => {
        vi.stubEnv("VITE_ENABLED_MODULES", value);
        vi.resetModules();
        return import("@coreModule/helpers/modules/enabledModules.ts");
    };

    it("enables everything when unset", async () => {
        const {isModuleEnabled, filterGlobByEnabledModules} = await load("");
        const glob = {"/src/modules/finance/a.ts": 1};
        expect(isModuleEnabled("anything")).toBe(true);
        expect(filterGlobByEnabledModules(glob)).toBe(glob);
    });

    it("keeps listed modules plus core", async () => {
        const {isModuleEnabled, filterGlobByEnabledModules} = await load("finance");
        expect(isModuleEnabled("finance")).toBe(true);
        expect(isModuleEnabled("core")).toBe(true);
        expect(isModuleEnabled("eCommerce")).toBe(false);
        expect(filterGlobByEnabledModules({
            "/src/modules/finance/a.ts": 1,
            "/src/modules/eCommerce/b.ts": 2,
            "/src/other/c.ts": 3,
        })).toEqual({"/src/modules/finance/a.ts": 1, "/src/other/c.ts": 3});
    });

    it("reads the module name from glob keys and Windows paths", async () => {
        const {moduleNameFromModulePath} = await load("");
        expect(moduleNameFromModulePath("/src/modules/eCommerce/clients/x.tsx")).toBe("eCommerce");
        expect(moduleNameFromModulePath("C:\\app\\src\\modules\\finance\\y.ts")).toBe("finance");
        expect(moduleNameFromModulePath("/src/other/z.ts")).toBeUndefined();
    });
});
