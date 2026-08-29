import {describe, expect, it} from "vitest";
import {apiNamespace, groupByModule, moduleForModel, OTHER_MODULE_ID} from "./studioModules.ts";

function entry(collection: string, module: string) {
    return {collection, module};
}

describe("apiNamespace", () => {
    it("reads the segment after /api", () => {
        expect(apiNamespace("/api/realEstate/unit/sale")).toBe("realEstate");
        expect(apiNamespace("/api/eCommerce/product")).toBe("eCommerce");
    });

    it("is undefined without an apiUrl", () => {
        expect(apiNamespace(undefined)).toBeUndefined();
    });
});

describe("moduleForModel", () => {
    it("maps a view's api namespace to its module", () => {
        expect(moduleForModel("units", "/api/realEstate/unit")).toBe("propertyManagement");
        expect(moduleForModel("countries", "/api/auxiliary/country")).toBe("core");
        expect(moduleForModel("currencies", "/api/finance/currency")).toBe("finance");
    });

    it("does not confuse eCommerce with eCommerceMarketplace", () => {
        expect(moduleForModel("products", "/api/eCommerce/product")).toBe("eCommerce");
        expect(moduleForModel("listings", "/api/eCommerceMarketplace/listing")).toBe(
            "eCommerceMarketplace",
        );
    });

    it("falls back to the collection map for models with no views", () => {
        expect(moduleForModel("users")).toBe("core");
        expect(moduleForModel("cronexecutions")).toBe("core");
    });

    it("buckets an unknown namespace rather than guessing", () => {
        expect(moduleForModel("widgets", "/api/somethingNew/widget")).toBe(OTHER_MODULE_ID);
        expect(moduleForModel("widgets")).toBe(OTHER_MODULE_ID);
    });
});

describe("groupByModule", () => {
    it("orders groups by module and keeps the given entry order", () => {
        const groups = groupByModule([
            entry("products", "eCommerce"),
            entry("countries", "core"),
            entry("units", "propertyManagement"),
            entry("widgets", OTHER_MODULE_ID),
            entry("cities", "core"),
            entry("edifices", "propertyManagement"),
        ]);

        expect(groups.map((group) => group.id)).toEqual([
            "core",
            "propertyManagement",
            "eCommerce",
            OTHER_MODULE_ID,
        ]);
        expect(groups[0]!.label).toBe("Core");
        expect(groups[0]!.entries.map((e) => e.collection)).toEqual(["countries", "cities"]);
    });

    it("drops empty groups and keeps `other` last, after unknown modules", () => {
        const groups = groupByModule([
            entry("widgets", OTHER_MODULE_ID),
            entry("gadgets", "someFutureModule"),
        ]);

        expect(groups.map((group) => group.id)).toEqual(["someFutureModule", OTHER_MODULE_ID]);
    });
});
