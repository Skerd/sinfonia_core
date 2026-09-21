import {describe, expect, it} from "vitest";
import {formatDate, formatDurationInDaysHoursOrMinutes, isSameDay} from "@coreModule/helpers/general/dateTime.ts";
import {resolveEntityPageKeys} from "@coreModule/helpers/general/entityPage.ts";
import {getName} from "@coreModule/helpers/general/names.ts";
import {formatCurrency, formatNumber} from "@coreModule/helpers/general/numbers.ts";
import {findFromLanguage, findFromObject} from "@coreModule/helpers/general/objectPath.ts";
import {buildPageTitle} from "@coreModule/helpers/general/pageTitle.ts";
import {generateRandomString} from "@coreModule/helpers/general/random.ts";
import {buildUrlWithExistingParams} from "@coreModule/helpers/general/url.ts";

describe("formatDate", () => {
    const date = "2026-03-05T14:07:00Z";

    it("returns an empty string for empty or invalid dates", () => {
        expect(formatDate("")).toBe("");
        expect(formatDate(null)).toBe("");
        expect(formatDate("not a date")).toBe("");
    });

    it("formats in the given timezone with a 24h clock", () => {
        expect(formatDate(date, {timeZone: "Europe/Zurich", format: {hour: "2-digit", minute: "2-digit"}})).toBe("15:07");
        expect(formatDate(date, {timeZone: "UTC", format: {hour: "2-digit", minute: "2-digit"}})).toBe("14:07");
    });

    it("falls back to the runtime timezone for empty or unknown timezones", () => {
        const format = {year: "numeric"} as const;
        expect(formatDate(date, {timeZone: "", format})).toBe("2026");
        expect(formatDate(date, {timeZone: "Mars/Olympus", format})).toBe("2026");
    });
});

describe("isSameDay", () => {
    it("compares local calendar days", () => {
        expect(isSameDay(new Date(2026, 0, 1, 1), new Date(2026, 0, 1, 23))).toBe(true);
        expect(isSameDay(new Date(2026, 0, 1), new Date(2026, 0, 2))).toBe(false);
    });
});

describe("formatDurationInDaysHoursOrMinutes", () => {
    const t = (key: string) => key;

    it("uses the largest units", () => {
        expect(formatDurationInDaysHoursOrMinutes(((2 * 24) + 1) * 3_600_000, t)).toBe("2 days, 1 hour");
        expect(formatDurationInDaysHoursOrMinutes(5 * 3_600_000, t)).toBe("5 hours");
        expect(formatDurationInDaysHoursOrMinutes(60_000, t)).toBe("1 minute");
        expect(formatDurationInDaysHoursOrMinutes(1_500, t)).toBe("1 second");
    });

    it("treats negative durations as zero", () => {
        expect(formatDurationInDaysHoursOrMinutes(-5_000, t)).toBe("0 seconds");
    });
});

describe("formatNumber / formatCurrency", () => {
    it("returns an empty string for missing values", () => {
        expect(formatNumber(null)).toBe("");
        expect(formatNumber(Number.NaN)).toBe("");
        expect(formatCurrency(undefined)).toBe("");
    });

    it("keeps one decimal in compact notation", () => {
        expect(formatNumber(1_600_000, {compact: true})).toMatch(/^1[.,]6\s?M$/);
    });

    it("shows whole currency units by default", () => {
        expect(formatCurrency(1234.56)).not.toMatch(/[.,]56/);
        expect(formatCurrency(1234.56, "EUR", {maximumFractionDigits: 2})).toMatch(/[.,]56/);
    });

    it("does not throw when the minimum exceeds the default maximum", () => {
        expect(formatCurrency(1, "EUR", {minimumFractionDigits: 2})).toMatch(/1[.,]00/);
    });
});

describe("getName", () => {
    it("joins whichever name parts exist", () => {
        expect(getName({name: "Ada", surname: "Lovelace"} as never)).toBe("Ada Lovelace");
        expect(getName({name: "Ada"} as never)).toBe("Ada");
        expect(getName({surname: "Lovelace"} as never)).toBe("Lovelace");
        expect(getName(undefined)).toBe("");
    });
});

describe("findFromObject", () => {
    it("reads nested paths, including falsy values", () => {
        expect(findFromObject({a: {b: 0}}, "a.b")).toBe(0);
        expect(findFromObject({a: {b: null}}, "a.b")).toBeNull();
    });

    it("returns undefined for missing paths", () => {
        expect(findFromObject({a: {}}, "a.b.c")).toBeUndefined();
        expect(findFromObject({a: "text"}, "a.length")).toBeUndefined();
    });
});

describe("findFromLanguage", () => {
    it("prefers a flat dotted key over a nested path", () => {
        expect(findFromLanguage({"address.city": "City", address: {city: "Nested"}}, "address.city")).toBe("City");
        expect(findFromLanguage({address: {city: "Nested"}}, "address.city")).toBe("Nested");
    });

    it("falls back to the key when missing or empty", () => {
        expect(findFromLanguage({a: {b: ""}}, "a.b")).toBe("a.b");
        expect(findFromLanguage({a: "text"}, "a.0")).toBe("a.0");
        expect(findFromLanguage(undefined, "x")).toBe("x");
    });
});

describe("buildUrlWithExistingParams", () => {
    it("keeps the current query, applies extras, and removes nullish ones", () => {
        expect(buildUrlWithExistingParams(
            "https://app.test/realEstate/units?projectId=p1&floorId=f1",
            "/realEstate/units/create",
            {floorId: null, unitId: 7},
        )).toBe("/realEstate/units/create?projectId=p1&unitId=7");
    });

    it("omits the question mark when there are no parameters", () => {
        expect(buildUrlWithExistingParams("https://app.test/x", "/y")).toBe("/y");
    });

    it("accepts relative URLs", () => {
        expect(buildUrlWithExistingParams("/x?a=1", "/y")).toBe("/y?a=1");
    });
});

describe("buildPageTitle", () => {
    it("drops empty context segments", () => {
        expect(buildPageTitle("Units", ["Aria", "", null, "3"])).toEqual({title: "Units", context: ["Aria", "3"]});
    });
});

describe("generateRandomString", () => {
    it("returns the requested length from the charset", () => {
        expect(generateRandomString(0)).toBe("");
        expect(generateRandomString(-1)).toBe("");
        expect(generateRandomString(64)).toMatch(/^[A-Za-z0-9]{64}$/);
    });
});

describe("resolveEntityPageKeys", () => {
    it("prefers model for access and collectionName for views", () => {
        expect(resolveEntityPageKeys({model: "m", collectionName: "c"})).toEqual({accessKey: "m", viewCollectionKey: "c"});
        expect(resolveEntityPageKeys({accessModel: "a"})).toEqual({accessKey: "a", viewCollectionKey: "a"});
        expect(resolveEntityPageKeys({})).toEqual({accessKey: "", viewCollectionKey: ""});
    });
});
