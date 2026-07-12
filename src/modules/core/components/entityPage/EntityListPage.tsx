import {JSX, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject} from "react";
import {useNavigate} from "react-router-dom";
import {useAccess, type AccessObject} from "@coreModule/helpers/hocs/withAccess.tsx";
import Header from "@coreModule/components/custom/header.tsx";
import {Button, ButtonTitle} from "@coreModule/components/ui/button.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import CardAndTableView from "@coreModule/components/custom/cardAndTableView.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import {useDynamicLanguage} from "@coreModule/components/entityPage/useDynamicLanguage.ts";
import type {DeletedData, TableResponse} from "armonia/src/modules/core/types/shared.types.ts";
import type {FilterGroup, FilterValue} from "armonia/src/modules/core/database/filter";
import {generateUUID} from "@coreModule/helpers/general";
import {mergeAndFilterDSL} from "@coreModule/helpers/filter/mergeFilterDsl.ts";
import QuickFilterBar, {buildQuickFilterDSL, type QuickFilterDef} from "@coreModule/components/entityPage/quickFilterBar.tsx";

export type {QuickFilterDef};

type BaseEntity = {
    _id: string;
    name?: unknown;
};

// ---------------------------------------------------------------------------
// Auto sheet — rendered inside EntityListPage when no renderSheet override is given
// ---------------------------------------------------------------------------

/** List mutation ref forwarded to cards/sheets (`updateRow`, `refetch`). */
export type EntityListRefs<T extends BaseEntity = BaseEntity> = RefObject<{
    refetch: () => void;
    updateRow: (id: string | number, patch: Partial<T>) => void;
} | null>;

type AutoSheetViewProps = {
    entity: BaseEntity & Record<string, unknown>;
    sheetLanguagePath: string;
    collectionName: string;
    apiUrl: string;
    open: boolean;
    onOpenChange: () => void;
    onDelete: (response?: DeletedData) => void;
    onRestore: () => void;
    access: AccessObject;
    buildEditPath: (entity: any) => string;
    renderSheetActionMenuChildren?: (entity: any) => ReactNode;
    hideEdit?: boolean;
    onSheetRowPatched?: (row: Record<string, unknown>) => void;
    deleteRestoreConfirmLabel?: string;
};

function AutoSheetView({
    entity,
    sheetLanguagePath,
    collectionName,
    apiUrl,
    open,
    onOpenChange,
    onDelete,
    onRestore,
    access,
    buildEditPath,
    renderSheetActionMenuChildren,
    hideEdit,
    onSheetRowPatched,
    deleteRestoreConfirmLabel,
}: AutoSheetViewProps) {
    const {resolveLanguageKey} = useDynamicLanguage(sheetLanguagePath);
    const viewConfig = useViewConfig(collectionName, "sheet");
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(entity);

    useEffect(() => {
        setSheetData(entity);
    }, [entity]);

    if (!viewConfig) return null;

    return (
        <SheetViewRenderer
            config={viewConfig}
            data={sheetData}
            url={`${apiUrl}/single`}
            fetchId={entity._id}
            onDataFetched={(data) => setSheetData(data)}
            open={open}
            onOpenChange={(o) => { if (!o) onOpenChange(); }}
            resolveLanguageKey={resolveLanguageKey}
            access={access}
            onDelete={onDelete}
            onRestore={onRestore}
            editPath={buildEditPath(entity)}
            hideEdit={hideEdit}
            actionMenuChildren={renderSheetActionMenuChildren?.(entity)}
            onSheetRowPatched={onSheetRowPatched}
            deleteRestoreConfirmLabel={deleteRestoreConfirmLabel}
        />
    );
}

// ---------------------------------------------------------------------------
// EntityListPage
// ---------------------------------------------------------------------------

