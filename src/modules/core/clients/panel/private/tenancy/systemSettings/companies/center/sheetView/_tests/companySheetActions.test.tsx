import {render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import type {ComponentType, ReactNode} from "react";

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key}/>,
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => Wrapped,
}));
vi.mock("@coreModule/helpers/hooks/useAccess.ts", () => ({useAccess: () => ({read: true, write: true})}));
vi.mock("@coreModule/helpers/hooks/useViewConfig.ts", () => ({useViewConfig: () => ({model: "companies", nodes: []})}));
// The sheet's ⋮ menu, shown flat: what the sheet hands its renderer as menu items.
vi.mock("@coreModule/components/viewEngine/SheetViewRenderer.tsx", () => ({
    default: ({actionMenuChildren}: {actionMenuChildren?: ReactNode}) => <div>{actionMenuChildren}</div>,
}));
const {action} = vi.hoisted(() => ({action: (label: string) => ({default: () => <span>{label}</span>})}));
vi.mock("@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/activate.tsx", () => action("activate"));
vi.mock("@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/deactivate.tsx", () => action("deactivate"));
vi.mock("@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/manageModules.tsx", () => action("manage modules"));
vi.mock("@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/setPortalVisibility.tsx", () => action("portal visibility"));

import CompanySheetView from "../companySheetView.tsx";

// TD-F112: the platform's Companies sheet offered only (de)activate; Manage modules and Hide from portal lived in the
// table's row menu alone, breaking "a list's own sheet shows the same action menu as its row menu".
describe("company sheet actions", () => {
    it("offers the same platform actions as the list's row menu", () => {
        render(<CompanySheetView open onOpenChange={() => {}} company={{_id: "c1", name: "Adria Home Fix"} as never}/>);

        for (const label of ["activate", "deactivate", "manage modules", "portal visibility"]) {
            expect(screen.getByText(label)).toBeTruthy();
        }
    });
});
