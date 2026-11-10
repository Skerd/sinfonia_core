import {describe, expect, it} from "vitest";
import {preferredLanguageToStore, toSupportedLocale} from "@coreModule/helpers/general/preferredLanguage.ts";

describe("preferredLanguageToStore (D128)", () => {
    it("stores the panel language on sign-in only while the user has none", () => {
        expect(preferredLanguageToStore({previous: null, current: "de-CH", stored: undefined})).toBe("de-CH");
        expect(preferredLanguageToStore({previous: null, current: "de-CH", stored: "fr-FR"})).toBeUndefined();
    });

    it("stores a language the user switches the panel to, and nothing when it is already stored", () => {
        expect(preferredLanguageToStore({previous: "fr-FR", current: "it-IT", stored: "fr-FR"})).toBe("it-IT");
        expect(preferredLanguageToStore({previous: "fr-FR", current: "it-IT", stored: "it-IT"})).toBeUndefined();
        expect(preferredLanguageToStore({previous: "fr-FR", current: "fr-FR", stored: "de-CH"})).toBeUndefined();
    });

    it("never stores a language the platform does not ship", () => {
        expect(preferredLanguageToStore({previous: "fr-FR", current: "es-ES", stored: undefined})).toBeUndefined();
        expect(toSupportedLocale("sq-AL")).toBe("sq-AL");
        expect(toSupportedLocale(42)).toBeUndefined();
    });
});
