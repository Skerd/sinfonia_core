import {render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} languageCode="en-US" resolveLanguageKey={(key: string) => key}/>,
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => Wrapped,
}));
vi.mock("@coreModule/helpers/hooks/useAccess.ts", () => ({
    useAccess: () => ({read: {name: true, surname: true, online: true, mfaStatus: true}, write: {}}),
}));
vi.mock("react-redux", () => ({
    useSelector: (pick: (state: unknown) => unknown) => pick({authentication: {user: {timezone: "Europe/Tirane"}}}),
}));
vi.mock("@coreModule/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateCoverPhoto/coverPhoto.tsx", () => ({default: () => null}));
vi.mock("@coreModule/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateProfilePhoto/profilePhoto.tsx", () => ({default: () => null}));

import UserProfileCard from "../userProfileCard.tsx";

const person = {_id: "u1", name: "Arta", surname: "Hoxha", online: false, mfaStatus: "notActive", roles: [], status: "active", verified: true};

// TD-B240: the company's AI bot showed a red "MFA not active" and "Offline", though a bot never signs in.
describe("user card of a bot", () => {
    it("shows presence and MFA for a person", () => {
        render(<UserProfileCard data={person as never} specificUserId="u1"/>);
        expect(screen.getByText("offline")).toBeTruthy();
        expect(screen.getAllByText("mfaStatuses.notActive").length).toBeGreaterThan(0);
    });

    it("leaves them off for the company's bot", () => {
        render(<UserProfileCard data={{...person, _id: "b1", name: "KudooMarket AI", surname: "Bot", isBot: true} as never} specificUserId="b1"/>);
        expect(screen.queryByText("offline")).toBeNull();
        expect(screen.queryByText("mfaStatuses.notActive")).toBeNull();
    });
});
