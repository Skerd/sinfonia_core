import {render, waitFor} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";
import {MemoryRouter, useLocation} from "react-router-dom";

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key}/>,
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => Wrapped,
}));
// The list itself: record what the page hands it.
const {listProps} = vi.hoisted(() => ({listProps: [] as Record<string, unknown>[]}));
vi.mock("@coreModule/components/entityPage/pages/entityListPage.tsx", () => ({
    default: (props: Record<string, unknown>) => {
        listProps.push(props);
        return null;
    },
    EntityListHeader: () => null,
    EntityListCreateButton: () => null,
}));

import AllStates from "../states/index.tsx";
import AllCities from "../cities/index.tsx";

let search = "";
function Location() {
    search = useLocation().search;
    return null;
}

function renderAt(Page: ComponentType<Record<string, unknown>>, url: string) {
    listProps.length = 0;
    render(<MemoryRouter initialEntries={[url]}><Page/><Location/></MemoryRouter>);
}

const lastList = () => listProps[listProps.length - 1] as {quickFilters?: {field: string; dependsOn?: string}[]; extraFilters?: object};

// TD-F109: "View states / View cities" scoped the list through hidden URL params: no chip, no way to clear it, and the
// title dropped the name when the link carried none.
describe("place lists opened from a country or state", () => {
    it("turn the country scope into a named country quick filter", async () => {
        renderAt(AllStates, "/tenancy/systemSettings/states?countryId=c1&countryName=Albania");

        await waitFor(() => expect(new URLSearchParams(search).get("qf_country")).toBe("c1"));
        const params = new URLSearchParams(search);
        expect(params.get("qf_country_label")).toBe("Albania");
        expect(params.has("countryId")).toBe(false);
        expect(lastList().quickFilters?.map((filter) => filter.field)).toEqual(["country"]);
        expect(lastList().extraFilters).toBeUndefined();
    });

    it("turn a country and state scope into quick filters, the state's options following the country", async () => {
        renderAt(AllCities, "/tenancy/systemSettings/cities?countryId=c1&countryName=Albania&stateId=s1&stateName=Tirana%20District");

        await waitFor(() => expect(new URLSearchParams(search).get("qf_state")).toBe("s1"));
        expect(new URLSearchParams(search).get("qf_country")).toBe("c1");
        expect(lastList().quickFilters).toEqual(expect.arrayContaining([
            expect.objectContaining({field: "country"}),
            expect.objectContaining({field: "state", dependsOn: "country"}),
        ]));
    });
});
