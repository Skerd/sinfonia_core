/**
 * Cell-rendering coverage for the server-driven table mapper. The read-gating tests
 * live next door in `columnConfigToColumnDef.test.tsx`; this file pins down what a
 * cell actually puts on screen for each `cellType`, including the empty and
 * malformed payloads the API really sends.
 */
import {cleanup, render, screen, within} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import {MemoryRouter} from "react-router-dom";
import type {ReactNode} from "react";
import type {ColumnDef, Row} from "@tanstack/react-table";
import languageReducer from "@coreModule/helpers/redux/slices/languageSlice.ts";
import type {TableColumnConfig} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type.ts";
import {columnConfigToColumnDef} from "@coreModule/components/entityPage/list/table/columnConfigToColumnDef.tsx";

type Doc = Record<string, unknown>;

const store = configureStore({reducer: {language: languageReducer}});

function Wrapper({children}: {children: ReactNode}) {
    return (
        <Provider store={store}>
            <MemoryRouter>{children}</MemoryRouter>
        </Provider>
    );
}

/** `cellType` stays a plain string here so a test can name one the enum has not caught up with. */
function column(
    overrides: Omit<Partial<TableColumnConfig>, "cellType"> & {id: string; cellType?: string},
): TableColumnConfig {
    return {
        accessorPath: overrides.id,
        labelKey: overrides.id,
        cellType: "string",
        sortable: true,
        visible: true,
        ...overrides,
    } as TableColumnConfig;
}

/** Stands in for the TanStack row: `getValue` resolves the accessor the same way the table would. */
function fakeRow(doc: Doc): Row<Doc> {
    return {
        original: doc,
        getValue: (id: string) => id.split(".").reduce<unknown>((acc, key) => (acc as Doc | null)?.[key], doc),
    } as unknown as Row<Doc>;
}

/**
 * Builds the column defs (the mapper calls a hook, so it runs inside a component)
 * and renders one row's cell for the requested column.
 */
function renderCell(col: TableColumnConfig, doc: Doc, fields: Record<string, unknown> = {}) {
    function Harness() {
        const defs = columnConfigToColumnDef<Doc>([col], {fields, timezone: "UTC"}) as ColumnDef<Doc>[];
        const def = defs[0];
        const cell = def.cell as (ctx: {row: Row<Doc>}) => ReactNode;
        return <div data-testid="cell">{cell({row: fakeRow(doc)})}</div>;
    }
    /* Query the render's own container: several tests render twice, and `screen` spans both. */
    return render(<Harness />, {wrapper: Wrapper}).getByTestId("cell");
}

/** `TextBadge` puts the label in an inner truncating span, so tone classes sit on the badge. */
function badgeFor(cell: HTMLElement, text: string): HTMLElement {
    const badge = within(cell).getByText(text).closest('[data-slot="badge"]');
    if (!badge) throw new Error(`no badge around "${text}"`);
    return badge as HTMLElement;
}

describe("empty and malformed values", () => {
    it("renders an em dash when the dtoPath is missing", () => {
        const col = column({id: "note", cellType: "string", dtoPath: "deep.missing.note"});
        expect(renderCell(col, {}).textContent).toBe("—");
    });

    it("does not show a missing boolean as checked", () => {
        const col = column({id: "verified", cellType: "boolean", dtoPath: "deep.missing.verified"});
        expect(renderCell(col, {}).textContent).toBe("—");
    });

    it("renders false as No and true as Yes", () => {
        const col = column({id: "verified", cellType: "boolean"});
        expect(within(renderCell(col, {verified: false})).getByRole("img")).toHaveAccessibleName("No");
        cleanup();
        expect(within(renderCell(col, {verified: true})).getByRole("img")).toHaveAccessibleName("Yes");
    });

    it("renders an em dash for an unparseable date", () => {
        const col = column({id: "createdAt", cellType: "datetime"});
        expect(renderCell(col, {createdAt: "not-a-date"}).textContent).toBe("—");
    });

    it("survives an object landing in a text column", () => {
        const col = column({id: "name", cellType: "string"});
        expect(renderCell(col, {name: {deep: 1}}).textContent).toContain("deep");
    });
});

describe("dates", () => {
    it("formats compactly and keeps the full form in the title", () => {
        const col = column({id: "createdAt", cellType: "datetime"});
        const cell = renderCell(col, {createdAt: "2026-09-16T14:23:05.000Z"});
        expect(cell.textContent).toContain("2026");
        expect(cell.textContent).not.toContain("September 16, 2026");
        expect(cell.querySelector("span")?.getAttribute("title")).toContain("September 16, 2026");
    });
});

