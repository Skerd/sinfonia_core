import {describe, expect, it} from "vitest";
import {formatCatalogPrice} from "../catalogCard.tsx";

describe("formatCatalogPrice", () => {
    // Cards showed a €12.50 product as "€13" and a €7.50 one as "€8": formatCurrency rounds to whole units.
    it("keeps the cents of a price that has them", () => {
        expect(formatCatalogPrice(12.5, "EUR")).toMatch(/12[.,]50/);
        expect(formatCatalogPrice(7.5, "EUR")).toMatch(/7[.,]50/);
    });

    it("shows a whole amount without decimals", () => {
        expect(formatCatalogPrice(250000, "EUR")).toMatch(/250[.,\s\u202f]?000$/);
    });

    it("uses the currency's own precision", () => {
        expect(formatCatalogPrice(1.234, "KWD")).toMatch(/1[.,]234/);
    });
});
