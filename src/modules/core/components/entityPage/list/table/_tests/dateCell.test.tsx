import {render, screen} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import {formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {DateCell} from "../tableCellPrimitives.tsx";

const UTC_MIDNIGHT = new Date("2026-03-15T00:00:00.000Z");

describe("DateCell", () => {
    it("shows the UTC calendar day when time is off", () => {
        const expected = formatDate(UTC_MIDNIGHT, {timeZone: "UTC", format: {dateStyle: "medium"}});
        render(<DateCell date={UTC_MIDNIGHT} timeZone="America/New_York" withTime={false} />);
        expect(screen.getByText(expected)).toBeInTheDocument();
        expect(screen.getByText(expected).getAttribute("title")).toBe(
            formatDate(UTC_MIDNIGHT, {timeZone: "UTC", format: {dateStyle: "full"}}),
        );
    });

    it("shows the profile-timezone instant when time is on", () => {
        const expected = formatDate(UTC_MIDNIGHT, {
            timeZone: "America/New_York",
            format: {dateStyle: "medium", timeStyle: "short"},
        });
        render(<DateCell date={UTC_MIDNIGHT} timeZone="America/New_York" withTime />);
        expect(screen.getByText(expected)).toBeInTheDocument();
        expect(expected).not.toBe(
            formatDate(UTC_MIDNIGHT, {timeZone: "UTC", format: {dateStyle: "medium", timeStyle: "short"}}),
        );
    });
});