describe("numbers", () => {
    it("leaves a four-digit value ungrouped and groups from five digits up", () => {
        const col = column({id: "year", cellType: "number"});
        expect(renderCell(col, {year: 2026}).textContent).toBe("2026");
        cleanup();
        expect(renderCell(col, {year: 20260}).textContent).toBe("20,260");
    });

    it("appends the percent sign", () => {
        const col = column({id: "share", cellType: "percentage"});
        expect(renderCell(col, {share: 12.5}).textContent).toBe("12.5%");
    });
});

describe("enums", () => {
    it("uses the translated label when the dictionary has one", () => {
        const col = column({id: "status", cellType: "enum"});
        const fields = {"!enums": {status: {draft: "Entwurf"}}};
        expect(renderCell(col, {status: "draft"}, fields).textContent).toBe("Entwurf");
    });

    it("humanises the raw value instead of printing the lookup key", () => {
        const col = column({id: "status", cellType: "enum"});
        const cell = renderCell(col, {status: "in_progress"});
        expect(cell.textContent).toBe("In Progress");
        expect(cell.textContent).not.toContain("!enums");
    });

    it("paints the tone the column config declares", () => {
        const col = column({
            id: "status",
            cellType: "enum",
            meta: {enumTones: {won: "success", lost: "danger"}},
        });
        expect(badgeFor(renderCell(col, {status: "won"}), "Won")).toHaveClass("text-success");
        cleanup();
        expect(badgeFor(renderCell(col, {status: "lost"}), "Lost")).toHaveClass("text-destructive");
    });

    it("leaves a value the config says nothing about untoned", () => {
        const col = column({
            id: "status",
            cellType: "enum",
            meta: {enumTones: {won: "success"}},
        });
        /* The point of config-driven tones: an enum this client has never heard of is
           not silently coloured by a guess, it just renders plain. */
        const badge = badgeFor(renderCell(col, {status: "some_future_value"}), "Some Future Value");
        expect(badge).not.toHaveClass("text-success");
        expect(badge).not.toHaveClass("text-destructive");
    });

    it("renders untoned when the column declares no tones at all", () => {
        const col = column({id: "status", cellType: "enum"});
        expect(badgeFor(renderCell(col, {status: "won"}), "Won")).not.toHaveClass("text-success");
    });
});

describe("multi-value collapsing", () => {
    const refCol = column({
        id: "trades",
        cellType: "objectId",
        meta: {refDisplayKey: ["name"], maxInlineItems: 2},
    });
    const doc = {trades: [{_id: "1", name: "Alpha"}, {_id: "2", name: "Beta"}, {_id: "3", name: "Gamma"}]};

    it("shows maxInlineItems inline and collapses the rest", () => {
        const cell = renderCell(refCol, doc);
        expect(cell.textContent).toContain("Alpha");
        expect(cell.textContent).toContain("Beta");
        expect(cell.textContent).not.toContain("Gamma");
        expect(within(cell).getByRole("button")).toHaveTextContent("+1 more");
    });

    it("makes the overflow trigger a real button, so it is reachable by keyboard", () => {
        const cell = renderCell(refCol, doc);
        expect(within(cell).getByRole("button").tagName).toBe("BUTTON");
    });

    it("applies the same rule to a plain array column", () => {
        const col = column({id: "tags", cellType: "array"});
        const cell = renderCell(col, {tags: ["a", "b", "c", "d", "e"]});
        expect(within(cell).getByRole("button")).toHaveTextContent("+3 more");
    });

    it("renders an em dash when every entry is empty", () => {
        const col = column({id: "trades", cellType: "objectId", meta: {refDisplayKey: ["name"]}});
        expect(renderCell(col, {trades: []}).textContent).toBe("—");
    });
});

describe("links", () => {
    it("turns an objectId ref with an hrefTemplate into a link", () => {
        const col = column({
            id: "project",
            cellType: "objectId",
            meta: {refDisplayKey: ["name"], hrefTemplate: "/projects/{_id}"},
        });
        const cell = renderCell(col, {project: {_id: "abc", name: "Tower"}});
        expect(within(cell).getByRole("link")).toHaveAttribute("href", "/projects/abc");
    });

    it("turns an email text value into a mailto link", () => {
        const col = column({id: "username", cellType: "string"});
        const cell = renderCell(col, {username: "a@b.com"});
        expect(within(cell).getByRole("link")).toHaveAttribute("href", "mailto:a@b.com");
    });
});

describe("headers", () => {
    it("falls back to a humanised label when nothing is translated", () => {
        function Harness() {
            const defs = columnConfigToColumnDef<Doc>([column({id: "submissionDeadline"})], {
                fields: {},
                timezone: "UTC",
            }) as ColumnDef<Doc>[];
            return <span data-testid="label">{(defs[0].meta as {label?: string})?.label}</span>;
        }
        render(<Harness />, {wrapper: Wrapper});
        expect(screen.getByTestId("label").textContent).toBe("Submission Deadline");
    });
});
