import {compose} from "redux";
import {flexRender, type Table} from "@tanstack/react-table";
import {TableHead, TableHeader, TableRow} from "@coreModule/components/ui/table/table.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

type DataTableTableHeaderProps = {
    table: Table<any>
}

/**
 * The header rows on their own, with no `<thead>` around them.
 *
 * `TableVirtuoso` renders its own `<thead>` and puts `fixedHeaderContent()` inside it,
 * so the virtualized table has to hand it rows. Handing it a `<thead>` nests one
 * table-header-group inside another, which CSS resolves by wrapping the inner one in
 * an anonymous row and a single anonymous cell: the whole header collapses into
 * column 1, that column stretches to fit it, and every real column is crushed against
 * the right edge.
 */
export function DataTableHeaderRows({table}: DataTableTableHeaderProps) {
    return (
        <>
            {
                table.getHeaderGroups().map((headerGroup) => {
                    return (
                        <TableRow key={headerGroup.id} className='group/row'>
                            {
                                headerGroup.headers.map((header) => {
                                    const isActions = header.column.id === "actions";
                                    /* ROW SELECTION — parked until a multi-selection action exists (bulk delete/export/assign). */
                                    // const isSelect = header.column.id === "select";
                                    return (
                                        <TableHead
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            className={cn(
                                                'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted px-0 border-e border-dashed py-0.5',
                                                /* `table-fixed` only holds if the cell clips what will not fit. */
                                                'overflow-hidden',
                                                isActions && "sticky right-0 z-20 shadow-[-4px_0_8px_-6px_oklch(0_0_0/0.15)]",
                                                // isSelect && "sticky left-0 z-20 w-10",
                                                //@ts-ignore
                                                header.column.columnDef.meta?.className,
                                                //@ts-ignore
                                                header.column.columnDef.meta?.thClassName,
                                            )}
                                        >
                                            {
                                                header.isPlaceholder ?
                                                null
                                                :
                                                <div className={cn("", {"px-2.5": !header.column.getCanSort()})} style={{border: "0px solid red"}}>
                                                    {
                                                        flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )
                                                    }
                                                </div>

                                            }
                                        </TableHead>
                                    )
                                }
                            )}
                        </TableRow>
                    )
                })
            }
        </>
    )
}

/** The non-virtualized table's header: the same rows, in a `<thead>` of our own. */
function DataTableTableHeader({
    table
}: DataTableTableHeaderProps) {

    return (
        <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
            <DataTableHeaderRows table={table} />
        </TableHeader>
    )
}

export default compose()(DataTableTableHeader);
