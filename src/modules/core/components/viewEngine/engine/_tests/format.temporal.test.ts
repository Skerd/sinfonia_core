import {describe, expect, it} from "vitest";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {formatTemporal} from "../format.ts";

const UTC_MIDNIGHT = "2026-03-15T00:00:00.000Z";

describe("engine formatTemporal", () => {
    it("formats calendar dates in UTC so a New York viewer still sees the 15th", () => {
        expect(formatTemporal(UTC_MIDNIGHT, "date")).toBe(
            formatDate(UTC_MIDNIGHT, {timeZone: "UTC", format: DATE_FORMATS.date}),
        );
        expect(formatTemporal(UTC_MIDNIGHT, "date")).not.toBe(
            formatDate(UTC_MIDNIGHT, {timeZone: "America/New_York", format: DATE_FORMATS.date}),
        );
    });

    it("formats datetimes with a clock, not as a UTC calendar day", () => {
        const asDateTime = formatTemporal(UTC_MIDNIGHT, "dateTime");
        expect(asDateTime).toBe(
            formatDate(UTC_MIDNIGHT, {format: DATE_FORMATS.dateTime}),
        );
        expect(asDateTime).not.toBe(formatTemporal(UTC_MIDNIGHT, "date"));
    });
});
