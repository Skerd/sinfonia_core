import {render, screen, act} from "@testing-library/react";
import {describe, expect, it, vi, beforeEach, afterEach} from "vitest";
import {NotificationListItem, formatNotificationDate} from "@coreModule/components/custom/notificationListItem.tsx";
import type {NotificationType} from "armonia/src/modules/core/api/user/private/notifications/notifications.dto.ts";

const keys: Record<string, string> = {justNow: "just now", minutesAgo: "{}m ago", hoursAgo: "{}h ago", system: "System"};
const resolve = ((k: string) => keys[k] ?? k) as never;

const notification = (date: string) =>
    ({_id: "n1", code: "code", description: "Something happened", date, readOn: null} as unknown as NotificationType);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("formatNotificationDate", () => {
    const now = new Date("2026-03-15T12:00:00Z").getTime();

    it("labels the last minute as just now", () => {
        expect(formatNotificationDate("2026-03-15T11:59:30Z", resolve, now)).toBe("just now");
    });

    it("labels minutes and hours with the template", () => {
        expect(formatNotificationDate("2026-03-15T11:30:00Z", resolve, now)).toBe("30m ago");
        expect(formatNotificationDate("2026-03-15T09:00:00Z", resolve, now)).toBe("3h ago");
    });

    it("clamps a future timestamp instead of showing an absolute date", () => {
        // Clock skew used to produce a negative diff and fall through to a full date.
        expect(formatNotificationDate("2026-03-15T12:05:00Z", resolve, now)).toBe("just now");
    });

    it("returns the raw string for an unparseable date", () => {
        expect(formatNotificationDate("nonsense", resolve, now)).toBe("nonsense");
    });
});

describe("NotificationListItem", () => {
    it("exposes the machine-readable timestamp on the time element", () => {
        vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
        const {container} = render(<NotificationListItem notification={notification("2026-03-15T11:59:30Z")} resolveLanguageKey={resolve}/>);
        expect(container.querySelector("time")).toHaveAttribute("dateTime", "2026-03-15T11:59:30Z");
    });

    /** Without the shared clock this row kept saying "just now" for as long as it stayed mounted. */
    it("refreshes its relative label as time passes", () => {
        vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
        render(<NotificationListItem notification={notification("2026-03-15T11:59:30Z")} resolveLanguageKey={resolve}/>);
        expect(screen.getByText("just now")).toBeInTheDocument();

        act(() => {vi.advanceTimersByTime(5 * 60_000);});
        expect(screen.queryByText("just now")).not.toBeInTheDocument();
        expect(screen.getByText(/m ago/)).toBeInTheDocument();
    });
});
