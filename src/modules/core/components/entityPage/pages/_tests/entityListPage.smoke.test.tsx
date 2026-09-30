import {describe, expect, it, vi} from "vitest";
import {MemoryRouter} from "react-router-dom";
import {render, screen} from "@testing-library/react";

const listRows: {_id: string; name: string}[] = [];

vi.mock("@coreModule/helpers/hooks/useAccess.ts", () => ({
    useAccess: () => ({
        create: true,
        read: {name: {}},
        update: true,
        delete: true,
    }),
}));
vi.mock("@coreModule/components/custom/header.tsx", () => ({
    default: () => <div>header</div>,
}));
vi.mock("@coreModule/components/custom/pageHelp.tsx", () => ({
    readPageHelp: () => undefined,
}));
vi.mock("@coreModule/components/custom/hiddenElement.tsx", () => ({
    default: ({children}: {children: unknown}) => <>{children}</>,
}));
vi.mock("@coreModule/components/entityPage/list/cardAndTableView.tsx", () => ({
    default: () => (
        listRows.length === 0
            ? <div>no-rows</div>
            : <ul>{listRows.map((row) => <li key={row._id}>{row.name}</li>)}</ul>
    ),
}));
vi.mock("@coreModule/helpers/hooks/useViewConfig.ts", () => ({
    useViewConfig: () => ({config: null}),
}));
vi.mock("@coreModule/helpers/hooks/useDynamicLanguage.ts", () => ({
    useDynamicLanguage: () => ({}),
}));

import EntityListPage from "../entityListPage";

describe("EntityListPage smoke", () => {
    it("renders an empty list and a one-row list", () => {
        listRows.length = 0;
        const {rerender, unmount} = render(
            <MemoryRouter>
                <EntityListPage
                    apiUrl="/api/auxiliary/country"
                    collectionName="countries"
                    accessModel="countries"
                    tableConfigKey="countries"
                    createPath="/countries/create"
                    buildEditPath={(entity) => `/countries/${entity._id}`}
                    resolveLanguageKey={(key) => key}
                    renderSheet={() => null}
                />
            </MemoryRouter>,
        );
        expect(screen.getByText("no-rows")).toBeTruthy();

        listRows.push({_id: "1", name: "Albania"});
        rerender(
            <MemoryRouter>
                <EntityListPage
                    apiUrl="/api/auxiliary/country"
                    collectionName="countries"
                    accessModel="countries"
                    tableConfigKey="countries"
                    createPath="/countries/create"
                    buildEditPath={(entity) => `/countries/${entity._id}`}
                    resolveLanguageKey={(key) => key}
                    renderSheet={() => null}
                />
            </MemoryRouter>,
        );
        expect(screen.getByText("Albania")).toBeTruthy();
        unmount();
    });
});
