import {Skeleton} from "@coreModule/components/ui/skeleton.tsx";
import {Card} from "@coreModule/components/ui/card.tsx";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@coreModule/components/ui/table/table.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

/**
 * Placeholders for the entity list while the first page is in flight.
 *
 * These deliberately mirror the real layouts rather than being generic bars:
 * the card placeholder reserves `--card-media-height` because that is what the
 * carousel occupies, and the table placeholder emits the same column count as
 * the live table. A skeleton whose geometry disagrees with the content it
 * stands in for creates the layout shift it exists to prevent.
 */

/** Single card placeholder. Caller supplies the grid wrapper. */
export function EntityCardSkeleton() {
    return (
        <Card className="h-fit gap-0 overflow-hidden p-0" aria-hidden="true">
            <Skeleton className="min-h-(--card-media-height) w-full rounded-none" />
            <div className="flex w-full flex-col gap-2 p-3">
                <Skeleton className="h-4 w-3/5" />
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-14" />
                </div>
                <div className="flex flex-wrap gap-1 pt-0.5">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                </div>
            </div>
        </Card>
    );
}

/**
 * Card placeholders as a plain array, so the caller can drop them into the
 * same grid container it uses for real cards.
 */
export function entityCardSkeletonItems(count: number, itemClassName?: string) {
    return Array.from({length: Math.max(count, 1)}, (_, i) => (
        <div key={`entity-card-skeleton-${i}`} className={itemClassName}>
            <EntityCardSkeleton />
        </div>
    ));
}

/** Full table placeholder, including the header row. */
export function EntityTableSkeleton({
    rows = 8,
    columns = 5,
    className,
}: {
    rows?: number;
    columns?: number;
    className?: string;
}) {
    const columnCount = Math.max(columns, 1);
    const rowCount = Math.max(rows, 1);

    return (
        <div
            role="status"
            aria-busy="true"
            aria-label="Loading"
            className={cn("min-w-0 w-full overflow-hidden rounded-md border", className)}
        >
            <Table>
                <TableHeader>
                    <TableRow>
                        {Array.from({length: columnCount}, (_, c) => (
                            <TableHead key={`head-${c}`}>
                                <Skeleton className="h-3.5 w-24" />
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({length: rowCount}, (_, r) => (
                        <TableRow key={`row-${r}`}>
                            {Array.from({length: columnCount}, (_, c) => (
                                <TableCell key={`cell-${r}-${c}`}>
                                    {/* Last column is the action menu: a narrow square, not a bar. */}
                                    <Skeleton
                                        className={cn(
                                            "h-4",
                                            c === columnCount - 1 ? "ml-auto w-6" : "w-full max-w-40",
                                        )}
                                    />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
