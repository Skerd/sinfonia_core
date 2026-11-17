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
    useAccess: () => ({
        read: {name: true, surname: true, emailVerifiedAt: true, birthday: true, registerDate: true, roles: {keys: {lastLogin: true, lockedOutUntil: true, unsuccessfulLogins: true}}},
        write: {},
    }),
}));
vi.mock("react-redux", () => ({
    useSelector: (pick: (state: unknown) => unknown) => pick({authentication: {user: {timezone: "Europe/Tirane"}}, language: {languageCode: "en-US"}}),
    useDispatch: () => () => undefined,
}));
vi.mock("@coreModule/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateCoverPhoto/coverPhoto.tsx", () => ({default: () => null}));
vi.mock("@coreModule/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateProfilePhoto/profilePhoto.tsx", () => ({default: () => null}));

import UserProfileCard from "../userProfileCard.tsx";

const person = {_id: "u1", name: "Arta", surname: "Hoxha", online: false, roles: [], status: "active", verified: true, registerDate: "2026-11-01T09:00:00.000Z", unsuccessfulLogins: 0};
const labels = ["emailVerifiedAt", "lastLoginDate", "lockedOutUntil", "birthday"];
const showAllTabs = () => screen.queryAllByRole("tab").forEach((tab) => fireEvent.mouseDown(tab));
// A fact renders as "label: value".
const fact = (label: string) => screen.queryByText(new RegExp(`^${label}:`));

// TD-F115: the admin user cards showed "Email verified at", "Last login" and "Locked out until" with no value.
describe("user card facts", () => {
    it("leaves off facts the person has no value for", () => {
        render(<UserProfileCard data={person as never} specificUserId="u1"/>);
        showAllTabs();
        expect(fact("registeredDate")).toBeTruthy();
        for (const label of labels) expect(fact(label)).toBeNull();
    });

    it("shows them once they have a value", () => {
        render(<UserProfileCard data={{...person, emailVerifiedAt: "2026-11-02T09:00:00.000Z", lastLogin: "2026-11-17T09:00:00.000Z", birthday: "1990-06-14"} as never} specificUserId="u1"/>);
        showAllTabs();
        for (const label of ["lastLoginDate", "birthday"]) expect(fact(label)).toBeTruthy();
    });
});
