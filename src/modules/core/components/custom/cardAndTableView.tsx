import {compose} from "redux";
import {useAccessHydrated} from "@baseModule/helpers/context/accessContext.tsx";
import {useAccess} from "@baseModule/helpers/hooks/useAccess.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {ToggleGroup, ToggleGroupItem} from "@coreModule/components/ui/toggle-group.tsx";
import {LayoutGrid, List, SlidersVertical} from "lucide-react";
import {type CSSProperties, JSX, type KeyboardEvent, type ReactNode, Ref, useEffect, useImperativeHandle, useMemo, useRef, useState} from "react";
import {TableVirtuoso, type FillerRowProps, type ItemProps, type TableComponents, type TableProps} from "react-virtuoso";
// ROW SELECTION — parked until a multi-selection action exists (bulk delete/export/assign).
// import {Checkbox} from "@coreModule/components/ui/checkbox.tsx";
import {useListUrlState, listChromeParam, LIST_PAGE_PARAM, type EntityListViewMode as UrlViewMode} from "@baseModule/helpers/hooks/useListUrlState.ts";
// import type {RowSelectionState} from "@tanstack/react-table";
import withAxios, {WithAxiosType} from "@baseModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import type { FilterGroup } from "armonia/src/modules/core/database/filter";
import { isFilterGroupEmpty, mergeAndFilterDSL } from "@baseModule/helpers/filter/mergeFilterDsl.ts";
import { decodeFilterFromUrl, FILTER_URL_PARAM } from "@baseModule/helpers/filter/filterUrl.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import Forbidden from "@coreModule/components/custom/pages/forbidden.tsx";
import PageController from "@coreModule/components/custom/paginator";
import NoData from "@coreModule/components/custom/noData.tsx";
import {entityCardSkeletonItems, EntityTableSkeleton} from "@coreModule/components/custom/skeletons/entityListSkeleton.tsx";
import {ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, type Row, useReactTable} from "@tanstack/react-table";
import {Table, TableBody, TableCell, TableRow} from "@coreModule/components/ui/table/table.tsx";
import {isDialogDismissGuarded} from "@coreModule/components/ui/dialog.tsx";
import DataTableTableHeaderProps, {DataTableHeaderRows} from "@coreModule/components/ui/table/table-header.tsx";
import {TableColGroup, tableWidthStyle} from "@coreModule/components/ui/table/table-colgroup.tsx";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import DataTableViewOptions from "@coreModule/components/ui/table/view-options.tsx";
import {Collapsible, CollapsibleContent} from "@coreModule/components/ui/collapsible.tsx";
import {useIsMobile} from "@baseModule/helpers/hooks/useMobile.tsx";
import {useTableConfig} from "@baseModule/helpers/hooks/useTableConfig.ts";
import {GRID_MASONRY_ITEM} from "@coreModule/components/custom/cards/entityCard.constants.ts";
import {columnConfigToColumnDef} from "@baseModule/components/custom/table/columnConfigToColumnDef.tsx";
import FilterBuilder from "@coreModule/components/custom/filterBuilder/filterBuilder.tsx";
import {useSelector} from "react-redux";
import {RootState} from "@baseModule/helpers/redux/store/generalStore.ts";
import {openActionMenuFromContextMenu} from "@coreModule/components/custom/actions/menu/openActionMenuFromContextMenu.ts";
import {useSearchParams} from "react-router-dom";

/**
 * Imperative list-mutation API exposed by {@link CardAndTableView} via `ref`/`listRef`
 * and forwarded to cards, sheets and row actions.
 *
 * Single source of truth: consumers must reference this type rather than restating
 * the shape inline, otherwise a ref declared without `mapRows` silently stops
 * matching the component's prop type.
 */
export type EntityListApi<T> = {
    refetch: () => void;
    updateRow: (id: string | number, patch: Partial<T>) => void;
    /** Patch currently loaded rows in place (no network). Return a patch or void to skip. */
    mapRows: (mapper: (row: T) => Partial<T> | void) => void;
};

/** Card list cell: always reserve 1px border so highlighting never reflows the grid. */
const ENTITY_CARD_WRAPPER_BASE = "rounded-xl border border-transparent box-border transition-colors";

/** While {@link ActionMenu} is open, Radix sets `[data-state=open]` on `[data-slot=dropdown-menu-trigger]`. */
const ENTITY_CARD_MENU_OPEN =
    "has-[[data-slot=dropdown-menu-trigger][data-state=open]]:border-ring/40 has-[[data-slot=dropdown-menu-trigger][data-state=open]]:bg-muted/40 has-[[data-slot=dropdown-menu-trigger][data-state=open]]:ring-2 has-[[data-slot=dropdown-menu-trigger][data-state=open]]:ring-ring/35";

