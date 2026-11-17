import {render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import type {ReactNode} from "react";

vi.mock("@coreModule/helpers/hooks/useAccess.ts", () => ({useAccess: () => ({read: {}, delete: false})}));
vi.mock("@coreModule/helpers/context/accessContext.tsx", () => ({accessFieldPathExists: () => true}));
// The card shell hands its body the row and the read access; the header shows its title, the rows label and value.
vi.mock("@coreModule/components/entityPage/list/card/entityCard.tsx", () => {
    const EntityCard = ({entity, children}: {entity: unknown; children: (args: {entity: unknown; read: object}) => ReactNode}) => <div>{children({entity, read: {}})}</div>;
    EntityCard.Header = ({title}: {title: ReactNode}) => <h3>{title}</h3>;
    EntityCard.Body = ({children}: {children: ReactNode}) => <div>{children}</div>;
    return {default: EntityCard};
});
vi.mock("@coreModule/components/entityPage/list/card/entityCardRow.tsx", () => ({
    default: ({label, value, show = true}: {label: string; value: ReactNode; show?: boolean}) => (show ? <p>{label}: {value}</p> : null),
}));
vi.mock("@coreModule/clients/panel/private/accountSettings/security/userSession/center/sheetView/userSessionSheetView.tsx", () => ({default: () => null}));
vi.mock("@coreModule/clients/panel/private/accountSettings/security/userSession/center/actions/userSessionActionMenu.tsx", () => ({UserSessionRevokeMenuItem: () => null}));

import UserSessionCard from "../userSessionCard.tsx";

const resolve = ((key: string) => (key === "deviceLabel" ? "{browser} on {os}" : key)) as never;
const session = {
    _id: "s1", sessionId: "9f1c2a7e-0000-4000-8000-000000000000", deviceId: "d1", isActive: true, ipAddress: "::1",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36",
    browser: "Chrome", os: "macOS", geolocation: [], lastActiveAt: "2026-11-17T20:00:00.000Z", expiresAt: "2026-12-17T20:00:00.000Z",
};
const card = (extra: Record<string, unknown>) =>
    render(<UserSessionCard session={{...session, ...extra} as never} revoking={false} onRevoke={() => {}} viewingSelf resolveLanguageKey={resolve}/>);

// TD-F119: sessions were titled by a session UUID, showed the raw user agent and read "Location: ::1".
describe("session card", () => {
    it("is titled by the browser and system, and shows the IP as an IP", () => {
        card({});
        expect(screen.getByRole("heading").textContent).toBe("Chrome on macOS");
        expect(screen.getByText("ipAddress: ::1")).toBeTruthy();
        expect(screen.queryByText(/^location:/)).toBeNull();
        expect(screen.queryByText(/userAgent|sessionId/)).toBeNull();
    });

    it("names a place once one is known, and falls back to the device without a recognised browser", () => {
        card({geolocation: [{city: "Tirana", country: "AL"}], browser: undefined, os: undefined});
        expect(screen.getByText("location: Tirana, AL")).toBeTruthy();
        expect(screen.getByRole("heading").textContent).toBe("d1");
    });
});
