import {JSX, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {
    clearQuickFilterParams,
    LIST_PAGE_PARAM,
    listChromeParam,
    quickFilterLabelParamKey,
    quickFilterParamKey,
    readQuickFilterLabelsFromUrl,
    readQuickFiltersFromUrl,
} from "@coreModule/helpers/hooks/useListUrlState.ts";
import {useAccess, type AccessObject} from "@coreModule/helpers/hocs/withAccess.tsx";
import Header from "@coreModule/components/custom/header.tsx";
import {readPageHelp} from "@coreModule/components/custom/pageHelp.tsx";
import {Button, ButtonTitle} from "@coreModule/components/ui/button.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import CardAndTableView, {type EntityListApi} from "@coreModule/components/custom/cardAndTableView.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import {useDynamicLanguage} from "@coreModule/components/entityPage/useDynamicLanguage.ts";
import type {DeletedData, TableResponse} from "armonia/src/modules/core/types/shared.types.ts";
import type {FilterGroup, FilterValue} from "armonia/src/modules/core/database/filter";
import {generateUUID, type PageTitle} from "@coreModule/helpers/general";
import {mergeAndFilterDSL} from "@coreModule/helpers/filter/mergeFilterDsl.ts";
import QuickFilterBar, {
    buildQuickFilterDSL,
    buildQuickFilterExtraParams,
    collectDependentQuickFilterFields,
    type QuickFilterDef,
} from "@coreModule/components/entityPage/quickFilterBar.tsx";
import {GRID_TRANSACTIONAL} from "@coreModule/components/custom/cards/entityCard.constants.ts";

export type {QuickFilterDef};

type BaseEntity = {
    _id: string;
    name?: unknown;
};

// ---------------------------------------------------------------------------
// Auto sheet — rendered inside EntityListPage when no renderSheet override is given
// ---------------------------------------------------------------------------

/** List mutation ref forwarded to cards/sheets (`updateRow`, `mapRows`, `refetch`). */
export type EntityListRefs<T extends BaseEntity = BaseEntity> = RefObject<EntityListApi<T> | null>;

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
    actionMenuAllowCustomChildren?: boolean;
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
    actionMenuAllowCustomChildren,
    onSheetRowPatched,
    deleteRestoreConfirmLabel,
}: AutoSheetViewProps) {
    const {resolveLanguageKey} = useDynamicLanguage(sheetLanguagePath);
    const viewConfig = useViewConfig(collectionName, "sheet");
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(entity);

    useEffect(() => {
        setSheetData((prev) => {
            const next: Record<string, unknown> = {...entity};
            // Keep enrichSingle-only fields (e.g. movements) when list rows re-assert.
            for (const [key, value] of Object.entries(prev)) {
                if (!(key in entity) || (entity as Record<string, unknown>)[key] === undefined) {
                    next[key] = value;
                }
            }
            return next;
        });
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
            actionMenuAllowCustomChildren={actionMenuAllowCustomChildren}
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
    /**
     * Overrides `resolveLanguageKey("title")`. Pass {@link buildPageTitle} when
     * the list is scoped to a parent entity, so those names reach the shell
     * breadcrumb as links instead of being printed into the heading.
     */
    headerTitle?: string | PageTitle;
    /** Overrides `resolveLanguageKey("description")` for the page header. */
    headerDescription?: string;
    /**
     * Dictionary key for {@link readPageHelp} (default `"help"`).
     * Use when one language file serves two menus (e.g. Users vs Administration).
     */
    helpLanguageKey?: string;
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
    /**
     * Defaults to {@link GRID_TRANSACTIONAL}. Pass {@link GRID_HIERARCHY} for
     * media-led cards; both are CSS multi-column mosaics driven by density
     * min-widths, so do not add breakpoint column counts on top - they would
     * pin back the column count that these exist to derive.
     */
    cardViewClassName?: string;
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
        hideRestore?: boolean;
        hideView?: boolean;
        allowMenuForCustomChildren?: boolean;
        /** Per-row when a function (e.g. hide edit for paid reservations). */
        hideEdit?: boolean | ((entity: T) => boolean);
        /** Per-row when a function (e.g. hide delete when `canDelete` is false). */
        hideDelete?: boolean | ((entity: T) => boolean);
    };
    /**
     * Filter inputs rendered above the FilterBuilder row on desktop.
     * On mobile they open with the existing sliders toggle.
     * Each def becomes a labeled input; their values AND-combine with the main DSL filter and with `extraFilters`.
     */
    quickFilters?: QuickFilterDef[];
    /**
     * Access perspective for list read + CardAndTableView (default `true` → `self`).
     * Pass `false` for company-admin lists that must use the `others` grant (e.g. users).
     */
    selfAccess?: boolean;
    /** Optional external list mutation ref (updateRow / refetch) for parent-owned contexts. */
    listApiRef?: EntityListRefs<T>;
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
    helpLanguageKey,
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
    cardViewClassName = GRID_TRANSACTIONAL,
    configurations,
    extraParams,
    extraFilters,
    aboveToolbar,
    renderFloatingModals,
    rowActionMenu,
    quickFilters,
    selfAccess = true,
    listApiRef,
}: EntityListPageProps<T>) {
    const navigate = useNavigate();
    const access = useAccess(accessModel, selfAccess ? "self" : "others");
    const {create, read} = access;
    const hasSheet = !!(renderSheet || sheetLanguagePath);
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

    const [searchParams, setSearchParams] = useSearchParams();
    const quickFilterFields = useMemo(() => (quickFilters ?? []).map((d) => d.field), [quickFilters]);

    // Seed from `qf_*` / `qf_*_label` on first render so toolbarFilterDSL is correct for the first fetch.
    const [quickFilterValues, setQuickFilterValues] = useState<Record<string, FilterValue | null>>(() => {
        if (!quickFilterFields.length) return {};
        return readQuickFiltersFromUrl(searchParams, quickFilterFields) as Record<string, FilterValue | null>;
    });
    const [quickFilterLabels, setQuickFilterLabels] = useState<Record<string, string | null>>(() => {
        if (!quickFilterFields.length) return {};
        return readQuickFilterLabelsFromUrl(searchParams, quickFilterFields);
    });

    useEffect(() => {
        if (!quickFilterFields.length) return;
        const fromUrl = readQuickFiltersFromUrl(searchParams, quickFilterFields);
        const labelsFromUrl = readQuickFilterLabelsFromUrl(searchParams, quickFilterFields);
        setQuickFilterValues((prev) => {
            let changed = false;
            const next = {...prev};
            for (const field of quickFilterFields) {
                const urlVal = fromUrl[field];
                if ((prev[field] ?? null) !== urlVal) {
                    next[field] = urlVal;
                    changed = true;
                }
            }
            // Drop fields no longer in defs (or cleared in URL).
            for (const key of Object.keys(next)) {
                if (!quickFilterFields.includes(key) && next[key] != null) {
                    next[key] = null;
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
        setQuickFilterLabels((prev) => {
            let changed = false;
            const next = {...prev};
            for (const field of quickFilterFields) {
                const urlLabel = labelsFromUrl[field];
                if ((prev[field] ?? null) !== urlLabel) {
                    next[field] = urlLabel;
                    changed = true;
                }
            }
            for (const key of Object.keys(next)) {
                if (!quickFilterFields.includes(key) && next[key] != null) {
                    next[key] = null;
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
        // Only hydrate from the URL when the param set changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams.toString(), quickFilterFields.join("|")]);

    const setQuickFilterValue = (field: string, value: FilterValue | null, label?: string | null) => {
        const prevVal = quickFilterValues[field] ?? null;
        const sameValue =
            prevVal === value ||
            (prevVal != null && value != null && String(prevVal) === String(value));

        // Same id — only persist a newly resolved display label (`qf_<field>_label`).
        if (sameValue) {
            if (
                value != null &&
                label != null &&
                label !== "" &&
                (quickFilterLabels[field] ?? null) !== label
            ) {
                setQuickFilterLabels((prev) => ({...prev, [field]: label}));
                setSearchParams(
                    (prev) => {
                        const next = new URLSearchParams(prev);
                        next.set(quickFilterLabelParamKey(field), label);
                        return next;
                    },
                    {replace: true},
                );
            }
            return;
        }

        const dependents = collectDependentQuickFilterFields(quickFilters ?? [], field);
        setQuickFilterValues((prev) => {
            const next = {...prev, [field]: value};
            for (const dep of dependents) next[dep] = null;
            return next;
        });
        setQuickFilterLabels((prev) => {
            const next = {
                ...prev,
                [field]: value == null || value === "" ? null : (label ?? null),
            };
            for (const dep of dependents) next[dep] = null;
            return next;
        });

        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                const key = quickFilterParamKey(field);
                const labelKey = quickFilterLabelParamKey(field);
                if (value == null || value === "") {
                    next.delete(key);
                    next.delete(labelKey);
                } else {
                    next.set(key, String(value));
                    if (label != null && label !== "") next.set(labelKey, label);
                    else next.delete(labelKey);
                }
                for (const dep of dependents) {
                    next.delete(quickFilterParamKey(dep));
                    next.delete(quickFilterLabelParamKey(dep));
                }
                next.delete(listChromeParam(LIST_PAGE_PARAM, tableConfigKey));
                return next;
            },
            {replace: true},
        );
    };

    const clearQuickFilters = () => {
        setQuickFilterValues({});
        setQuickFilterLabels({});
        clearQuickFilterParams(setSearchParams, quickFilterFields, listChromeParam(LIST_PAGE_PARAM, tableConfigKey));
    };

    const quickFilterDSL = useMemo(
        () => buildQuickFilterDSL(quickFilters ?? [], quickFilterValues),
        [quickFilters, quickFilterValues],
    );

    const quickFilterExtraParams = useMemo(
        () => buildQuickFilterExtraParams(quickFilters ?? [], quickFilterValues),
        [quickFilters, quickFilterValues],
    );

    const mergedExtraParams = useMemo(
        () => ({...(extraParams ?? {}), ...quickFilterExtraParams}),
        [extraParams, quickFilterExtraParams],
    );

    const combinedToolbarDSL = useMemo(
        () => mergeAndFilterDSL(extraFiltersDSL, quickFilterDSL),
        [extraFiltersDSL, quickFilterDSL],
    );

    const [sheetEntity, setSheetEntity] = useState<T | null>(null);
    const [action, setAction] = useState("");

    const internalListRef = useRef<EntityListApi<T> | null>(null);
    const listRef = listApiRef ?? internalListRef;

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
    const resolveHideDelete = (entity: T) =>
        typeof rowActionMenu?.hideDelete === "function" ? rowActionMenu.hideDelete(entity) : !!rowActionMenu?.hideDelete;

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
                title={headerTitle ?? (resolveLanguageKey("title") as string)}
                description={(headerDescription ?? resolveLanguageKey("description")) as string}
                help={readPageHelp(resolveLanguageKey, helpLanguageKey)}
            >
                <div className="flex items-center gap-2">
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
                <CardAndTableView<TableResponse<T>, Record<string, unknown>>
                    url={apiUrl}
                    tableConfigKey={tableConfigKey}
                    access={accessModel}
                    selfAccess={selfAccess}
                    extraParams={mergedExtraParams}
                    toolbarFilterDSL={combinedToolbarDSL}
                    aboveToolbar={aboveToolbar}
                    quickFilterBar={
                        quickFilters?.length ? (
                            <QuickFilterBar
                                defs={quickFilters}
                                values={quickFilterValues}
                                labels={quickFilterLabels}
                                onChange={setQuickFilterValue}
                                onClearAll={clearQuickFilters}
                                extraParams={mergedExtraParams}
                            />
                        ) : undefined
                    }
                    tableConfigOptions={{
                        filterConfig: {
                            placeholder: resolveLanguageKey("searchPlaceholder") as string,
                            fields: resolveLanguageKey("fields"),
                        },
                    }}
                    configurations={{limit: 20, ...configurations}}
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
                        onRowClick: hasSheet
                            ? (entity) => {
                                setAction("view");
                                setSheetEntity(entity);
                            }
                            : undefined,
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
                                hideView={rowActionMenu?.hideView}
                                hideDelete={resolveHideDelete(entity)}
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
                                    actionMenuAllowCustomChildren={rowActionMenu?.allowMenuForCustomChildren}
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
