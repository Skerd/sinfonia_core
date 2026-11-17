import {fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", async (original) => ({
    ...(await original<object>()),
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} languageCode="en-US" resolveLanguageKey={(key: string) => key}/>,
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => Wrapped,
}));
vi.mock("@coreModule/helpers/hooks/useAccess.ts", () => ({
    useAccess: () => ({read: {name: true, surname: true, photo: false, roles: {keys: {roles: true, active: true, lastLogin: true}}}, write: true}),
}));
vi.mock("react-redux", async (original) => ({
    ...(await original<object>()),
    useSelector: (pick: (state: unknown) => unknown) => pick({authentication: {user: {timezone: "UTC"}}, language: {languageCode: "en-US"}}),
}));
vi.mock("@coreModule/helpers/moduleContributions/loadRolesPermissionsContributions.ts", () => ({
    translateDefaultRole: (role: {name: string}) => role,
}));
vi.mock("@coreModule/clients/panel/private/users/center/actions", () => ({default: () => <span>actions</span>}));
vi.mock("../userProfileCard.tsx", () => ({UserProfileCard: () => <p>full profile</p>}));

import UserCard from "../userCard.tsx";

const user = {
    _id: "u1", username: "arta@example.com", name: "Arta", surname: "Hoxha", status: "active", phoneNumber: "+355690000000",
    roles: [{_id: "r1", name: "Cashier"}, {_id: "r2", name: "Catalog Editor"}], lastLogin: "2026-11-17T09:00:00.000Z",
};

// TD-F124: the users list showed the whole profile (banner, five or six facts, "Status: Active" as a row). Last sign-in
// is a badge next to the status, and the profile opens in a dialog (the architect's choice).
describe("users list card", () => {
    it("shows the person, their status, roles and last sign-in only", () => {
        render(<UserCard user={user as never} specificUserId="u1" onEdit={() => {}}/>);

        expect(screen.getByText("Arta Hoxha")).toBeTruthy();
        expect(screen.getByText("statuses.active")).toBeTruthy();
        expect(screen.getByText("Cashier")).toBeTruthy();
        expect(screen.getByTitle("lastLoginDate").textContent).toMatch(/Nov 17, 2026/);
        expect(screen.queryByText(/\+355/)).toBeNull();
        expect(screen.queryByText("full profile")).toBeNull();
    });

    it("opens the full profile in a dialog", () => {
        render(<UserCard user={user as never} specificUserId="u1" onEdit={() => {}}/>);
        fireEvent.click(screen.getByText("Arta Hoxha"));
        expect(screen.getByRole("dialog").textContent).toContain("full profile");
    });
});
