import {fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key}/>,
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => Wrapped,
}));
vi.mock("@coreModule/helpers/hooks/useAccess.ts", () => ({useAccess: () => ({read: {permissions: true}, create: true})}));
vi.mock("@coreModule/components/custom/paginator", () => ({default: () => null}));

import PermissionsTable from "../permissionsTable.tsx";

const perm = (_id: string, tag: string, active: boolean) => ({_id, tag, group: "Products", active});
// Two fields of Products: the role reads the name only; the price is not granted at all.
const permissions = {
    Products: {
        self: [
            perm("n-read", "products[read:others:name]", true),
            perm("n-write", "products[write:others:name]", false),
            perm("p-read", "products[read:others:price]", false),
            perm("p-write", "products[write:others:price]", false),
        ],
        others: [],
    },
};

// TD-F111: an expanded role listed all 1,557 field rows, ungranted ones first, and building a role took hundreds of clicks.
describe("role permission matrix", () => {
    it("shows only what a role grants when viewing it, and everything on request", () => {
        render(<PermissionsTable permissions={permissions}/>);
        expect(screen.getByText("permissions.Products.name")).toBeTruthy();
        expect(screen.queryByText("permissions.Products.price")).toBeNull();

        fireEvent.click(screen.getByRole("switch"));
        expect(screen.getByText("permissions.Products.price")).toBeTruthy();
    });

    it("grants a whole column, a whole row or every shown row in one change while editing", () => {
        const select = vi.fn();
        render(<PermissionsTable permissions={permissions} editable onPermissionsSelect={select}/>);

        fireEvent.click(screen.getByRole("checkbox", {name: "selectAll: write"}));
        expect(select).toHaveBeenLastCalledWith(["n-write", "p-write"], true);

        fireEvent.click(screen.getByRole("checkbox", {name: "selectAll: permissions.Products.price"}));
        expect(select).toHaveBeenLastCalledWith(["p-read", "p-write"], true);

        fireEvent.click(screen.getByRole("checkbox", {name: "selectAll"}));
        expect(select).toHaveBeenLastCalledWith(["n-read", "n-write", "p-read", "p-write"], true);
        expect(select).toHaveBeenCalledTimes(3);
    });
});
