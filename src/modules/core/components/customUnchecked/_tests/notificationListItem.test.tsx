import {render, screen} from "@testing-library/react";
import {describe, expect, it, vi, beforeEach, afterEach} from "vitest";
import {NotificationRow} from "@baseModule/components/custom/notifications/notificationRow.tsx";
import type {NotificationType} from "armonia/src/modules/core/api/user/private/notifications/notifications.dto.ts";

const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

vi.mock("react-redux", () => ({
    useSelector: (selector: (state: {authentication: {user: {timezone: string}}}) => unknown) =>
        selector({authentication: {user: {timezone: "UTC"}}}),
}));

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

const resolve = ((k: string) => (k === "system" ? "System" : k)) as never;

const notification = (overrides: Partial<NotificationType> & {date: string}) =>
    ({
        _id: "n1",
        code: "code",
        description: "Something happened",
        readOn: null,
        ...overrides,
    }) as unknown as NotificationType;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("NotificationListItem", () => {
    it("puts the sender and date on one row and clamps the body", () => {
        vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
        render(
            <NotificationRow
                notification={notification({date: "2026-03-15T11:59:30Z"})}
                resolveLanguageKey={resolve}
            />,
        );

        expect(screen.getByText("System")).toBeInTheDocument();
        expect(screen.getByText("Something happened")).toBeInTheDocument();
        expect(screen.getByText(/11:59/)).toBeInTheDocument();
    });

    it("exposes the machine-readable timestamp on the time element", () => {
        vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
        const {container} = render(
            <NotificationRow
                notification={notification({date: "2026-03-15T11:59:30Z"})}
                resolveLanguageKey={resolve}
            />,
        );
        expect(container.querySelector("time")).toHaveAttribute("dateTime", "2026-03-15T11:59:30.000Z");
    });

    it("marks unread rows and falls back to the system label without a sender", () => {
        vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
        const {container} = render(
            <NotificationRow
                notification={notification({date: "2026-03-15T11:59:30Z", readOn: null})}
                resolveLanguageKey={resolve}
            />,
        );
        expect(container.querySelector("[aria-hidden]")).toBeTruthy();
        expect(screen.getByText("System")).toBeInTheDocument();
    });

    it("renders a named sender and omits the unread dot once read", () => {
        vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
        const {container} = render(
            <NotificationRow
                notification={notification({
                    date: "2026-03-15T11:59:30Z",
                    readOn: "2026-03-15T12:00:00Z",
                    sender: {_id: "u1", username: "alice"},
                })}
                resolveLanguageKey={resolve}
            />,
        );
        expect(screen.getByText("alice")).toBeInTheDocument();
        expect(container.querySelector("[aria-hidden]")).toBeNull();
    });

    it("labels yesterday via CustomDateDisplayer", () => {
        vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
        render(
            <NotificationRow
                notification={notification({date: "2026-03-14T18:00:00Z"})}
                resolveLanguageKey={resolve}
            />,
        );
        expect(screen.getByText("yesterday")).toBeInTheDocument();
    });
});
