import { cn } from "@coreModule/components/lib/utils.ts"
import { Button } from '@coreModule/components/ui/button.tsx'
import { type Column } from '@tanstack/react-table'
import {ArrowDownIcon, ArrowUpIcon, CaretSortIcon, EyeNoneIcon} from '@radix-ui/react-icons'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger} from '@coreModule/components/ui/dropdown-menu.tsx'
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {TranslationValue} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {HTMLAttributes} from "react";

type DataTableColumnHeaderProps<TData, TValue> =
  HTMLAttributes<HTMLDivElement> & {
    column: Column<TData, TValue>
    title: TranslationValue
  }

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
    resolveLanguageKey

}: DataTableColumnHeaderProps<TData, TValue> & WithLanguageType) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className='data-[state=open]:bg-accent h-8'
          >
            <span>{title}</span>
            {column.getIsSorted() === 'desc' ? (
              <ArrowDownIcon className='ms-2 h-4 w-4' />
            ) : column.getIsSorted() === 'asc' ? (
              <ArrowUpIcon className='ms-2 h-4 w-4' />
            ) : (
              <CaretSortIcon className='ms-2 h-4 w-4' />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start'>
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUpIcon className='text-muted-foreground/70 size-3.5' />
            {resolveLanguageKey("asc")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDownIcon className='text-muted-foreground/70 size-3.5' />
            {resolveLanguageKey("desc")}
          </DropdownMenuItem>
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <EyeNoneIcon className='text-muted-foreground/70 size-3.5' />
                {resolveLanguageKey("hide")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default compose(
    withLanguage("src/modules/core/components/ui/table/column-header.tsx")
)(DataTableColumnHeader)
