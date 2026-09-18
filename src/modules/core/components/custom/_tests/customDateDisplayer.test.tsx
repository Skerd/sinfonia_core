import {render, screen} from "@testing-library/react";
import {describe, expect, it, vi, beforeEach, afterEach} from "vitest";
import CustomDateDisplayer from "@coreModule/components/custom/customDateDisplayer.tsx";

const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// The HOC only injects translation helpers here, so the test supplies them directly and keeps
// the component under test free of the real dictionary loader.
vi.mock("@baseModule/helpers/hocs/withLanguage.tsx", () => ({
    default:
        () =>
        (Component: (props: Record<string, unknown>) => unknown) =>
        (props: Record<string, unknown>) =>
            Component({
                ...props,
                resolveLanguageKey: (k: string) => k,
                resolveLanguageValue: (k: string) => (k === "weekDays" ? WEEK_DAYS : null),
            }),
}));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const at = (iso: string) => vi.setSystemTime(new Date(iso));

describe("CustomDateDisplayer", () => {
    it("renders on the first paint rather than after an effect", () => {
        at("2026-03-15T12:00:00Z");
        const {container} = render(<CustomDateDisplayer timeZone="UTC" date="2026-03-15T09:30:00Z"/>);
        // Previously this was computed in an effect, so the first render was an empty div.
        expect(container.textContent?.trim()).not.toBe("");
    });

    it("shows the time for a date that is today in the given timezone", () => {
        at("2026-03-15T12:00:00Z");
        render(<CustomDateDisplayer timeZone="UTC" date="2026-03-15T09:30:00Z"/>);
        expect(screen.getByText(/09:30/)).toBeInTheDocument();
    });

    /**
     * 23:30 UTC on the 14th is already the 15th in Tokyo. The old locale-string round-trip
     * produced a Date whose instant was wrong, so this comparison could not be trusted.
     */
    it("uses the target timezone's calendar day, not the host's", () => {
        at("2026-03-14T23:30:00Z");
        const {container} = render(<CustomDateDisplayer timeZone="Asia/Tokyo" date="2026-03-14T23:00:00Z"/>);
        expect(container.textContent).toMatch(/\d{2}:\d{2}/); // same Tokyo day -> time, not a date
    });

    it("resolves yesterday across a month boundary", () => {
        at("2026-04-01T12:00:00Z");
        render(<CustomDateDisplayer timeZone="UTC" date="2026-03-31T09:00:00Z" showOnlyYesterday/>);
        expect(screen.getByText("yesterday")).toBeInTheDocument();
    });

    /**
     * The real month-scale bug: `yesterday` was seeded from the host clock and then had only its
     * day-of-month overwritten from the timezone-shifted "today". At 2026-04-30T23:00Z it is
     * already May 1 in Kiritimati (UTC+14), so the old code called `setDate(0)` on an April date
     * and landed on 31 March — a month adrift — and this row silently lost its "yesterday" label.
     */
    it("resolves yesterday when the timezone is a calendar day ahead of the host", () => {
        at("2026-04-30T23:00:00Z");
        render(
            <CustomDateDisplayer
                timeZone="Pacific/Kiritimati"
                date="2026-04-29T23:00:00Z"
                showOnlyYesterday
            />,
        );
        expect(screen.getByText("yesterday")).toBeInTheDocument();
    });

    it("does not call an older date yesterday", () => {
        at("2026-04-01T12:00:00Z");
        render(<CustomDateDisplayer timeZone="UTC" date="2026-03-20T09:00:00Z" showOnlyYesterday/>);
        expect(screen.queryByText("yesterday")).not.toBeInTheDocument();
    });

    /**
     * `weekStart` kept the current time of day, so an earlier moment on the week's first day
     * fell outside the range and lost its weekday label.
     */
    it("includes an earlier time on the first day of the week", () => {
        at("2026-03-18T12:00:00Z"); // Wednesday
        render(<CustomDateDisplayer timeZone="UTC" date="2026-03-15T01:00:00Z" showOnlyWeekDay/>); // Sunday 01:00
        expect(screen.getByText("Sunday")).toBeInTheDocument();
    });

    it("names the correct weekday", () => {
        at("2026-03-18T12:00:00Z");
        render(<CustomDateDisplayer timeZone="UTC" date="2026-03-16T10:00:00Z" showOnlyWeekDay/>);
        expect(screen.getByText("Monday")).toBeInTheDocument();
    });

    it("falls back to a full date for anything older than this week", () => {
        at("2026-03-18T12:00:00Z");
        render(<CustomDateDisplayer timeZone="UTC" date="2026-01-05T10:00:00Z" showOnlyWeekDay showOnlyYesterday/>);
        expect(screen.getByText(/2026/)).toBeInTheDocument();
    });

    it("does not crash on an unparseable date", () => {
        at("2026-03-18T12:00:00Z");
        expect(() => render(<CustomDateDisplayer timeZone="UTC" date="not-a-date"/>)).not.toThrow();
    });
});
