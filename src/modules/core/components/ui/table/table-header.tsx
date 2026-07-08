import {compose} from "redux";
import {flexRender, type Table} from "@tanstack/react-table";
import {TableHead, TableHeader, TableRow} from "@coreModule/components/ui/table/table.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

type DataTableTableHeaderProps = {
    table: Table<any>
}

function DataTableTableHeader({
    table
}: DataTableTableHeaderProps) {

    return (
        <TableHeader>
            {
                table.getHeaderGroups().map((headerGroup) => {
                    return (
                        <TableRow key={headerGroup.id} className='group/row'>
                            {
                                headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            className={cn(
                                                'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted px-0 border-e border-dashed py-0.5',
                                                //@ts-ignore
                                                header.column.columnDef.meta?.className,
                                                //@ts-ignore
                                                header.column.columnDef.meta?.thClassName,
                                            )}
                                            // style={{border: "2px solid blue"}}
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
        </TableHeader>
    )
}

export default compose()(DataTableTableHeader);