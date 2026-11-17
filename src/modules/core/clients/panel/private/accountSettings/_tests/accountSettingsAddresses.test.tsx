import {render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key}/>,
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => Wrapped,
}));
vi.mock("react-router-dom", () => ({useNavigate: () => vi.fn(), useParams: () => ({subview: "account"})}));
vi.mock("@coreModule/helpers/hooks/useAccess.ts", () => ({useAccess: () => ({read: true, write: true})}));
vi.mock("@coreModule/helpers/hooks/useHttpRequest.ts", () => ({default: () => ({data: {isBot: false}})}));
vi.mock("@coreModule/helpers/moduleContributions/loadAccountSettingsContributions.ts", () => ({getAccountSettingsPages: () => []}));
vi.mock("@coreModule/components/custom/header.tsx", () => ({default: ({title}: {title: string}) => <h1>{title}</h1>}));
vi.mock("../components/sidebar-nav.tsx", () => ({
    SidebarNav: ({items, updateActiveTab}: {items: {title: string; href: string}[]; updateActiveTab: (tab: string) => void}) => (
        <nav>{items.map((item) => <button key={item.href} onClick={() => updateActiveTab(item.href)}>{item.title}</button>)}</nav>
    ),
}));
vi.mock("@coreModule/clients/panel/private/accountSettings/account", () => ({default: () => <div>account page</div>}));
vi.mock("@coreModule/clients/panel/private/accountSettings/security", () => ({default: () => <div>security page</div>}));
vi.mock("@coreModule/clients/panel/private/accountSettings/notificationCenter", () => ({default: () => <div>activity page</div>}));
vi.mock("@coreModule/clients/panel/private/accountSettings/notifications", () => ({default: () => <div>notifications page</div>}));
vi.mock("@coreModule/clients/panel/private/accountSettings/apps", () => ({default: () => <div>apps page</div>}));
vi.mock("@coreModule/clients/panel/private/accountSettings/addresses", () => ({default: () => <div>address book</div>}));

import AccountSettings from "../index.tsx";

describe("account settings address book (D163)", () => {
    it("lists the address book in a person's own settings", () => {
        render(<AccountSettings />);
        expect(screen.getByText("addresses")).toBeTruthy();
    });

    it("leaves the address book out when an admin views another person's settings", () => {
        render(<AccountSettings specificUserId="6a0000000000000000000001" fullName="Taylor Quinn" />);
        expect(screen.getByText("security")).toBeTruthy();
        expect(screen.queryByText("addresses")).toBeNull();
    });
});
