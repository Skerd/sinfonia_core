import {compose} from "redux";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {LayoutGrid, List, SlidersVertical} from "lucide-react";
import {JSX, type ReactNode, Ref, useEffect, useImperativeHandle, useMemo, useState} from "react";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type { FilterGroup } from "armonia/src/modules/core/database/filter";
import { isFilterGroupEmpty, mergeAndFilterDSL } from "@coreModule/helpers/filter/mergeFilterDsl.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import PageController from "@coreModule/components/custom/paginator";
import NoData from "@coreModule/components/custom/noData.tsx";
import {ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable} from "@tanstack/react-table";
import {Table, TableBody, TableCell, TableRow} from "@coreModule/components/ui/table/table.tsx";
import DataTableTableHeaderProps from "@coreModule/components/ui/table/table-header.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import DataTableViewOptions from "@coreModule/components/ui/table/view-options.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {Collapsible, CollapsibleContent} from "@coreModule/components/ui/collapsible.tsx";
import {useIsMobile} from "@coreModule/helpers/hooks/useMobile.tsx";
import {useTableConfig} from "@coreModule/helpers/hooks/useTableConfig.ts";
import {useTableConfigContext} from "@coreModule/helpers/context/tableConfigContext.tsx";
import {columnConfigToColumnDef} from "@coreModule/helpers/mappers/columnConfigToColumnDef.tsx";
import FilterBuilder from "@coreModule/components/custom/filterBuilder/filterBuilder.tsx";
import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {openActionMenuFromContextMenu} from "@coreModule/components/custom/actions/menu/openActionMenuFromContextMenu.ts";

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

