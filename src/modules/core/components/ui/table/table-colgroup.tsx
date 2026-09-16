import type {Table} from "@tanstack/react-table";

/**
 * Pins column widths so they come from the column config rather than from whatever
 * rows happen to be in the DOM.
 *
 * Under the default `table-layout: auto` the browser measures every rendered cell to
 * size the columns. That is fine for a static page, but the virtualized table swaps
 * its rows as you scroll, so each swap re-measures against different content and the
 * columns visibly jump — worst on the widest cells, which move the most. Paired with
 * `table-fixed`, the widths below are the only input, so scrolling changes nothing.
 *
 * Sizes come from each column's `size` (TanStack's `getSize()`), which the table-config
 * mapper sets per cell type.
 */
export function TableColGroup<T>({table}: {table: Table<T>}) {
    return (
        <colgroup>
            {table.getVisibleLeafColumns().map((column) => (
                <col key={column.id} style={{width: column.getSize()}} />
            ))}
        </colgroup>
    );
}

/**
 * Total width the columns ask for. The table takes this as its width so the columns keep
 * the sizes they were given and the container scrolls horizontally when they do not fit;
 * `minWidth: "100%"` lets a narrow table still fill the container.
 */
export function tableWidthStyle<T>(table: Table<T>) {
    return {width: table.getTotalSize(), minWidth: "100%"} as const;
}

export default TableColGroup;
