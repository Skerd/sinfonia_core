import {fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import type {ComponentType, ReactNode} from "react";

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", async (original) => ({
    ...(await original<object>()),
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key}/>,
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => Wrapped,
}));
vi.mock("@coreModule/helpers/context/accessContext.tsx", async (original) => ({
    ...(await original<object>()),
    accessFieldPathExists: () => true,
}));
// The card shell hands its body the row; the header (its menu) is left out.
vi.mock("@coreModule/components/entityPage/list/card/entityCard.tsx", () => {
    const EntityCard = ({entity, children}: {entity: unknown; children: (args: object) => ReactNode}) =>
        <div>{children({entity, read: {}, setAction: () => {}, setEntity: () => {}})}</div>;
    EntityCard.Header = () => null;
    EntityCard.Body = ({children}: {children?: ReactNode}) => <div>{children}</div>;
    return {default: EntityCard};
});
vi.mock("@coreModule/components/entityPage/list/card/entityCardRow.tsx", () => ({default: () => null}));
vi.mock("@coreModule/components/viewEngine/widgets/addresses/mapWithMultiplePins.tsx", () => ({default: () => <p>live map</p>}));
vi.mock("@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/sheetView/companySheetView.tsx", () => ({default: () => null}));

import CompanyCard from "../companyCard.tsx";

const company = {_id: "c1", name: "Adria Home Fix", modules: ["core"], allowedDomains: [], addresses: [{latitude: 41.33, longitude: 19.82}]};

// TD-F127: the platform's Companies list mounted a live map in every card (nine on one page).
describe("company card map", () => {
    it("loads the map in a list only when asked", async () => {
        render(<CompanyCard company={company as never}/>);
        expect(screen.queryByText("live map")).toBeNull();

        fireEvent.click(screen.getByRole("button", {name: "showMap"}));
        expect(await screen.findByText("live map")).toBeTruthy();
    });

    it("shows it straight away for the one company", async () => {
        render(<CompanyCard company={company as never} single/>);
        expect(await screen.findByText("live map")).toBeTruthy();
    });
});