/** Table: highlight row while row action menu is open. */
const ENTITY_TABLE_ROW_MENU_OPEN =
    "has-[[data-slot=dropdown-menu-trigger][data-state=open]]:bg-muted/35 has-[[data-slot=dropdown-menu-trigger][data-state=open]]:ring-2 has-[[data-slot=dropdown-menu-trigger][data-state=open]]:ring-inset has-[[data-slot=dropdown-menu-trigger][data-state=open]]:ring-ring/45";

const ENTITY_TABLE_CELL_MENU_OPEN =
    "group-has-[[data-slot=dropdown-menu-trigger][data-state=open]]/row:bg-muted/40";

type EntityListViewMode = UrlViewMode;

function listViewModeStorageKey(tableConfigKey: string): string {
    return `entityListViewMode:${tableConfigKey}`;
}

function loadStoredListViewMode(tableConfigKey: string, fallback: EntityListViewMode = "card"): EntityListViewMode {
    if (typeof window === "undefined" || !tableConfigKey) {
        return fallback;
    }
    try {
        const v = localStorage.getItem(listViewModeStorageKey(tableConfigKey));
        if (v === "card" || v === "table") {
            return v;
        }
    } catch {
        /* ignore */
    }
    return fallback;
}

function saveStoredListViewMode(tableConfigKey: string, mode: EntityListViewMode): void {
    if (!tableConfigKey) return;
    try {
        localStorage.setItem(listViewModeStorageKey(tableConfigKey), mode);
    } catch {
        /* ignore */
    }
}

type VisibilityState = Record<string, boolean>;

type TableConfigOptions = {
    filterConfig: { placeholder: string; fields: unknown };
};

/** Response shape: { data: T[], total: number }. PostType = request/filter params. */
type CountryCenterViewProps<ResponseType extends { data: unknown[]; total: number }, PostType extends Record<string, unknown> = Record<string, unknown>, T = ResponseType['data'][number]> = WithLanguageType & WithAxiosType<ResponseType, PostType> & {
    access: string,
    selfAccess?: boolean,
    url: string,
    tableConfigKey: string,
    enableTableConfig?: boolean;
    tableConfigOptions?: TableConfigOptions;
    requestInfo?: {
        fail?: {
            failTitle?: string,
            failDescription?: string,
            tooltipDescription?: string,
        },
        noData?: string,
        loading?: string
    },
    containersClassName?: {
        cardViewClassName?: string,
        scrollRootClassName?: string,
    }
    configurations: {
        limit?: number,
        columnVisibility?: VisibilityState,
    },
    renderFunctions: {
        cardRender: (data: T) => JSX.Element,
        action: (data: T) => ReactNode,
        /** Table row activation (Enter/click) — typically opens the entity sheet. */
        onRowClick?: (data: T) => void,
    },
    getItems?: (response: ResponseType) => T[];
    getTotal?: (response: ResponseType) => number;
    getId?: (item: T) => string | number;
    onRegister?: (api: EntityListApi<T>) => void;
    ref?: Ref<EntityListApi<T> | null>;
    listRef?: Ref<EntityListApi<T> | null>;
    extraParams?: Record<string, unknown>;
    extraFilters?: Record<string, unknown>;
    /** AND-merged ahead of Filter Builder DSL (e.g. finance vendor/purchaser rules). */
    toolbarFilterDSL?: FilterGroup;
    /** Rendered directly above the filter toolbar row. */
    aboveToolbar?: ReactNode;
    /**
     * Quick-filter inputs. Always visible above the toolbar on desktop.
     * On mobile they share the existing sliders collapsible with FilterBuilder.
     */
    quickFilterBar?: ReactNode;
    /** When set, merges `extraFilters` into request state keys and deletes them when absent (clears stale params). */
    syncExtraFiltersKeys?: readonly string[];
}

function CountryCenterView<
    ResponseType extends { data: unknown[]; total: number },
    PostType extends Record<string, unknown> = Record<string, unknown>,
    T = ResponseType['data'][number]
