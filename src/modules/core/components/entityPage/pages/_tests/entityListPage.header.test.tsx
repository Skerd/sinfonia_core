import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ReactNode} from "react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import {fireEvent, render, screen} from "@testing-library/react";

const access = {create: true};
const helpKeys: (string | undefined)[] = [];

vi.mock("@coreModule/helpers/hooks/useAccess.ts", () => ({
    useAccess: () => ({create: access.create, read: {name: {}}, update: true, delete: true}),
}));
// A list page asks whether the viewer may request on a requestable platform list (D160); these lists are not.
vi.mock("@coreModule/helpers/hooks/useActionAccess.ts", () => ({
    useActionAccess: () => false,
}));
vi.mock("@coreModule/components/custom/header.tsx", () => ({
    default: ({title, description, children}: {title: string; description?: string; children?: ReactNode}) => (
        <header>
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
            {children}
        </header>
    ),
}));
vi.mock("@coreModule/components/custom/pageHelp.tsx", () => ({
    readPageHelp: (_resolve: unknown, key?: string) => {
        helpKeys.push(key);
        return undefined;
    },
}));
vi.mock("@coreModule/components/custom/hiddenElement.tsx", () => ({
    default: ({children}: {children: unknown}) => <>{children}</>,
}));
vi.mock("@coreModule/components/entityPage/list/cardAndTableView.tsx", () => ({
    default: () => <div>list</div>,
}));
vi.mock("@coreModule/helpers/hooks/useViewConfig.ts", () => ({
    useViewConfig: () => null,
}));
vi.mock("@coreModule/helpers/hooks/useDynamicLanguage.ts", () => ({
    useDynamicLanguage: () => ({}),
}));

import EntityListPage, {
    EntityListCreateButton,
    EntityListHeader,
    type EntityListHeaderContext,
    type EntityListPageProps,
} from "../entityListPage";

type Row = {_id: string; name: string};

const dictionary: Record<string, string> = {
    title: "Widgets",
    description: "All widgets",
    create: "Create",
    createWidget: "New widget",
};

function renderPage(header?: EntityListPageProps<Row>["header"]) {
    return render(
        <MemoryRouter initialEntries={["/widgets"]}>
            <Routes>
                <Route
                    path="/widgets"
                    element={
                        <EntityListPage<Row>
                            apiUrl="/api/widget"
                            collectionName="widgets"
                            accessModel="widgets"
                            tableConfigKey="widgets"
                            buildEditPath={(row) => `/widgets/${row._id}`}
                            resolveLanguageKey={(key) => dictionary[key] ?? key}
                            renderSheet={() => null}
                            header={header}
                        />
                    }
                />
                <Route path="/widgets/create" element={<div>create page</div>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe("EntityListPage header slot", () => {
    beforeEach(() => {
        access.create = true;
        helpKeys.length = 0;
    });

    it("renders the default header from the dictionary when the slot is omitted", () => {
        renderPage();
        expect(screen.getByRole("heading", {name: "Widgets"})).toBeTruthy();
        expect(screen.getByText("All widgets")).toBeTruthy();
        expect(screen.queryByRole("button")).toBeNull();
        expect(helpKeys).toEqual([undefined]);
    });

    it("renders no header when the slot is false", () => {
        renderPage(false);
        expect(screen.queryByRole("heading")).toBeNull();
        expect(screen.getByText("list")).toBeTruthy();
    });

    it("hands the context to a custom header composed from the parts", () => {
        let received: EntityListHeaderContext | undefined;
        renderPage((ctx) => {
            received = ctx;
            return (
                <EntityListHeader ctx={ctx} title="Scoped widgets" description="Of one project" helpKey="projectHelp">
                    <span>extra control</span>
                    <EntityListCreateButton ctx={ctx} path="/widgets/create" labelKey="createWidget" />
                </EntityListHeader>
            );
        });
        expect(received?.canCreate).toBe(true);
        expect(screen.getByRole("heading", {name: "Scoped widgets"})).toBeTruthy();
        expect(screen.getByText("Of one project")).toBeTruthy();
        expect(screen.getByText("extra control")).toBeTruthy();
        expect(helpKeys).toEqual(["projectHelp"]);

        fireEvent.click(screen.getByRole("button", {name: "New widget"}));
        expect(screen.getByText("create page")).toBeTruthy();
    });

    it("hides the create button without the create grant", () => {
        access.create = false;
        renderPage((ctx) => (
            <EntityListHeader ctx={ctx}>
                <EntityListCreateButton ctx={ctx} path="/widgets/create" />
            </EntityListHeader>
        ));
        expect(screen.getByRole("heading", {name: "Widgets"})).toBeTruthy();
        expect(screen.queryByRole("button", {name: "Create"})).toBeNull();
    });
});
