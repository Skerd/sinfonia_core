/**
 * Column widths must come from the column config, never from the rows that happen to be
 * rendered. Under the default `table-layout: auto` the browser measures rendered cells,
 * so the virtualized table's columns jumped every time scrolling swapped the row set.
 */
import {render} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import {getCoreRowModel, useReactTable, type ColumnDef} from "@tanstack/react-table";
import {TableColGroup, tableWidthStyle} from "@coreModule/components/ui/table/table-colgroup.tsx";

type Row = {name: string};

const COLUMNS: ColumnDef<Row>[] = [
    {id: "name", accessorKey: "name", size: 220, cell: (c) => String(c.getValue())},
    {id: "flag", size: 90, cell: () => "x"},
    {id: "actions", size: 64, cell: () => null},
];

function Harness({data}: {data: Row[]}) {
    const table = useReactTable<Row>({data, columns: COLUMNS, getCoreRowModel: getCoreRowModel()});
    return (
        <table style={tableWidthStyle(table)} className="table-fixed">
            <TableColGroup table={table} />
            <tbody>
                {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                            <td key={cell.id}>{cell.renderValue() as string}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

const widths = (container: HTMLElement) =>
    [...container.querySelectorAll("colgroup > col")].map((c) => (c as HTMLElement).style.width);

describe("table colgroup", () => {
    it("emits one col per visible column, sized from the config", () => {
        const {container} = render(<Harness data={[{name: "short"}]} />);
        expect(widths(container)).toEqual(["220px", "90px", "64px"]);
    });

    it("keeps the same widths whatever the rendered rows contain", () => {
        /* The scroll flicker was exactly this: different rows in the DOM, different widths. */
        const narrow = render(<Harness data={[{name: "a"}]} />);
        const wide = render(<Harness data={[{name: "an extremely long value ".repeat(20)}]} />);
        expect(widths(wide.container)).toEqual(widths(narrow.container));
    });

    it("asks for the total column width so the container can scroll it", () => {
        const {container} = render(<Harness data={[{name: "a"}]} />);
        const table = container.querySelector("table") as HTMLElement;
        expect(table.style.width).toBe("374px");
        /* A table narrower than its container still fills it. */
        expect(table.style.minWidth).toBe("100%");
    });
});