>({
    access,
    selfAccess = true,
    data,
    onFilterChange,
    loading,
    error,
    requestInfo,
    containersClassName,
    configurations = {
        limit: 20
    },
    renderFunctions,
    resolveLanguageKey,
    tableConfigOptions,
    tableConfigKey,
    // getItems,
    // getTotal,
    getId = (item: T) => (item as { _id?: string | number })._id ?? String(item),
    innerRef,
    onRegister,
    ref: refFromParent,
    listRef: listRefFromParent,
    extraParams,
    extraFilters,
    toolbarFilterDSL,
    aboveToolbar,
    quickFilterBar,
    syncExtraFiltersKeys,
}: CountryCenterViewProps<ResponseType, PostType, T>) {

    const {read} = useAccess(access, selfAccess ? "self" : "others");
    const accessHydrated = useAccessHydrated();
    const isMobile = useIsMobile();
    const {timezone} = useSelector((state: RootState) => state.authentication.user);

    const [firstCall, setFirstCall] = useState<boolean>(true);
    const [forceReload, setForceReload] = useState<number>(0);

    const [limit, setLimit] = useState<number>(configurations.limit ?? 20);
    // Capture once per mount — re-reading localStorage every render races the
    // preference write and made the card/table toggle need two clicks.
    const [listViewFallback] = useState(() => loadStoredListViewMode(tableConfigKey));
    const {
        viewMode,
        setViewMode,
        offset,
        setOffset,
        sorting,
        setSorting,
    } = useListUrlState({
        fallbackView: listViewFallback,
        limit,
        paramScope: tableConfigKey,
    });
    const listPageParam = listChromeParam(LIST_PAGE_PARAM, tableConfigKey);
    // const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [rowOverlays, setRowOverlays] = useState<Record<string, Partial<T>>>({});
    const [columnFilters, onColumnFiltersChange] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState | undefined>(undefined);

    const dataRef = useRef(data);
    dataRef.current = data;
    const getIdRef = useRef(getId);
    getIdRef.current = getId;

    const listApi = useMemo(() => ({
        refetch: () => setForceReload((prev) => prev + 1),
        updateRow: (id: string | number, patch: Partial<T>) => {
            const key = String(id);
            setRowOverlays((prev) => ({...prev, [key]: {...prev[key], ...patch}}));
        },
        mapRows: (mapper: (row: T) => Partial<T> | void) => {
            const items = ((dataRef.current?.data ?? []) as T[]);
            setRowOverlays((prev) => {
                const next = {...prev};
                for (const item of items) {
                    const key = String(getIdRef.current(item));
                    const current = {...item, ...prev[key]} as T;
                    const patch = mapper(current);
                    if (patch && Object.keys(patch).length > 0) {
                        next[key] = {...prev[key], ...patch};
                    }
                }
                return next;
            });
        },
    }), []);

    const [open, setOpen] = useState(false);
    const [extraParameters, setExtraParameters] = useState<Record<string, any>>({...extraParams});
    // Seed FilterBuilder DSL from `?filter=` on first render so the initial list
    // POST includes it (FilterBuilder effect alone races the fetch effect).
    const [searchParams] = useSearchParams();
    const [filters, setFilters] = useState<Record<string, any>>(() => {
        const initial: Record<string, any> = {...(extraFilters ?? {})};
        const urlFilter = decodeFilterFromUrl(searchParams.get(FILTER_URL_PARAM));
        if (urlFilter) initial.filter = urlFilter;
        return initial;
    });

    const {
        loading: loadingTableConfig,
        columnVisibility: tableColumnVisibility,
        columns: tableColumns,
        filters: tableFilters,
        error: tableConfigError,
        setColumnVisibility: saveColumnVisibility,
    } = useTableConfig(tableConfigKey);

    // console.log(tableFilters);

    const effectiveFilters = useMemo(() => {
        return (props: { filters: Record<string, unknown>; setFilters: (f: Record<string, unknown>) => void; extraParams?: Record<string, unknown> }) => (
            <FilterBuilder
                filters={props.filters}
                setFilters={props.setFilters}
                extraParams={props.extraParams}
                filterFields={tableFilters}
                listPageParam={listPageParam}
                configuration={{
                    placeholder: tableConfigOptions!.filterConfig.placeholder,
                    fields: tableConfigOptions!.filterConfig.fields,
                }}
                resolveLanguageKey={resolveLanguageKey}
            />
        );
    }, [tableFilters, tableConfigOptions, resolveLanguageKey, listPageParam]);

    useEffect(() => {
        const next = {...(extraParams ?? {})};
        setExtraParameters((prev) => {
            const prevKeys = Object.keys(prev);
            const nextKeys = Object.keys(next);
            if (
                prevKeys.length === nextKeys.length &&
                nextKeys.every((key) => Object.is(prev[key], next[key]))
            ) {
                return prev;
            }
            return next;
        });
    }, [extraParams]);

    useEffect(() => {
        saveStoredListViewMode(tableConfigKey, viewMode);
    }, [tableConfigKey, viewMode]);

    useEffect(() => {
        if (!syncExtraFiltersKeys?.length) return;
        setFilters((prev) => {
            const ef = extraFilters ?? {};
            const next = { ...prev };
            for (const k of syncExtraFiltersKeys) {
                if (Object.prototype.hasOwnProperty.call(ef, k)) {
                    const val = (ef as Record<string, unknown>)[k];
                    if (val === undefined || val === null || (typeof val === "string" && !val.trim())) {
                        delete next[k];
                    } else {
                        next[k] = val;
                    }
                } else {
                    delete next[k];
                }
            }
            return next;
        });
    }, [extraFilters, syncExtraFiltersKeys]);

    useEffect(() => {
        onRegister?.(listApi);
    }, [onRegister, listApi]);
    useEffect(() => {
        setColumnVisibility(tableColumnVisibility);
    }, [tableColumnVisibility]);
    useEffect(() => {
        if ( !loadingTableConfig && !tableConfigError ) {
            const { filter: fbFilterUnknown, ...filtersRest } = filters as Record<string, unknown> & {
                filter?: FilterGroup;
            };
            const fbFilter = fbFilterUnknown as FilterGroup | undefined;
            const merged = mergeAndFilterDSL(fbFilter, toolbarFilterDSL);
            const filterOut =
                merged && !isFilterGroupEmpty(merged) ? { filter: merged } : {};
            onFilterChange({
                offset,
                limit,
                ...(sorting.length > 0 && {
                    sortBy: sorting[0].id,
                    sortOrder: sorting[0].desc ? "desc" : "asc",
                }),
                ...extraParameters,
                ...filtersRest,
                ...filterOut,
            } as unknown as PostType);
        }
    }, [offset, limit, forceReload, sorting, filters, extraParameters, loadingTableConfig, tableConfigError, toolbarFilterDSL]);
    const effectiveRef = listRefFromParent ?? refFromParent;
    useImperativeHandle(effectiveRef, () => listApi, [listApi]);
    useImperativeHandle(innerRef, () => ({
        success: () => {
            setFirstCall(false);
            setRowOverlays({});
        },
    }));

    const tableData = useMemo(() => {
        return ((data?.data ?? []) as T[]).map((item) => {
            const key = String(getId(item));
            const overlay = rowOverlays[key] || {};
            return overlay ? { ...item, ...overlay } : item;
        })

    }, [data, rowOverlays, getId]);

    /*
     * columnConfigToColumnDef calls useSelectedLanguage (a hook). It must run
     * on every render at this call site — never inside useMemo — or React's
     * hook order breaks and the whole tree unmounts.
     */
    const dataColumns = columnConfigToColumnDef<T>(tableColumns ?? [], {
        fields: tableConfigOptions?.filterConfig?.fields,
        renderActions: renderFunctions.action,
        timezone,
        // Ungated until the map lands: the empty map before hydration would hide every column.
        read: accessHydrated === false ? undefined : read,
    }) as ColumnDef<T>[];

    const columns = useMemo<ColumnDef<T>[]>(() => {
        // ROW SELECTION — parked until a multi-selection action exists (bulk delete/export/assign).
        // const selectCol: ColumnDef<T> = {
        //     id: "select",
        //     enableSorting: false,
        //     enableHiding: false,
        //     header: ({table: t}) => (
        //         <div className="flex items-center justify-center px-2">
        //             <Checkbox
        //                 checked={t.getIsAllPageRowsSelected() || (t.getIsSomePageRowsSelected() && "indeterminate")}
        //                 onCheckedChange={(v) => t.toggleAllPageRowsSelected(!!v)}
        //                 aria-label={String(resolveLanguageKey("selectAll") || "Select all")}
        //             />
        //         </div>
        //     ),
        //     cell: ({row}) => (
        //         <div className="flex items-center justify-center px-2" onClick={(e) => e.stopPropagation()}>
        //             <Checkbox
        //                 checked={row.getIsSelected()}
        //                 onCheckedChange={(v) => row.toggleSelected(!!v)}
        //                 aria-label={String(resolveLanguageKey("selectRow") || "Select row")}
        //             />
        //         </div>
        //     ),
        //     meta: { className: "sticky left-0 z-10 w-10 bg-background" },
        // };
        // return [selectCol, ...dataColumns];
        return dataColumns;
    }, [dataColumns]);

    const table = useReactTable({
        data: tableData,
        columns,
        getRowId: (originalRow) => String(getId(originalRow as T)),
        manualPagination: true,
        manualFiltering: true,
        manualSorting: true,
        // ROW SELECTION — parked until a multi-selection action exists (bulk delete/export/assign).
        // enableRowSelection: true,
        state: {
            columnFilters,
            ...(columnVisibility && { columnVisibility }),
            sorting,
            // rowSelection,
        },
        // onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: (updater) => {
            const next = typeof updater === "function" ? updater(columnFilters) : updater;
            onColumnFiltersChange(next);
        },
        onColumnVisibilityChange: (updater) => {
            setColumnVisibility((prev) => {
                const next = typeof updater === "function" ? updater(prev ?? {}) : updater;
                saveColumnVisibility(next);
                return next;
            });
        },
        getPaginationRowModel: getPaginationRowModel(),
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues()
    });

    /*
     * These sit above the `canRead` early return below: a hook after a conditional
     * return changes the hook count between renders, and React throws the moment
     * access flips.
     *
     * `components` has to keep the same identity across renders — TableVirtuoso treats
     * each slot as a component *type*, so rebuilding the object inline in JSX handed
     * React a brand new type every render and remounted every row. The row handlers are
     * rebuilt each render, so the slots read them through a ref rather than closing over them.
     */
    const rowHandlersRef = useRef<{
        activateRow: (item: T, e?: {target: EventTarget | null}) => void;
        handleRowKeyDown: (item: T, e: KeyboardEvent<HTMLTableRowElement>) => void;
        onRowActivate?: (data: T) => void;
    } | null>(null);
    const columnCountRef = useRef(0);
    /* The virtuoso slots are memoized once, so they read the live table through a ref. */
    const tableRef = useRef<ReturnType<typeof useReactTable<T>> | null>(null);

    const virtuosoComponents = useMemo<TableComponents<Row<T>>>(
        () => ({
            /*
             * `table-fixed` + a colgroup: the columns take their widths from the config
             * instead of from whichever rows are currently rendered, which is what made
             * them jump on every scroll.
             */
            Table: ({style, children, ...props}: TableProps) => {
                const liveTable = tableRef.current;
                return (
                    <table
                        {...props}
                        style={{...style, ...(liveTable ? tableWidthStyle(liveTable) : {})}}
                        className="table-fixed caption-bottom text-sm"
                    >
                        {liveTable && <TableColGroup table={liveTable} />}
                        {children}
                    </table>
                );
            },
            /* Virtuoso measures the header through this ref to size the scroll area. */
            TableHead: ({style, children, ref}: {
                style?: CSSProperties;
                children?: ReactNode;
                ref?: Ref<HTMLTableSectionElement>;
            }) => (
                <thead ref={ref} style={style} className="bg-background/95 backdrop-blur-sm">
                    {children}
                </thead>
            ),
            /*
             * The scroll padding rows. Virtuoso's default is a `<tr>` with one `<td>` and
             * no colSpan, which in an auto-layout table is a real cell in column 1 — it
             * drags that column's width around as you scroll. Span the whole row instead.
             */
            FillerRow: ({height}: FillerRowProps) => (
                <tr aria-hidden>
                    <td colSpan={columnCountRef.current} style={{border: 0, height, padding: 0}} />
                </tr>
            ),
            TableRow: ({item: row, ...props}: ItemProps<Row<T>>) => {
                const handlers = rowHandlersRef.current;
                const canActivate = handlers?.onRowActivate;
                return (
                    <tr
                        {...props}
                        className={cn(
                            "border-b transition-colors hover:bg-muted/50 group/row",
                            ENTITY_TABLE_ROW_MENU_OPEN,
                            canActivate && "cursor-pointer",
                            !!(row.original as {deletedAt?: unknown})?.deletedAt && "opacity-60 bg-muted/50",
                        )}
                        tabIndex={canActivate ? 0 : undefined}
                        onClick={(e) => handlers?.activateRow(row.original, e)}
                        onKeyDown={(e) => handlers?.handleRowKeyDown(row.original, e as unknown as KeyboardEvent<HTMLTableRowElement>)}
                        onContextMenu={openActionMenuFromContextMenu}
                    />
                );
            },
        }),
        [],
    );

    const canRead = read === true
        || (typeof read === "object" && read !== null && Object.keys(read).length > 0);
    if (accessHydrated !== false && !canRead) {
        return <Forbidden />;
    }

    /*
     * Mosaic cards: GRID_* is CSS multi-column; wrappers stay `h-fit` +
     * `break-inside-avoid` so each card keeps its height and does not split.
     */
    const cardItemClassName = cn(
        GRID_MASONRY_ITEM,
        ENTITY_CARD_WRAPPER_BASE,
        ENTITY_CARD_MENU_OPEN,
    );

    /** Shared by real cards and their skeletons so both pack identically. */
    const renderCardContainer = (items: ReactNode[]) => (
        <div className={containersClassName?.cardViewClassName}>{items}</div>
    );

    /* Enough to cover the fold; a full page of placeholders costs more than it communicates. */
    const skeletonCount = Math.min(limit || 20, 8);
    const skeletonColumnCount = table.getVisibleFlatColumns().length || 5;
    const isRefetching = !firstCall && loading;
    // const selectedCount = Object.keys(rowSelection).length;
    const shouldVirtualize = tableData.length > 50;
    const onRowActivate = renderFunctions.onRowClick;

    const activateRow = (item: T, e?: { target: EventTarget | null }) => {
        if (!onRowActivate) return;
        if (isDialogDismissGuarded()) return;
        const el = e?.target as HTMLElement | null;
        if (el?.closest("button, a, input, [role=checkbox], [role=menuitem], [data-slot=avatar], [data-slot=dropdown-menu-trigger], [data-slot=dropdown-menu-content], [data-slot=dropdown-menu-item], [data-slot=checkbox], [data-slot=popover-trigger], [data-slot=popover-content]")) {
            return;
        }
        onRowActivate(item);
    };

    const handleRowKeyDown = (item: T, e: KeyboardEvent<HTMLTableRowElement>) => {
        if (!onRowActivate) return;
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onRowActivate(item);
        }
    };

    /* Plain assignments, not hooks: the refs themselves are created above the `canRead` return. */
    rowHandlersRef.current = {activateRow, handleRowKeyDown, onRowActivate};
    columnCountRef.current = table.getVisibleFlatColumns().length;
    tableRef.current = table;


    const renderTableRow = (row: Row<T>) => (
        <TableRow
            key={row.id}
            /* ROW SELECTION — parked until a multi-selection action exists (bulk delete/export/assign). */
            // data-state={row.getIsSelected() && "selected"}
            tabIndex={onRowActivate ? 0 : undefined}
            className={cn(
                "group/row transition-colors",
                ENTITY_TABLE_ROW_MENU_OPEN,
                onRowActivate && "cursor-pointer",
                !!(row.original as {deletedAt?: unknown})?.deletedAt && "opacity-60 bg-muted/50",
            )}
            onClick={(e) => activateRow(row.original, e)}
            onKeyDown={(e) => handleRowKeyDown(row.original, e)}
            onContextMenu={openActionMenuFromContextMenu}
        >
            {row.getVisibleCells().map((cell) => (
                <TableCell
                    key={cell.id}
                    className={cn(
                        "bg-background transition-colors group-hover/row:bg-muted/50 group-data-[state=selected]/row:bg-muted",
                        /* `table-fixed` only holds if the cell clips what will not fit. */
                        "overflow-hidden",
                        ENTITY_TABLE_CELL_MENU_OPEN,
                        cell.column.id === "actions" && "w-[1%] text-right pr-3 sticky right-0 z-10",
                        // cell.column.id === "select" && "sticky left-0 z-10",
                        (cell.column.columnDef.meta as { className?: string } | undefined)?.className
                    )}
                    onClick={cell.column.id === "actions" ? (e) => e.stopPropagation() : undefined}
                    onPointerDown={cell.column.id === "actions" ? (e) => e.stopPropagation() : undefined}
                >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
            ))}
        </TableRow>
    );


    return (
        <>
            {aboveToolbar}
            {!isMobile && quickFilterBar}

            <div className="flex items-center justify-between gap-1">
                <div className="flex grow">
                    {
                        !firstCall &&
                        <>
                            {
                                isMobile ?
                                <TooltipDisplayer tooltip={resolveLanguageKey(open ? "hideFilters" : "showFilters")}>
                                    <Button
                                        variant={open ? "secondary" : "ghost"}
                                        size="icon"
                                        onClick={() => {setOpen(!open)}}
                                        className={cn("border")}
                                    >
                                        <SlidersVertical />
                                    </Button>
                                </TooltipDisplayer>
                                :
                                <>
                                    {effectiveFilters({ filters, setFilters, extraParams })}
                                </>
                            }
                        </>
                    }
                </div>
                <div className="flex items-center gap-2">
                    <PageController
                        total={data?.total ?? 0}
                        limit={configurations.limit}
                        loading={loading}
                        setLimit={setLimit}
                        setOffset={setOffset}
                    />
                    {
                        read &&
                        <div className="flex items-center gap-2">
                            <ToggleGroup
                                type="single"
                                spacing={0}
                                variant="outline"
                                value={viewMode}
                                // Radix clears the value when the active item is pressed again;
                                // ignore that so the list always has a view mode.
                                onValueChange={(next) => {
                                    if (next === "table" || next === "card") setViewMode(next);
                                }}
                                aria-label={resolveLanguageKey("showTableView")}
                            >
                                <TooltipDisplayer tooltip={resolveLanguageKey("showTableView")}>
                                    <ToggleGroupItem value="table" aria-label={resolveLanguageKey("showTableView")}>
                                        <List />
                                    </ToggleGroupItem>
                                </TooltipDisplayer>
                                <TooltipDisplayer tooltip={resolveLanguageKey("showCardView")}>
                                    <ToggleGroupItem value="card" aria-label={resolveLanguageKey("showCardView")}>
                                        <LayoutGrid />
                                    </ToggleGroupItem>
                                </TooltipDisplayer>
                            </ToggleGroup>
                            {
                                viewMode === "table" &&
                                <DataTableViewOptions table={table} />
                            }
                        </div>
                    }
                </div>
            </div>

            {
                isMobile && open &&
                <Collapsible open={open} onOpenChange={setOpen}>
                    <CollapsibleContent className="flex flex-col gap-2 pt-1">
                        {quickFilterBar}
                        {effectiveFilters({ filters, setFilters, extraParams })}
                    </CollapsibleContent>
                </Collapsible>
            }

            <div className={cn("min-w-0 flex-1 min-h-0 flex flex-col overflow-x-hidden", containersClassName?.scrollRootClassName)}>

                {
                    /*
                     * Background refetch: a sliver pinned to the top of the scrollport.
                     * `sticky` rather than `absolute` because this container scrolls —
                     * the previous absolutely-positioned bar had no positioned ancestor
                     * here and resolved against the page instead.
                     */
                    isRefetching &&
                    <div
                        role="status"
                        aria-live="polite"
                        aria-label={String(resolveLanguageKey("loading"))}
                        className="sticky top-0 z-20 -mb-0.5 h-0.5 w-full shrink-0 overflow-hidden bg-primary/15"
                    >
                        <div className="h-full w-1/3 bg-primary animate-indeterminate" />
                    </div>
                }

                <div
                    className={cn(
                        "min-w-0 min-h-0 flex flex-col flex-1 overflow-x-hidden ps-0.5 transition-opacity duration-200",
                        isRefetching && "opacity-60",
                    )}
                >
                    <>
                        {
                            (error || tableConfigError) ?
                            <>
                                {
                                    !!error ?
                                        <SimpleError
                                            title={String(requestInfo?.fail?.failTitle ?? resolveLanguageKey("failTitle"))}
                                            description={String(requestInfo?.fail?.failDescription ?? resolveLanguageKey("failDescription"))}
                                            tooltipDescription={String(requestInfo?.fail?.tooltipDescription ?? resolveLanguageKey("tooltipDescription"))}
                                            error={error}
                                            onClick={() => {setForceReload((prev) => prev + 1)}}
                                        />
                                        :
                                        <SimpleError
                                            title={resolveLanguageKey("failTableConfigTitle")}
                                            description={resolveLanguageKey("failTableConfigDescription")}
                                        />
                                }
                            </>
                            :
                            <>
                                {
                                    (loadingTableConfig) || (firstCall && loading) || accessHydrated === false ?
                                        (
                                            viewMode === "card"
                                                ? renderCardContainer(entityCardSkeletonItems(skeletonCount, cardItemClassName))
                                                : <EntityTableSkeleton rows={skeletonCount} columns={skeletonColumnCount} />
                                        )
                                        :
                                        <>
                                            {/* ROW SELECTION — parked until a multi-selection action exists (bulk delete/export/assign).
                                            {selectedCount > 0 && (
                                                <div className="mb-2 flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                                                    <span className="tabular-nums text-muted-foreground">
                                                        {selectedCount} {String(resolveLanguageKey("selected") || "selected")}
                                                    </span>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => setRowSelection({})}>
                                                        {String(resolveLanguageKey("clearSelection") || "Clear")}
                                                    </Button>
                                                </div>
                                            )} */}
                                            {
                                                viewMode === "card" ? (
                                                    (!data || data?.data?.length === 0) && !firstCall ? (
                                                        <NoData title={requestInfo?.noData ?? resolveLanguageKey("noData")}/>
                                                    ) : (
                                                        renderCardContainer(tableData.map((item) => (
                                                            <div
                                                                key={String(getId(item))}
                                                                className={cardItemClassName}
                                                                onContextMenu={openActionMenuFromContextMenu}
                                                            >
                                                                {renderFunctions.cardRender(item)}
                                                            </div>
                                                        )))
                                                    )
                                                ) : (
                                                    <>
                                                        {shouldVirtualize && data?.data?.length ? (
                                                            /*
                                                             * Virtuoso owns its scrollport (its scroller is `height:100%;
                                                             * overflow-y:auto`), so this box has to give it a definite height:
                                                             * `flex-1` fills what the list container leaves, where a hardcoded
                                                             * `height: 480` used to strand long lists half way down the panel.
                                                             * The `min-h` floor keeps it usable if an embedding gives the
                                                             * container no definite height of its own.
                                                             */
                                                            <div className="min-w-0 w-full flex-1 min-h-[24rem] overflow-hidden rounded-md border">
                                                                <TableVirtuoso
                                                                    style={{height: "100%"}}
                                                                    data={table.getRowModel().rows}
                                                                    computeItemKey={(_index, row) => row.id}
                                                                    /* Rows only — virtuoso supplies the `<thead>` around them. */
                                                                    fixedHeaderContent={() => (
                                                                        <DataTableHeaderRows table={table} />
                                                                    )}
                                                                    itemContent={(_index, row) => (
                                                                        <>
                                                                            {row.getVisibleCells().map((cell) => (
                                                                                <TableCell
                                                                                    key={cell.id}
                                                                                    className={cn(
                                                                                        "bg-background transition-colors overflow-hidden",
                                                                                        ENTITY_TABLE_CELL_MENU_OPEN,
                                                                                        cell.column.id === "actions" && "w-[1%] text-right pr-3 sticky right-0 z-10",
                                                                                        // cell.column.id === "select" && "sticky left-0 z-10",
                                                                                        (cell.column.columnDef.meta as { className?: string } | undefined)?.className
                                                                                    )}
                                                                                    onClick={cell.column.id === "actions" ? (e) => e.stopPropagation() : undefined}
                                                                                    onPointerDown={cell.column.id === "actions" ? (e) => e.stopPropagation() : undefined}
                                                                                >
                                                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                                                </TableCell>
                                                                            ))}
                                                                        </>
                                                                    )}
                                                                    components={virtuosoComponents}
                                                                />
                                                            </div>
                                                        ) : (
                                                        <div className="min-w-0 w-full overflow-x-auto rounded-md border">
                                                        <Table className="table-fixed" style={tableWidthStyle(table)}>
                                                            <TableColGroup table={table} />
                                                            <DataTableTableHeaderProps table={table} />
                                                            <TableBody>
                                                                {(!data || data?.data?.length === 0) && !firstCall ? (
                                                                    <TableRow>
                                                                        <TableCell
                                                                            colSpan={Math.max(table.getVisibleFlatColumns().length, 1)}
                                                                            className="h-48"
                                                                        >
                                                                            <NoData title={requestInfo?.noData ?? resolveLanguageKey("noData")}/>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ) : (
                                                                    table.getRowModel().rows.map((row) => renderTableRow(row))
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                        </div>
                                                        )}
                                                    </>
                                                )
                                            }
                                        </>
                                }
                            </>
                        }
                    </>
                </div>

            </div>

        </>
    )
}

const ComposedCardAndTableView = compose(
    withLanguage("src/modules/core/components/custom/cardAndTableView.tsx"),
    withAxios(
        {
            url: "pass-url-as-prop",
            method: "POST",
            data: {},
        },
        true
    ),
    withDebug(false, false)
)(CountryCenterView);

/** Consumer-facing props (HOC-injected props omitted). */
type CardAndTableViewConsumerProps<
    ResponseType extends { data: unknown[]; total: number },
    PostType extends Record<string, unknown> = Record<string, unknown>,
    T = ResponseType["data"][number]
> = Omit<
    CountryCenterViewProps<ResponseType, PostType, T>,
    keyof WithAxiosType<ResponseType, PostType> | keyof WithLanguageType | "configurations"
> & {
    configurations?: { limit?: number, columnVisibility?: VisibilityState };
};

function CardAndTableView<
    ResponseType extends { data: unknown[]; total: number },
    PostType extends Record<string, unknown> = Record<string, unknown>,
    T = ResponseType["data"][number]
>(props: CardAndTableViewConsumerProps<ResponseType, PostType, T>) {
    return <ComposedCardAndTableView {...(props as Record<string, unknown>)} />;
}

export default CardAndTableView;