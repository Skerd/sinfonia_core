/**
 * `TableVirtuoso` renders its own `<thead>` and drops `fixedHeaderContent()` inside it,
 * so the virtualized table must hand it rows. When it was handed a whole `<thead>`, CSS
 * wrapped the nested table-header-group in an anonymous row and a single anonymous cell:
 * the entire header collapsed into column 1, which then stretched to fit it and crushed
 * every real column against the right edge. It only showed past the 50-row virtualization
 * threshold, which is why small lists looked fine.
 */
import {render} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import {getCoreRowModel, useReactTable, type ColumnDef} from "@tanstack/react-table";
import DataTableTableHeader, {DataTableHeaderRows} from "@coreModule/components/ui/table/table-header.tsx";

type Row = {name: string; code: string};

const COLUMNS: ColumnDef<Row>[] = [
    {id: "name", accessorKey: "name", header: () => <span>Name</span>},
    {id: "code", accessorKey: "code", header: () => <span>Code</span>},
    {id: "actions", cell: () => null},
];

function Harness({mode}: {mode: "rows" | "thead"}) {
    const table = useReactTable<Row>({
        data: [{name: "a", code: "b"}],
        columns: COLUMNS,
        getCoreRowModel: getCoreRowModel(),
    });
    /* `mode: "rows"` mirrors what TableVirtuoso does: our output inside its own thead. */
    return (
        <table>
            {mode === "rows" ? (
                <thead data-testid="virtuoso-thead">
                    <DataTableHeaderRows table={table} />
                </thead>
            ) : (
                <DataTableTableHeader table={table} />
            )}
        </table>
    );
}

describe("table header", () => {
    it("emits rows with no thead of its own, for the virtualized table", () => {
        const {container} = render(<Harness mode="rows" />);
        expect(container.querySelectorAll("thead")).toHaveLength(1);
        expect(container.querySelectorAll("thead > tr")).toHaveLength(1);
        /* Every column reaches the header row: the collapse showed up as a missing th. */
        expect(container.querySelectorAll("thead > tr > th")).toHaveLength(COLUMNS.length);
    });

    it("still wraps its own thead for the non-virtualized table", () => {
        const {container} = render(<Harness mode="thead" />);
        expect(container.querySelectorAll("thead")).toHaveLength(1);
        expect(container.querySelectorAll("thead > tr > th")).toHaveLength(COLUMNS.length);
    });
});
