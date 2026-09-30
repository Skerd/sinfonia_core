import {describe, expect, it} from "vitest";
import {formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {displayPlainText} from "../displayValue.tsx";

const UTC_MIDNIGHT = "2026-03-15T00:00:00.000Z";
const DATE_FORMAT: Intl.DateTimeFormatOptions = {day: "numeric", month: "short", year: "numeric"};
const DATE_TIME_FORMAT: Intl.DateTimeFormatOptions = {...DATE_FORMAT, hour: "2-digit", minute: "2-digit"};

describe("displayPlainText temporal", () => {
    it("formats type=date in UTC so New York still sees the 15th", () => {
        expect(displayPlainText(UTC_MIDNIGHT, "date", {timeZone: "America/New_York"})).toBe(
            formatDate(UTC_MIDNIGHT, {timeZone: "UTC", format: DATE_FORMAT}),
        );
        expect(displayPlainText(UTC_MIDNIGHT, "date", {timeZone: "America/New_York"})).not.toBe(
            formatDate(UTC_MIDNIGHT, {timeZone: "America/New_York", format: DATE_FORMAT}),
        );
    });

    it("formats type=dateTime in the profile timezone", () => {
        expect(displayPlainText(UTC_MIDNIGHT, "dateTime", {timeZone: "America/New_York"})).toBe(
            formatDate(UTC_MIDNIGHT, {timeZone: "America/New_York", format: DATE_TIME_FORMAT}),
        );
        expect(displayPlainText(UTC_MIDNIGHT, "dateTime", {timeZone: "America/New_York"})).not.toBe(
            formatDate(UTC_MIDNIGHT, {timeZone: "UTC", format: DATE_TIME_FORMAT}),
        );
    });
});
