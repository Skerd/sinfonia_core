import {describe, expect, it, vi} from "vitest";
import {
    addCalendarDays,
    calendarDaysUntil,
    calendarDayUtc,
    calendarMonthOf,
    companyToday,
    formatDate,
    formatDurationInDaysHoursOrMinutes,
    formatRelativeToNow,
    fromZonedWallClock,
    isSameDay,
    toZonedWallClockDate,
    zonedParts,
} from "@coreModule/helpers/general/dateTime.ts";
import {resolveEntityPageKeys} from "@coreModule/helpers/general/entityPage.ts";
import {getName} from "@coreModule/helpers/general/names.ts";
import {formatCurrency, formatNumber} from "@coreModule/helpers/general/numbers.ts";
import {findFromLanguage, findFromObject} from "@coreModule/helpers/general/objectPath.ts";
import {buildPageTitle} from "@coreModule/helpers/general/pageTitle.ts";
import {generateRandomString} from "@coreModule/helpers/general/random.ts";
import {buildUrlWithExistingParams} from "@coreModule/helpers/general/url.ts";

describe("formatRelativeToNow", () => {
    it("says how long ago in the user's language, and nothing for an invalid date", () => {
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
        expect(formatRelativeToNow(threeHoursAgo, "en-US")).toBe("3 hours ago");
        expect(formatRelativeToNow(threeHoursAgo, "de-CH")).toBe("vor 3 Stunden");
        expect(formatRelativeToNow(threeHoursAgo, "xx-XX")).toBe("3 hours ago");
        expect(formatRelativeToNow("not a date", "en-US")).toBe("");
    });
});

describe("calendarDayUtc", () => {
    it("keeps a date-only string as written", () => {
        expect(calendarDayUtc("2026-03-15")).toBe("2026-03-15");
    });

    it("uses the UTC calendar day of a Z instant (not the viewer timezone)", () => {
        expect(calendarDayUtc("2026-03-15T00:00:00.000Z")).toBe("2026-03-15");
        expect(calendarDayUtc(new Date("2026-03-15T00:00:00.000Z"))).toBe("2026-03-15");
    });

    it("uses the date prefix of a naive ISO datetime", () => {
        expect(calendarDayUtc("2026-03-15T09:30:00")).toBe("2026-03-15");
    });
});

describe("calendarDaysUntil (D116)", () => {
    // 00:30 on 2 March in Zurich, still 1 March in UTC.
    const now = new Date("2026-03-01T23:30:00Z");

    it("counts from today in the company's zone, for a day stored at midnight UTC or as a local string", () => {
        expect(calendarDaysUntil("2026-03-02T00:00:00.000Z", "Europe/Zurich", now)).toBe(0);
        expect(calendarDaysUntil("2026-03-02T00:00:00.000Z", "UTC", now)).toBe(1);
        expect(calendarDaysUntil("2026-03-01", "Europe/Zurich", now)).toBe(-1);
        expect(calendarDaysUntil("2026-03-05", "Europe/Zurich", now)).toBe(3);
    });

    it("is null without a date", () => {
        expect(calendarDaysUntil(undefined, "Europe/Zurich", now)).toBeNull();
        expect(calendarDaysUntil("not a date", "Europe/Zurich", now)).toBeNull();
    });
});

describe("company calendar days (D115, D116)", () => {
    it("takes today where the company is: 00:30 in Zurich is already the next day", () => {
        const now = new Date("2026-02-28T23:30:00Z");
        expect(companyToday("Europe/Zurich", now)).toBe("2026-03-01");
        expect(companyToday("UTC", now)).toBe("2026-02-28");
    });

    it("steps whole days across a DST change and month ends", () => {
        // Zurich springs forward on 2026-03-29; a day is still one day.
        expect(addCalendarDays("2026-03-28", 1)).toBe("2026-03-29");
        expect(addCalendarDays("2026-03-29", 1)).toBe("2026-03-30");
        expect(addCalendarDays("2026-02-28", 1)).toBe("2026-03-01");
        expect(addCalendarDays("2026-03-01", -1)).toBe("2026-02-28");
        expect(addCalendarDays("2026-12-31", 1)).toBe("2027-01-01");
    });

    it("bounds the month a day falls in", () => {
        expect(calendarMonthOf("2026-02-14")).toEqual({from: "2026-02-01", to: "2026-02-28"});
        expect(calendarMonthOf("2028-02-14")).toEqual({from: "2028-02-01", to: "2028-02-29"});
    });
});

describe("zoned wall clock", () => {
    it("round-trips Europe/Berlin winter 14:00 to UTC", () => {
        const instant = fromZonedWallClock("Europe/Berlin", 2026, 3, 15, 14, 0, 0);
        expect(instant?.toISOString()).toBe("2026-03-15T13:00:00.000Z");
        expect(zonedParts(instant!, "Europe/Berlin")).toMatchObject({
            year: 2026, month: 3, day: 15, hour: 14, minute: 0,
        });
    });

    it("round-trips Europe/Berlin after the 2026 spring-forward", () => {
        const instant = fromZonedWallClock("Europe/Berlin", 2026, 3, 29, 14, 0, 0);
        expect(instant?.toISOString()).toBe("2026-03-29T12:00:00.000Z");
    });

    it("exposes zoned parts as a local Date for timezone-naive widgets", () => {
        const instant = new Date("2026-03-15T13:00:00.000Z");
        const wall = toZonedWallClockDate(instant, "Europe/Berlin");
        expect(wall?.getFullYear()).toBe(2026);
        expect(wall?.getMonth()).toBe(2);
        expect(wall?.getDate()).toBe(15);
        expect(wall?.getHours()).toBe(14);
    });
});

describe("formatDate", () => {
    const date = "2026-03-05T14:07:00Z";

    it("names the month in the app's language, not the browser's", () => {
        const before = document.documentElement.lang;
        try {
            document.documentElement.lang = "de-CH";
            expect(formatDate(date, {timeZone: "UTC", format: {month: "long"}})).toBe("März");
            document.documentElement.lang = "it-IT";
            expect(formatDate(date, {timeZone: "UTC", format: {month: "long"}})).toBe("marzo");
        } finally {
            document.documentElement.lang = before;
        }
    });

    it("uses the app's own month and weekday names when the browser has no data for its language", () => {
        const before = document.documentElement.lang;
        const supported = vi.spyOn(Intl.DateTimeFormat, "supportedLocalesOf").mockReturnValue([]);
        try {
            document.documentElement.lang = "sq-AL";
            expect(formatDate(date, {timeZone: "UTC", format: {day: "numeric", month: "long", year: "numeric"}})).toBe("5 Mars 2026");
            expect(formatDate(date, {timeZone: "UTC", format: {weekday: "short", day: "numeric", month: "short"}})).toBe("Enj 5 Mar");
        } finally {
            supported.mockRestore();
            document.documentElement.lang = before;
        }
    });

    it("returns an empty string for empty or invalid dates", () => {
        expect(formatDate("")).toBe("");
        expect(formatDate(null)).toBe("");
        expect(formatDate("not a date")).toBe("");
    });

    it("prints a UTC-midnight instant as the 15th in UTC, not the 14th", () => {
        const iso = "2026-03-15T00:00:00.000Z";
        const day = {day: "numeric"} as const;
        expect(formatDate(iso, {timeZone: "UTC", format: day})).toBe("15");
        expect(formatDate(iso, {timeZone: "America/New_York", format: day})).toBe("14");
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
