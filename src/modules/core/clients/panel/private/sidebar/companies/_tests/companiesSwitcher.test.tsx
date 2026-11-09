import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType, ReactNode} from "react";
import {render, screen} from "@testing-library/react";

const onFilterChange = vi.fn();
const company = {_id: "c1", name: "Alpine Reach", description: "Outreach", logo: null};

// A role with no access to the Company model: the switcher must not depend on it.
vi.mock("@coreModule/helpers/hooks/useAccess.ts", () => ({
    useAccess: () => ({read: undefined}),
}));
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Component: ComponentType<Record<string, unknown>>) => (props: Record<string, unknown>) => (
        <Component {...props} resolveLanguageKey={(key: string) => key} />
    ),
}));
vi.mock("@coreModule/helpers/hocs/withAxios.tsx", () => ({
    default: () => (Component: ComponentType<Record<string, unknown>>) => (props: Record<string, unknown>) => (
        <Component {...props} data={company} loading={false} error={null} onFilterChange={onFilterChange} />
    ),
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Component: ComponentType<Record<string, unknown>>) => Component,
}));
vi.mock("@coreModule/helpers/context/reloginContext.tsx", () => ({
    ReloginProvider: ({children}: {children: ReactNode}) => <>{children}</>,
}));
vi.mock("@coreModule/components/ui/sidebar.tsx", () => ({
    SidebarMenu: ({children}: {children: ReactNode}) => <ul>{children}</ul>,
    SidebarMenuItem: ({children}: {children: ReactNode}) => <li>{children}</li>,
    SidebarMenuButton: ({children}: {children: ReactNode}) => <button type="button">{children}</button>,
}));
vi.mock("@coreModule/clients/panel/private/sidebar/companies/allCompaniesDropDownMenuContent", () => ({
    default: () => null,
}));
vi.mock("@coreModule/clients/panel/private/sidebar/companies/companyUpdatedEvent.ts", () => ({
    useOnCompanyUpdated: () => undefined,
}));

import CompaniesSwitcher from "../index.tsx";

describe("CompaniesSwitcher", () => {
    beforeEach(() => {
        onFilterChange.mockClear();
    });

    // A member of two companies whose role has no `companies` read could never switch: the switcher rendered nothing.
    it("shows a member without Company access the current company and loads their companies", () => {
        render(<CompaniesSwitcher />);

        expect(screen.getByText("Alpine Reach")).toBeTruthy();
        expect(screen.getByText("Outreach")).toBeTruthy();
        expect(onFilterChange).toHaveBeenCalledTimes(1);
    });
});
