import {describe, expect, it} from "vitest";
import {catalogPriceLabel, formatCatalogPrice} from "../catalogCard.tsx";

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

describe("catalogPriceLabel", () => {
    const templates: Record<string, string> = {pricePerDay: "{price} / day", priceFrom: "from {price}", priceUpTo: "up to {price}"};
    const resolve = (key: string) => templates[key] ?? key;

    it("reads a task's budget as the most the client pays (D172)", () => {
        expect(catalogPriceLabel({amount: 200, currency: "EUR", upTo: true}, resolve)).toMatch(/^up to .*200/);
    });

    it("keeps the other price types and leaves a missing price out", () => {
        expect(catalogPriceLabel({amount: 60, currency: "EUR", per: "day"}, resolve)).toMatch(/60 \/ day$/);
        expect(catalogPriceLabel({amount: 60, currency: "EUR", from: true}, resolve)).toMatch(/^from .*60/);
        expect(catalogPriceLabel({amount: 60, currency: "EUR"}, resolve)).not.toMatch(/from|up to|day/);
        expect(catalogPriceLabel(undefined, resolve)).toBeNull();
    });
});
