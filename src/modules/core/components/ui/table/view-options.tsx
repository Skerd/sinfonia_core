import * as React from 'react'
import {Button} from '@coreModule/components/ui/button.tsx'
import {Input} from '@coreModule/components/ui/input.tsx'
import {type Table} from '@tanstack/react-table'
import {MixerHorizontalIcon} from '@radix-ui/react-icons'
import {DropdownMenuTrigger} from '@radix-ui/react-dropdown-menu'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@coreModule/components/ui/dropdown-menu.tsx'
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";

type DataTableViewOptionsProps<TData> = {
    table: Table<TData>
}

function getColumnLabel(column: { id: string; columnDef: { meta?: { label?: string } } }): string {
    return (column.columnDef.meta as { label?: string } | undefined)?.label ?? column.id
}

export function DataTableViewOptions<TData>({
    table,
    resolveLanguageKey
}: DataTableViewOptionsProps<TData> & WithLanguageType) {
    const [search, setSearch] = React.useState('')

    const hideable = table
        .getAllColumns()
        .filter(
            (column) =>
                typeof column.accessorFn !== 'undefined' && column.getCanHide()
        )
    const columns = !search.trim()
        ? hideable
        : hideable.filter((column) =>
              getColumnLabel(column).toLowerCase().includes(search.trim().toLowerCase())
          )

    return (
        <DropdownMenu modal={false} onOpenChange={(open) => !open && setSearch('')}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size='icon'
                    className='ms-auto border'
                >
                    <MixerHorizontalIcon className='size-4'/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='flex w-max min-w-[200px] max-h-[60vh] flex-col overflow-hidden'>
                <div className="shrink-0">
                    <DropdownMenuLabel>{resolveLanguageKey("toggleColumns")}</DropdownMenuLabel>
                    <div
                        className="px-2 pb-2"
                        onKeyDown={(e) => e.stopPropagation()}
                    >
                        <Input
                            placeholder={resolveLanguageKey("searchColumns")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8"
                        />
                    </div>
                    <DropdownMenuSeparator/>
                </div>
                <div className="min-h-0 overflow-y-auto">
                    {columns.length === 0 ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            {resolveLanguageKey("noColumnsMatch")}
                        </div>
                    ) : (
                        columns.map((column) => (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                className='capitalize'
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                            >
                                {getColumnLabel(column)}
                            </DropdownMenuCheckboxItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default compose(
    withLanguage("src/modules/core/components/ui/table/view-options.tsx")
)(DataTableViewOptions)