export type EntityListPageProps<T extends BaseEntity> = {
    apiUrl: string;
    collectionName: string;
    accessModel: string;
    tableConfigKey: string;
    /** When omitted or with `hideCreate`, the header create button is not shown. */
    createPath?: string;
    /** Force-hide create affordance even when `createPath` is set. */
    hideCreate?: boolean;
    buildEditPath: (entity: T) => string;
    resolveLanguageKey: (key: string) => unknown;
    /** Overrides `resolveLanguageKey("title")` for the page header (e.g. breadcrumb title). */
    headerTitle?: string;
    /** Overrides `resolveLanguageKey("description")` for the page header. */
    headerDescription?: string;
    /** Hide page header chrome (e.g. embedded dashboard / overview tabs). */
    hideHeader?: boolean;
    /** Custom delete/restore confirm label (default uses `read.name` + `entity.name`). */
    buildDeleteConfirmLabel?: (entity: T, read: Record<string, unknown> | undefined) => string | undefined;
    /** Required for card view; when omitted, the list stays in table mode. */
    renderCard?: (
        entity: T,
        onDelete: (row?: T, response?: DeletedData) => void,
        onRestore: (row?: T) => void,
        listRef: EntityListRefs<T>,
    ) => ReactNode;
    /** Language path for the auto-rendered sheet view (required when renderSheet is omitted). */
    sheetLanguagePath?: string;
    /** Override auto-sheet with a custom sheet component. */
    renderSheet?: (props: {
        entity: T;
        open: boolean;
        onOpenChange: () => void;
        onDelete: (response?: DeletedData) => void;
        onRestore: () => void;
        listRef: EntityListRefs<T>;
    }) => ReactNode;
    /** Extra items in the TABLE row action menu. */
    renderActionMenuChildren?: (
        entity: T,
        bindRowAction: (actionName: string) => void,
        listHelpers: {replaceRow: (row: T) => void},
    ) => ReactNode;
    /** Extra items in the SHEET action menu (defaults to renderActionMenuChildren). */
    renderSheetActionMenuChildren?: (
        entity: T,
        bindRowAction: (actionName: string) => void,
        listHelpers: {replaceRow: (row: T) => void},
    ) => ReactNode;
    createIcon?: ReactNode;
    /** Key passed to resolveLanguageKey for the create button label (default `"create"`). */
    createLanguageKey?: string;
    /** Extra controls rendered in the page header beside the create button. */
    headerActions?: ReactNode;
    cardViewClassName?: string;
    /** Pinterest-style packing for card view (default `grid`). */
    cardLayout?: "grid" | "masonry";
    /** Column breakpoints when `cardLayout="masonry"`. */
    masonryBreakpointCols?: number | {default: number; [key: number]: number};
    configurations?: {limit?: number; columnVisibility?: Record<string, boolean>};
    /** Forwarded to the list POST (e.g. parent filter `{ country }`). */
    extraParams?: Record<string, unknown>;
    /**
     * Context filters applied as DSL `equals` rules against the table field registry.
     * Keys must match Mongoose field names (e.g. `project`, not `projectId`).
     * Undefined/null values are ignored. Requires the field to be in the table config
     * and declared with `read` permission; handled by `dslFilterMW` on the backend.
     */
    extraFilters?: Record<string, unknown>;
    /** Rendered directly above the list filter toolbar (inside CardAndTableView). */
    aboveToolbar?: ReactNode;
    /** Modals/overlays keyed off non-standard ActionMenu triggers (anything other than view/delete/restore). */
    renderFloatingModals?: (args: {
        action: string;
        entity: T;
        resetAction: () => void;
        listRef: EntityListRefs<T>;
    }) => ReactNode;
    /** Row ActionMenu & sheet ActionMenu tweaks (defaults match standard CRUD). */
    rowActionMenu?: {
        hideDelete?: boolean;
        hideRestore?: boolean;
        allowMenuForCustomChildren?: boolean;
        /** Per-row when a function (e.g. hide edit for paid reservations). */
        hideEdit?: boolean | ((entity: T) => boolean);
    };
    /**
     * Always-visible filter inputs rendered above the FilterBuilder row.
     * Each def becomes a labeled input; their values AND-combine with the main DSL filter and with `extraFilters`.
     */
    quickFilters?: QuickFilterDef[];
};