type EntityListViewMode = "card" | "table";

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
    },
    getItems?: (response: ResponseType) => T[];
    getTotal?: (response: ResponseType) => number;
    getId?: (item: T) => string | number;
    onRegister?: (api: { refetch: () => void; updateRow: (id: string | number, patch: Partial<T>) => void }) => void;
    ref?: Ref<{ refetch: () => void; updateRow: (id: string | number, patch: Partial<T>) => void } | null>;
    listRef?: Ref<{ refetch: () => void; updateRow: (id: string | number, patch: Partial<T>) => void } | null>;
    extraParams?: Record<string, unknown>;
    extraFilters?: Record<string, unknown>;
    /** AND-merged ahead of Filter Builder DSL (e.g. finance vendor/purchaser rules). */
    toolbarFilterDSL?: FilterGroup;
    /** Rendered directly above the filter toolbar row. */
    aboveToolbar?: ReactNode;
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
    viewPortRef,
    onRegister,
    ref: refFromParent,
    listRef: listRefFromParent,
    extraParams,
    extraFilters,
    toolbarFilterDSL,
    aboveToolbar,
    syncExtraFiltersKeys,
}: CountryCenterViewProps<ResponseType, PostType, T>) {

    const {read} = useAccess(access, selfAccess ? "self" : "others");
    const isMobile = useIsMobile();
    const {timezone} = useSelector((state: RootState) => state.authentication.user);

    const [viewMode, setViewMode] = useState<EntityListViewMode>(() =>
        loadStoredListViewMode(tableConfigKey),
    );
    const [firstCall, setFirstCall] = useState<boolean>(true);
    const [forceReload, setForceReload] = useState<number>(0);

    const [offset, setOffset] = useState<number>(0);
    const [limit, setLimit] = useState<number>(configurations.limit ?? 20);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowOverlays, setRowOverlays] = useState<Record<string, Partial<T>>>({});
    const [columnFilters, onColumnFiltersChange] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState | undefined>(undefined);

    const [open, setOpen] = useState(false);
    const [extraParameters, setExtraParameters] = useState<Record<string, any>>({...extraParams});
    const [filters, setFilters] = useState<Record<string, any>>({...extraFilters});

    const {
        loading: loadingTableConfig,
        columnVisibility: tableColumnVisibility,
        columns: tableColumns,
        filters: tableFilters,
        error: tableConfigError
    } = useTableConfig(tableConfigKey);

    const tableConfigContext = useTableConfigContext();

    // console.log(tableFilters);

    const effectiveFilters = useMemo(() => {
        return (props: { filters: Record<string, unknown>; setFilters: (f: Record<string, unknown>) => void; extraParams?: Record<string, unknown> }) => (
            <FilterBuilder
                filters={props.filters}
                setFilters={props.setFilters}
                extraParams={props.extraParams}
                filterFields={tableFilters}
                configuration={{
                    placeholder: tableConfigOptions!.filterConfig.placeholder,
                    fields: tableConfigOptions!.filterConfig.fields,
                }}
                resolveLanguageKey={resolveLanguageKey}
            />
        );
    }, [tableFilters, tableConfigOptions, resolveLanguageKey]);

    useEffect(() => {
        setExtraParameters({...extraParams})
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
        onRegister?.({
            refetch: () => setForceReload((prev) => prev + 1),
            updateRow: (id: string | number, patch: Partial<T>) => {
                const key = String(id);
                setRowOverlays((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
            },
        });
    }, [onRegister]);
    useEffect(() => {
        setColumnVisibility(tableColumnVisibility);
    }, [tableColumnVisibility]);
    useEffect(() => {
        if ( !loadingTableConfig ) {
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
    }, [offset, limit, forceReload, sorting, filters, extraParameters, loadingTableConfig, toolbarFilterDSL]);
    const effectiveRef = listRefFromParent ?? refFromParent;
    useImperativeHandle(effectiveRef, () => ({
        refetch: () => setForceReload((prev) => prev + 1),
        updateRow: (id: string | number, patch: Partial<T>) => {
            const key = String(id);
            setRowOverlays((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
        }
    }), []);
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

    const table = useReactTable({
        data: tableData,
        columns: columnConfigToColumnDef<T>(tableColumns, {fields: tableConfigOptions?.filterConfig?.fields, renderActions: renderFunctions.action, timezone}) as ColumnDef<T>[],
        getRowId: (originalRow) => String(getId(originalRow as T)),
        manualPagination: true,
        manualFiltering: true,
        manualSorting: true,
        state: {
            columnFilters,
            ...(columnVisibility && { columnVisibility }),
            sorting,
        },
        onSortingChange: (updater) => {
            const next = typeof updater === "function" ? updater(sorting) : updater;
            setSorting(next);
        },
        onColumnFiltersChange: (updater) => {
            const next = typeof updater === "function" ? updater(columnFilters) : updater;
            onColumnFiltersChange(next);
        },
        onColumnVisibilityChange: (updater) => {
            setColumnVisibility((prev) => {
                const next = typeof updater === "function" ? updater(prev ?? {}) : updater;
                if (tableConfigKey) tableConfigContext?.updateColumnVisibility(tableConfigKey, next);
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

    if( !read || !Object.keys(read).length ){
        return <HiddenElement />
    }

    return (
        <>
            {aboveToolbar}

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
                <div className="flex items-center space-x-2">
                    <PageController
                        total={data?.total ?? 0}
                        limit={configurations.limit}
                        loading={loading}
                        setLimit={setLimit}
                        setOffset={setOffset}
                    />
                    {
                        read &&
                        <div className="flex items-center space-x-2">
                            <div className="flex rounded-md border border-border">
                                <TooltipDisplayer tooltip={resolveLanguageKey("showTableView")}>
                                    <Button
                                        variant={viewMode === "table" ? "secondary" : "ghost"}
                                        size="icon"
                                        onClick={() => setViewMode("table")}
                                        className="rounded-r-none"
                                    >
                                        <List />
                                    </Button>
                                </TooltipDisplayer>
                                <TooltipDisplayer tooltip={resolveLanguageKey("showCardView")}>
                                    <Button
                                        variant={viewMode === "card" ? "secondary" : "ghost"}
                                        size="icon"
                                        onClick={() => setViewMode("card")}
                                        className="rounded-l-none"
                                    >
                                        <LayoutGrid/>
                                    </Button>
                                </TooltipDisplayer>
                            </div>
                            {
                                viewMode === "table" &&
                                <DataTableViewOptions table={table} />
                            }
                        </div>
                    }
                </div>
            </div>

            {
                isMobile && !!effectiveFilters && open &&
                <Collapsible open={open} onOpenChange={setOpen}>
                    <CollapsibleContent>
                        {effectiveFilters({ filters, setFilters, extraParams })}
                    </CollapsibleContent>
                </Collapsible>
            }

            <div ref={viewPortRef} className={cn("min-w-0 flex-1 min-h-0 flex flex-col overflow-x-hidden", containersClassName?.scrollRootClassName)}>

                <div className="min-w-0 min-h-0 flex flex-col flex-1 overflow-x-hidden ps-0.5">
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
                                            tooltipDescription={resolveLanguageKey("tooltipTableConfigDescription")}
                                            error={error}
                                            onClick={() => setForceReload((prev) => prev + 1)}
                                        />
                                }
                            </>
                            :
                            <>
                                {
                                    (!data || data?.data?.length === 0) && !firstCall ?
                                        <NoData title={requestInfo?.noData ?? resolveLanguageKey("noData")}/>
                                        :
                                        <>
                                            {
                                                (loadingTableConfig) || (firstCall && loading) ?
                                                    <Loader />
                                                    :
                                                    <>
                                                        {
                                                            viewMode === "card" ?
                                                                <div className={containersClassName?.cardViewClassName}>
                                                                    {
                                                                        tableData.map((item) => {
                                                                            return (
                                                                                <div
                                                                                    key={String(getId(item))}
                                                                                    className={cn(
                                                                                        "h-full min-h-0",
                                                                                        ENTITY_CARD_WRAPPER_BASE,
                                                                                        ENTITY_CARD_MENU_OPEN,
                                                                                    )}
                                                                                    onContextMenu={openActionMenuFromContextMenu}
                                                                                >
                                                                                    {renderFunctions.cardRender(item)}
                                                                                </div>
                                                                            )
                                                                        })
                                                                    }
                                                                </div>
                                                                :
                                                                <>
                                                                    <div className="min-w-0 w-full overflow-x-auto rounded-md border">
                                                                        <Table>
                                                                            <DataTableTableHeaderProps table={table} />
                                                                            <TableBody>
                                                                                {
                                                                                    table?.getRowModel()?.rows?.map((row) => {
                                                                                        return (
                                                                                            <TableRow
                                                                                                key={row.id}
                                                                                                data-state={row.getIsSelected() && "selected"}
                                                                                                className={cn(
                                                                                                    "group/row transition-colors",
                                                                                                    ENTITY_TABLE_ROW_MENU_OPEN,
                                                                                                    (row.original as any)?.deletedAt && "opacity-60 bg-muted/50"
                                                                                                )}
                                                                                                onContextMenu={openActionMenuFromContextMenu}
                                                                                            >
                                                                                                {
                                                                                                    row.getVisibleCells().map((cell) => {
                                                                                                        return (
                                                                                                            <TableCell
                                                                                                                key={cell.id}
                                                                                                                className={cn(
                                                                                                                    "bg-background transition-colors group-hover/row:bg-muted/50 group-data-[state=selected]/row:bg-muted",
                                                                                                                    ENTITY_TABLE_CELL_MENU_OPEN,
                                                                                                                    cell.column.id === "actions" && "w-[1%] text-right pr-3",
                                                                                                                    (cell.column.columnDef.meta as { className?: string } | undefined)?.className
                                                                                                                )}
                                                                                                            >
                                                                                                                {/*{Date.now()}*/}
                                                                                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                                                                            </TableCell>
                                                                                                        )
                                                                                                    })
                                                                                                }
                                                                                            </TableRow>
                                                                                        )
                                                                                    })
                                                                                }
                                                                            </TableBody>
                                                                        </Table>
                                                                    </div>
                                                                </>
                                                        }
                                                    </>
                                            }
                                        </>
                                }
                            </>
                        }
                    </>
                </div>

                {
                    !firstCall && (loading) &&
                    <div className="absolute flex items-center justify-center w-full bottom-0 left-0">
                        <div className="min-w-[10%] bg-secondary animate-bounce">
                            <Loader title={resolveLanguageKey("loading")}/>
                        </div>
                    </div>
                }
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
    withDebug(true, true)
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