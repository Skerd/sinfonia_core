import {describe, expect, it, vi} from "vitest";
import {render, screen} from "@testing-library/react";

vi.mock("@coreModule/components/custom/valueNotSet.tsx", () => ({default: () => <span>not set</span>}));

const {default: WeeklyHours} = await import("../sheet/widgets/weeklyHours.tsx");

/** Each `dt`/`dd` pair as "Day: hours". */
const lines = (container: HTMLElement) =>
    [...container.querySelectorAll("dt")].map((day) => `${day.textContent}: ${day.nextElementSibling?.textContent}`);

describe("#WeeklyHours", () => {
    it("reads Monday first, joins a day's ranges in time order with their place, and marks days without hours", () => {
        const {container} = render(
            <WeeklyHours
                closedLabel="Closed"
                rows={[
                    {dayOfWeek: 1, startTime: "14:00", endTime: "18:00", place: "Centre"},
                    {dayOfWeek: 1, startTime: "08:00", endTime: "12:00", place: "Centre"},
                    {dayOfWeek: 0, startTime: "09:00", endTime: "13:00"},
                ]}
            />,
        );
        expect(lines(container)).toEqual([
            "Mon: 08:00–12:00 · Centre, 14:00–18:00 · Centre",
            "Tue: Closed",
            "Wed: Closed",
            "Thu: Closed",
            "Fri: Closed",
            "Sat: Closed",
            "Sun: 09:00–13:00",
        ]);
    });

    it("shows the empty value when there are no hours at all", () => {
        const {container} = render(<WeeklyHours closedLabel="Closed" rows={[]} />);
        expect(container.querySelector("dl")).toBeNull();
        expect(screen.getByText("not set")).toBeTruthy();
    });
});
