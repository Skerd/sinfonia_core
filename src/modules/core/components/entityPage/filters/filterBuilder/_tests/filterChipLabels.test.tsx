import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";
import {MemoryRouter, useLocation} from "react-router-dom";

const {postMock} = vi.hoisted(() => ({postMock: vi.fn()}));
vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: {post: postMock}}));
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key} languageCode="en-US"/>,
}));

import FilterBuilder, {type FilterBuilderLayout} from "../filterBuilder.tsx";
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

function Search() {
    return <output data-testid="search">{useLocation().search}</output>;
}

/* The list places the parts (D170); here the chips, and a "Clear all" that also drops a quick filter. */
function renderAt(params: Record<string, string>) {
    return render(
        <MemoryRouter initialEntries={[`/company/administration?${new URLSearchParams(params).toString()}`]}>
            <FilterBuilder
                resourceUrl="/api/company/users"
                filters={{}}
                setFilters={vi.fn()}
                filterFields={[rolesField]}
                configuration={{fields: {}}}
                editorOpen={false}
                onEditorClose={vi.fn()}
            >
                {(layout: FilterBuilderLayout) => (
                    <>
                        {layout.chips}
                        <button type="button" onClick={() => layout.clear((next) => next.delete("qf_status"))}>clear all</button>
                    </>
                )}
            </FilterBuilder>
            <Search/>
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

    // D170: "Roles contains cash" searches the linked record's name; its text is no id to look up.
    it("show a name search as its text, asking nothing", async () => {
        renderAt({filter: encodeFilterToUrl(buildFilterGroup([buildFilterRule("roles", "contains", "cash")]))});

        expect(await screen.findByText(/"cash"/)).toBeTruthy();
        expect(postMock).not.toHaveBeenCalled();
    });

    // react-router keeps only the last of two URL writes made at once: the list's "Clear all" is one write.
    it("clear the rules and the list's other filters in one URL write", async () => {
        renderAt({filter: rolesIsCashier, qf_status: "active", listPage: "3", keep: "1"});
        await screen.findByText(/Cashier/);

        fireEvent.click(screen.getByText("clear all"));

        await waitFor(() => expect(screen.getByTestId("search").textContent).toBe("?keep=1"));
        expect(screen.queryByText(/Cashier/)).toBeNull();
    });
});
