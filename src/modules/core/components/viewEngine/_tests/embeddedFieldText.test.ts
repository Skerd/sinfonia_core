import {describe, expect, it} from "vitest";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {formatNumber} from "@coreModule/helpers/general/numbers.ts";
import {resolveEmbeddedFieldText} from "../sheet/widgets/embeddedItems/fieldText.ts";

const resolveLanguageKey = ((key: string) => key) as Parameters<typeof resolveEmbeddedFieldText>[2];
const euro = {symbol: "€", abbreviation: "EUR", decimalPlaces: 2};

describe("sheet item list money and dates (TD-F59)", () => {
    it("shows an amount at its currency's decimals with the symbol in front, like sheet cards", () => {
        const field = {name: "amount", type: "text" as const, currencyField: "currency"};
        expect(resolveEmbeddedFieldText({amount: 12.5, currency: euro}, field, resolveLanguageKey)).toBe(`€ ${formatNumber(12.5, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
        expect(resolveEmbeddedFieldText({amount: 1500, currency: {abbreviation: "JPY", decimalPlaces: 0}}, field, resolveLanguageKey)).toBe(`JPY ${formatNumber(1500, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`);
        // No currency on the item: the number alone, still at two decimals.
        expect(resolveEmbeddedFieldText({amount: 17.6}, field, resolveLanguageKey)).toBe(formatNumber(17.6, {minimumFractionDigits: 2, maximumFractionDigits: 2}));
        expect(resolveEmbeddedFieldText({amount: ""}, field, resolveLanguageKey)).toBe("");
    });

    it("shows a date and time in the panel's one format, without seconds", () => {
        const at = "2026-11-11T20:17:27.000Z";
        const text = resolveEmbeddedFieldText({at}, {name: "at", type: "text", format: "dateTime"}, resolveLanguageKey);
        expect(text).toBe(formatDate(at, {format: DATE_FORMATS.mediumDateTime}));
        expect(text).not.toContain(":27");
    });
});
