import {render, screen} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";
import {MemoryRouter} from "react-router-dom";

const {postMock} = vi.hoisted(() => ({postMock: vi.fn()}));
vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: {post: postMock}}));
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key} languageCode="en-US"/>,
}));

import FilterBuilder from "../filterBuilder.tsx";
import {
    buildFilterGroup,
    buildFilterRule,
    encodeFilterLabelsToUrl,
    encodeFilterToUrl,
} from "@coreModule/helpers/filter/filterUrl.ts";
import type {FilterFieldConfig} from "armonia/src/modules/core/database/filter";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators.ts";

const CASHIER = "6afa2998f923ec9c431317af";
const ROLES_SELECT = "/api/user/permissions/accessible/roles/select";
const rolesField: FilterFieldConfig = {path: "roles", type: COLUMN_TYPE.OBJECT_ID, label: "Roles", apiUrl: ROLES_SELECT};

function renderAt(params: Record<string, string>) {
    return render(
        <MemoryRouter initialEntries={[`/company/administration?${new URLSearchParams(params).toString()}`]}>
            <FilterBuilder
                resourceUrl="/api/company/users"
                filters={{}}
                setFilters={vi.fn()}
                filterFields={[rolesField]}
                configuration={{placeholder: "Search", fields: {}}}
            />
        </MemoryRouter>,
    );
}

const rolesIsCashier = encodeFilterToUrl(buildFilterGroup([buildFilterRule("roles", "equals", CASHIER)]));

beforeEach(() => {
    postMock.mockReset();
    postMock.mockResolvedValue({data: {data: [{_id: CASHIER, name: "Cashier"}], total: 1}});
});

// TD-F108: a link carrying `filter` without `filterLabels` showed the chip as `Roles is "6afa2998f923ec9c431317af"`.
describe("filter chips for reference values", () => {
    it("name the record when the link carries no labels, asking the field's select route by id", async () => {
        renderAt({filter: rolesIsCashier});

        expect(await screen.findByText(/Cashier/)).toBeTruthy();
        expect(screen.queryByText(new RegExp(CASHIER))).toBeNull();
        expect(postMock).toHaveBeenCalledTimes(1);
        expect(postMock).toHaveBeenCalledWith(ROLES_SELECT, expect.objectContaining({ids: [CASHIER]}), expect.anything());
    });

    it("use the link's own labels without asking", async () => {
        renderAt({filter: rolesIsCashier, filterLabels: encodeFilterLabelsToUrl({roles: {[CASHIER]: "Cashier"}})});

        expect(await screen.findByText(/Cashier/)).toBeTruthy();
        expect(postMock).not.toHaveBeenCalled();
    });
});
