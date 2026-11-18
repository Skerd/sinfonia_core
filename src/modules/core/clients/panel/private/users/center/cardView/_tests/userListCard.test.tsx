import {fireEvent, render, screen} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", async (original) => ({
    ...(await original<object>()),
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} languageCode="en-US" resolveLanguageKey={(key: string) => key}/>,
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => Wrapped,
}));
const access = vi.hoisted(() => ({readRoles: true}));
vi.mock("@coreModule/helpers/hooks/useAccess.ts", () => ({
    useAccess: () => ({read: {name: true, surname: true, photo: false, roles: {keys: {roles: access.readRoles, active: true, lastLogin: true}}}, write: true}),
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
    beforeEach(() => {
        access.readRoles = true;
    });

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

    // The architect asked for a warning on a user with no roles; it needs the roles read, or it would claim what it cannot see.
    it("warns when the user has no roles, only to a viewer who may read them", () => {
        const {unmount} = render(<UserCard user={{...user, roles: []} as never} specificUserId="u1" onEdit={() => {}}/>);
        expect(screen.getByText("noRoles")).toBeTruthy();
        unmount();

        render(<UserCard user={user as never} specificUserId="u1" onEdit={() => {}}/>);
        expect(screen.queryByText("noRoles")).toBeNull();
    });

    it("names the company's AI bot as such instead of warning, since it has no roles by design", () => {
        render(<UserCard user={{...user, roles: [], isBot: true} as never} specificUserId="u1" onEdit={() => {}}/>);
        expect(screen.queryByText("noRoles")).toBeNull();
        expect(screen.getByText("companyBot")).toBeTruthy();
    });

    it("gives a person no bot badge", () => {
        render(<UserCard user={user as never} specificUserId="u1" onEdit={() => {}}/>);
        expect(screen.queryByText("companyBot")).toBeNull();
    });

    it("says nothing about roles to a viewer who may not read them", () => {
        access.readRoles = false;
        render(<UserCard user={{...user, roles: []} as never} specificUserId="u1" onEdit={() => {}}/>);
        expect(screen.queryByText("noRoles")).toBeNull();
    });
});