export default function EntityListPage<T extends BaseEntity>({
    apiUrl,
    collectionName,
    accessModel,
    tableConfigKey,
    createPath,
    hideCreate,
    buildEditPath,
    resolveLanguageKey,
    headerTitle,
    headerDescription,
    hideHeader,
    buildDeleteConfirmLabel,
    renderCard,
    sheetLanguagePath,
    renderSheet,
    renderActionMenuChildren,
    renderSheetActionMenuChildren,
    createIcon,
    createLanguageKey = "create",
    headerActions,
    cardViewClassName = "grid grid-cols-1 gap-2 lg:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 pe-1",
    cardLayout = "grid",
    masonryBreakpointCols,
    configurations,
    extraParams,
    extraFilters,
    aboveToolbar,
    renderFloatingModals,
    rowActionMenu,
    quickFilters,
}: EntityListPageProps<T>) {
    const navigate = useNavigate();
    const access = useAccess(accessModel);
    const {create, read} = access;
    const readFields = (read && typeof read === "object" ? read : undefined) as Record<string, unknown> | undefined;

    const extraFiltersDSL = useMemo<FilterGroup | undefined>(() => {
        if (!extraFilters) return undefined;
        const rules = Object.entries(extraFilters)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([field, value]) => ({
                id: generateUUID(),
                field,
                operator: "equals" as const,
                value: value as FilterValue,
            }));
        if (rules.length === 0) return undefined;
        return {id: generateUUID(), operator: "and" as const, rules, groups: []};
    }, [extraFilters]);

    const [quickFilterValues, setQuickFilterValues] = useState<Record<string, FilterValue | null>>({});

    const quickFilterDSL = useMemo(
        () => buildQuickFilterDSL(quickFilters ?? [], quickFilterValues),
        [quickFilters, quickFilterValues],
    );

    const combinedToolbarDSL = useMemo(
        () => mergeAndFilterDSL(extraFiltersDSL, quickFilterDSL),
        [extraFiltersDSL, quickFilterDSL],
    );

    const [sheetEntity, setSheetEntity] = useState<T | null>(null);
    const [action, setAction] = useState("");

    const listRef = useRef<{
        refetch: () => void;
        updateRow: (id: string | number, patch: Partial<T>) => void;
    } | null>(null);

    const handleDelete = (entity: T, response?: DeletedData) => {
        if (response?.deletedAt != null || response?.deletedBy != null) {
            listRef.current?.updateRow?.(entity._id, {
                deletedAt: response.deletedAt,
                deletedBy: response.deletedBy,
            } as unknown as Partial<T>);
            if (sheetEntity?._id === entity._id) {
                setSheetEntity({...sheetEntity, deletedAt: response.deletedAt, deletedBy: response.deletedBy} as T);
            }
            return;
        }
        listRef.current?.refetch?.();
    };

    const handleRestore = (entity: T) => {
        listRef.current?.updateRow?.(entity._id, {deletedAt: undefined, deletedBy: undefined} as unknown as Partial<T>);
        if (sheetEntity?._id === entity._id) {
            setSheetEntity({...sheetEntity, deletedAt: undefined, deletedBy: undefined} as T);
        }
    };

    const sheetActionMenuChildren = renderSheetActionMenuChildren ?? renderActionMenuChildren;
    const bindRowActionMenu = (entity: T, actionName: string) => {
        setAction(actionName);
        setSheetEntity(entity);
    };

    const resolveDeleteLabel = (entity: T) =>
        buildDeleteConfirmLabel?.(entity, readFields) ??
        (readFields?.name && entity.name ? String(entity.name) : undefined);

    const resolveHideEdit = (entity: T) =>
        typeof rowActionMenu?.hideEdit === "function" ? rowActionMenu.hideEdit(entity) : !!rowActionMenu?.hideEdit;

    const replaceRow = (row: T) => {
        listRef.current?.updateRow?.(row._id, row as unknown as Partial<T>);
        if (sheetEntity?._id === row._id) {
            setSheetEntity(row);
        }
    };

    const listHelpers = {replaceRow};

    return (
        <div className="min-w-0 flex-full gap-4">

            {!hideHeader && (
            <Header
                title={(headerTitle ?? resolveLanguageKey("title")) as string}
                description={(headerDescription ?? resolveLanguageKey("description")) as string}
            >
                <div className="flex items-center space-x-2">
                    <HiddenElement hideAll={true}>
                        {headerActions}
                        {
                            !hideCreate && create && createPath &&
                            <Button type="button" onClick={(e) => {navigate(createPath); e.stopPropagation(); e.preventDefault();}}>
                                {createIcon}
                                <ButtonTitle>{resolveLanguageKey(createLanguageKey) as string}</ButtonTitle>
                            </Button>
                        }
                    </HiddenElement>
                </div>
            </Header>
            )}

            <HiddenElement hideAll={true}>
                {
                    read &&
                    <CardAndTableView<TableResponse<T>, Record<string, unknown>>
                        url={apiUrl}
                        tableConfigKey={tableConfigKey}
                        access={accessModel}
                        extraParams={extraParams}
                        toolbarFilterDSL={combinedToolbarDSL}
                        aboveToolbar={
                            quickFilters?.length ? (
                                <>
                                    {aboveToolbar}
                                    <QuickFilterBar
                                        defs={quickFilters}
                                        values={quickFilterValues}
                                        onChange={(field: string, value: FilterValue | null) =>
                                            setQuickFilterValues((prev) => ({...prev, [field]: value}))
                                        }
                                        onClearAll={() => setQuickFilterValues({})}
                                        extraParams={extraParams}
                                    />
                                </>
                            ) : aboveToolbar
                        }
                        tableConfigOptions={{
                            filterConfig: {
                                placeholder: resolveLanguageKey("searchPlaceholder") as string,
                                fields: resolveLanguageKey("fields"),
                            },
                        }}
                        configurations={{limit: 20, ...configurations}}
                        cardLayout={cardLayout}
                        masonryBreakpointCols={masonryBreakpointCols}
                        containersClassName={{
                            cardViewClassName,
                            scrollRootClassName: "flex-full",
                        }}
                        listRef={listRef}
                        renderFunctions={{
                            cardRender: (entity) =>
                                typeof renderCard === "function"
                                    ? (renderCard(
                                        entity,
                                        (row, response) => handleDelete(row ?? entity, response),
                                        (row) => handleRestore(row ?? entity),
                                        listRef as EntityListRefs<T>,
                                    ) as JSX.Element)
                                    : (<></> as unknown as JSX.Element),
                            action: (entity) => (
                                <ActionMenu
                                    accessModel={accessModel}
                                    deletedData={entity}
                                    onAction={(a: string) => {
                                        setAction(a);
                                        setSheetEntity(entity);
                                    }}
                                    editPath={buildEditPath(entity)}
                                    hideEdit={resolveHideEdit(entity)}
                                    hideDelete={rowActionMenu?.hideDelete}
                                    hideRestore={rowActionMenu?.hideRestore}
                                    allowMenuForCustomChildren={rowActionMenu?.allowMenuForCustomChildren}
                                >
                                    {renderActionMenuChildren?.(
                                        entity,
                                        (a) => bindRowActionMenu(entity, a),
                                        listHelpers,
                                    )}
                                </ActionMenu>
                            ),
                        }}
                    />
                }
            </HiddenElement>

            {
                !!action && !!sheetEntity &&
                <>
                    {action === "view" && (
                        renderSheet
                            ? renderSheet({
                                entity: sheetEntity,
                                open: true,
                                onOpenChange: () => { setAction(""); setSheetEntity(null); },
                                onDelete: (data) => handleDelete(sheetEntity, data),
                                onRestore: () => handleRestore(sheetEntity),
                                listRef: listRef as EntityListRefs<T>,
                            })
                            : sheetLanguagePath && (
                                <AutoSheetView
                                    entity={sheetEntity as BaseEntity & Record<string, unknown>}
                                    sheetLanguagePath={sheetLanguagePath}
                                    collectionName={collectionName}
                                    apiUrl={apiUrl}
                                    open={true}
                                    onOpenChange={() => { setAction(""); setSheetEntity(null); }}
                                    onDelete={(data) => handleDelete(sheetEntity, data)}
                                    onRestore={() => handleRestore(sheetEntity)}
                                    access={access}
                                    buildEditPath={buildEditPath}
                                    hideEdit={resolveHideEdit(sheetEntity)}
                                    renderSheetActionMenuChildren={(e) =>
                                        sheetActionMenuChildren?.(e, (a) => bindRowActionMenu(e, a), listHelpers)
                                    }
                                    onSheetRowPatched={(row) => {
                                        listRef.current?.updateRow?.(sheetEntity._id, row as Partial<T>);
                                        setSheetEntity({...sheetEntity, ...row} as T);
                                    }}
                                    deleteRestoreConfirmLabel={resolveDeleteLabel(sheetEntity)}
                                />
                            )
                    )}
                    {action === "delete" && (
                        <DeleteAction
                            accessModel={accessModel}
                            deleteId={sheetEntity._id}
                            openAlert={true}
                            name={resolveDeleteLabel(sheetEntity)}
                            confirmName={resolveDeleteLabel(sheetEntity)}
                            onSuccess={(data: DeletedData) => {
                                handleDelete(sheetEntity, data);
                                setAction("");
                                setSheetEntity(null);
                            }}
                            onCancel={() => { setAction(""); setSheetEntity(null); }}
                            url={apiUrl}
                        />
                    )}
                    {action === "restore" && (
                        <RestoreAction
                            accessModel={accessModel}
                            deleteId={sheetEntity._id}
                            openAlert={true}
                            name={resolveDeleteLabel(sheetEntity)}
                            confirmName={resolveDeleteLabel(sheetEntity)}
                            onSuccess={() => {
                                handleRestore(sheetEntity);
                                setAction("");
                                setSheetEntity(null);
                            }}
                            onCancel={() => { setAction(""); setSheetEntity(null); }}
                            url={`${apiUrl}/restore`}
                        />
                    )}
                    {action !== "view" && action !== "delete" && action !== "restore" &&
                        renderFloatingModals?.({
                            action,
                            entity: sheetEntity,
                            resetAction: () => { setAction(""); setSheetEntity(null); },
                            listRef: listRef as EntityListRefs<T>,
                        })}
                </>
            }
        </div>
    );
}
