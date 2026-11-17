import {describe, expect, it, vi} from "vitest";
import {countryDisplayName} from "../countryName.ts";

// TD-F122: country names stayed English in every language ("United Kingdom", "Switzerland").
describe("country names", () => {
    it("names a country in the app's language from its code", () => {
        expect(countryDisplayName("CH", "Switzerland", "de-CH")).toBe("Schweiz");
        expect(countryDisplayName("gb", "United Kingdom", "it-IT")).toBe("Regno Unito");
    });

    it("names it in Albanian even where the browser has no Albanian region names", () => {
        // Like Chrome: no Albanian data, so Intl would answer in English.
        const supported = vi.spyOn(Intl.DisplayNames, "supportedLocalesOf").mockReturnValue([]);
        expect(countryDisplayName("GB", "United Kingdom", "sq-AL")).toBe("Mbretëria e Bashkuar");
        supported.mockRestore();
        expect(countryDisplayName("CH", "Switzerland", "sq-AL")).toBe("Zvicër");
    });

    it("keeps the stored name without a usable code or language", () => {
        expect(countryDisplayName(undefined, "Kosovo", "de-CH")).toBe("Kosovo");
        expect(countryDisplayName("XKX", "Kosovo", "de-CH")).toBe("Kosovo");
        expect(countryDisplayName("CH", "Switzerland", undefined)).toBe("Switzerland");
    });
});
