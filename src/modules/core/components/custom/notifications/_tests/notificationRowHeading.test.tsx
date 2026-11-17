import {render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {MemoryRouter} from "react-router-dom";

vi.mock("react-redux", () => ({
    useSelector: (pick: (state: unknown) => unknown) => pick({authentication: {user: {timezone: "Europe/Tirane"}}, language: {languageCode: "en-US"}}),
}));
vi.mock("@coreModule/components/custom/customDateDisplayer.tsx", () => ({default: () => null}));
// Only the refund notice's code declares a title.
vi.mock("@coreModule/helpers/moduleContributions/loadNotificationTypesContributions.ts", () => ({
    notificationTitle: (code: string) => (code === "PRODUCT_ORDER_REFUNDED" ? "Order refunded" : null),
    notificationMessage: () => null,
    notificationLink: () => null,
}));

import {NotificationRow} from "../notificationRow.tsx";

const dictionary: Record<string, string> = {"system": "System", "categories.security": "Security"};
const resolve = ((key: string, undefinedIfMissing?: boolean) => dictionary[key] ?? (undefinedIfMissing ? null : `---${key}---`)) as never;
const notice = (extra: Record<string, unknown>) =>
    ({_id: "n1", code: "X", description: "text", date: "2026-11-17T20:00:00.000Z", readOn: null, ...extra}) as never;
const heading = (extra: Record<string, unknown>) => {
    const {unmount} = render(<MemoryRouter><NotificationRow notification={notice(extra)} resolveLanguageKey={resolve}/></MemoryRouter>);
    const text = screen.getByRole("article").querySelector("p span.truncate")?.textContent;
    unmount();
    return text;
};

// TD-F113: every notice was headed "System".
describe("notification heading", () => {
    it("names the event, else the sender, else the category, and only then says System", () => {
        expect(heading({code: "PRODUCT_ORDER_REFUNDED", category: "system"})).toBe("Order refunded");
        expect(heading({code: "MESSAGE_MENTIONED", sender: {username: "ada@kudoo.al"}})).toBe("ada@kudoo.al");
        expect(heading({code: "USER_LOGGED_IN", category: "security"})).toBe("Security");
        expect(heading({code: "SOMETHING", category: "unknown"})).toBe("System");
    });
});
