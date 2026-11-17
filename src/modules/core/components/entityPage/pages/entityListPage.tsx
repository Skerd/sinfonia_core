import {useEffect, useMemo, useRef, useState, type ReactNode, type RefObject} from "react";
import {findFromObject} from "@coreModule/helpers/general/objectPath.ts";
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
import type {AccessObject} from "@coreModule/helpers/context/accessContext.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import Header from "@coreModule/components/custom/header.tsx";
import Forbidden from "@coreModule/components/custom/pages/forbidden.tsx";
import {readPageHelp} from "@coreModule/components/custom/pageHelp.tsx";
import {Button, ButtonTitle} from "@coreModule/components/ui/button.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import CardAndTableView, {type EntityListApi, type EntityRowPatch} from "@coreModule/components/entityPage/list/cardAndTableView.tsx";
import ActionMenu from "@coreModule/components/viewEngine/widgets/actions/menu/actionMenu.tsx";
import DeleteAction from "@coreModule/components/viewEngine/widgets/actions/deleteAction.tsx";
import RestoreAction from "@coreModule/components/viewEngine/widgets/actions/restoreAction.tsx";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import {useDynamicLanguage} from "@coreModule/helpers/hooks/useDynamicLanguage.ts";
import {LanguageResolveContext, type ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {DeletedData, TableResponse} from "armonia/src/modules/core/types/shared.types.ts";
import type {FilterGroup, FilterValue} from "armonia/src/modules/core/database/filter";
import {generateUUID} from "@coreModule/helpers/general/uuid.ts";
import {mergeAndFilterDSL} from "@coreModule/helpers/filter/mergeFilterDsl.ts";
import QuickFilterBar, {
    buildQuickFilterDSL,
    buildQuickFilterExtraParams,
    collectDependentQuickFilterFields,
    type QuickFilterDef,
} from "@coreModule/components/entityPage/filters/quickFilterBar.tsx";
import {GRID_TRANSACTIONAL} from "@coreModule/components/entityPage/list/entityCard.constants.ts";
import {PageTitle} from "@coreModule/helpers/types/pageTitle.types.ts";
import {useActionAccess} from "@coreModule/helpers/hooks/useActionAccess.ts";
import {useOpenRecord} from "@coreModule/helpers/hooks/useOpenParam.ts";
import {EntityListRowContext, type EntityListRowContextValue} from "@coreModule/components/entityPage/list/entityListRowContext.ts";
import {
    isClosedRequest,
    isRequestDecision,
    RequestableEntryMenu,
    RequestableStandardMenuLabel,
    RequestEntryButton,
    useRequestStatusQuickFilter,
} from "@coreModule/components/entityPage/requestable/requestableEntry.tsx";
import RequestableEntryDialog from "@coreModule/components/entityPage/requestable/requestableEntryDialog.tsx";

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
            // Keep enrichSingle-only fields when list rows re-assert.
            for (const [key, value] of Object.entries(prev)) {
                if (!(key in entity) || (entity as Record<string, unknown>)[key] === undefined) {
                    next[key] = value;
                }
            }
            return next;
        });
    }, [entity]);

    if (!viewConfig) return null;

    // Like `withLanguage`, so widgets that read the sheet's dictionary themselves (enum labels) find it.
    return (
        <LanguageResolveContext value={resolveLanguageKey}>
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
        </LanguageResolveContext>
    );
}

// ---------------------------------------------------------------------------
// EntityListPage
// ---------------------------------------------------------------------------

/**
 * Reconcile quick-filter state with values read from the URL. Returns `prev`
 * untouched when nothing differs so React can skip the re-render.
 */
function syncWithUrl<V>(
    prev: Record<string, V | null>,
    fromUrl: Record<string, V | null>,
    fields: string[],
): Record<string, V | null> {
    let changed = false;
    const next = {...prev};
    for (const field of fields) {
        const urlVal = fromUrl[field] ?? null;
        if ((prev[field] ?? null) !== urlVal) {
            next[field] = urlVal;
            changed = true;
        }
    }
    // Drop fields no longer in defs.
    for (const key of Object.keys(next)) {
        if (!fields.includes(key) && next[key] != null) {
            next[key] = null;
            changed = true;
        }
    }
    return changed ? next : prev;
}

const isBlank = (value: unknown) => value == null || value === "";

/** `extraFilters` → DSL `equals` rules; undefined/null values are skipped. */
function buildExtraFiltersDSL(extraFilters: Record<string, unknown> | undefined): FilterGroup | undefined {
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
    return {id: generateUUID(), operator: "and", rules, groups: []};
}

// ---------------------------------------------------------------------------
// Header seam: the `header` slot and the parts a page composes inside it
// ---------------------------------------------------------------------------

/** What `EntityListPage` hands to its `header` slot. */
export type EntityListHeaderContext = {
    /** The page's dictionary (the `resolveLanguageKey` the page received). */
    resolveLanguageKey: ResolveLanguageKey;
    /** The viewer's create grant on the page's `accessModel`, read with the page's access perspective. */
    canCreate: boolean;
    /**
     * No create grant, but the model is a requestable platform list (D160) and the viewer holds its `request`
     * permission: {@link EntityListCreateButton} offers "Request an entry" on the same create page.
     */
    canRequest: boolean;
};

type EntityListHeaderProps = {
    ctx: EntityListHeaderContext;
    /**
     * Defaults to the dictionary's `title`. Pass {@link buildPageTitle} output when
     * the list is scoped to a parent entity, so those names reach the shell
     * breadcrumb as links instead of being printed into the heading.
     */
    title?: string | PageTitle;
    /** Defaults to the dictionary's `description`. */
    description?: string;
    /**
     * Dictionary key for {@link readPageHelp} (default `"help"`).
     * Use when one language file serves two menus (e.g. Users vs Administration).
     */
    helpKey?: string;
    /** Header controls (e.g. {@link EntityListCreateButton}), shown on the title row. */
    children?: ReactNode;
};

/** The list page heading: title, description and page help, with optional controls. */
export function EntityListHeader({ctx, title, description, helpKey, children}: EntityListHeaderProps) {
    const {resolveLanguageKey} = ctx;
    return (
        <Header
            title={title ?? resolveLanguageKey("title")}
            description={description ?? resolveLanguageKey("description")}
            help={readPageHelp(resolveLanguageKey, helpKey)}
        >
            {children ? <div className="flex items-center gap-2">{children}</div> : null}
        </Header>
    );
}

type EntityListCreateButtonProps = {
    ctx: EntityListHeaderContext;
    /** Route of the create page. */
    path: string;
    icon?: ReactNode;
    /** Dictionary key of the button label (default `"create"`). */
    labelKey?: string;
};

/**
 * Navigates to the create page; renders nothing when the viewer lacks the create grant, or "Request an entry" on a
 * requestable platform list the viewer may request on (the create page then sends a request, D160).
 */
export function EntityListCreateButton({ctx, path, icon, labelKey = "create"}: EntityListCreateButtonProps) {
    const navigate = useNavigate();
    if (!ctx.canCreate) return ctx.canRequest ? <RequestEntryButton path={path} /> : null;
    return (
        <Button type="button" onClick={(e) => {navigate(path); e.stopPropagation(); e.preventDefault();}}>
            {icon}
            <ButtonTitle>{ctx.resolveLanguageKey(labelKey)}</ButtonTitle>
        </Button>
    );
}

export type EntityListPageProps<T extends BaseEntity> = {
    apiUrl: string;
    collectionName: string;
    accessModel: string;
    tableConfigKey: string;
    buildEditPath: (entity: T) => string;
    resolveLanguageKey: ResolveLanguageKey;
    /**
     * Page header slot (seam). Omitted: {@link EntityListHeader} with the dictionary's
     * `title`, `description` and `help`, no controls. `false`: no header (embedded lists,
     * overview tabs). A function: compose the exported parts with the page's
     * {@link EntityListHeaderContext}, e.g.
     * `header={(ctx) => <EntityListHeader ctx={ctx}><EntityListCreateButton ctx={ctx} path="/x/create" /></EntityListHeader>}`.
     */
    header?: false | ((ctx: EntityListHeaderContext) => ReactNode);
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
    /**
     * Defaults to {@link GRID_TRANSACTIONAL}. Pass {@link GRID_HIERARCHY} for
     * media-led cards; both are column mosaics driven by density min-widths,
     * so do not add breakpoint column counts on top - they would pin back the
     * column count that these exist to derive.
     */
    cardViewClassName?: string;
    /** Defaults to `"flex-full"` (page fills its container). Cap it for a list embedded in a smaller area (e.g. a collapsible section). */
    scrollRootClassName?: string;
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
    buildEditPath,
    resolveLanguageKey,
    header,
    buildDeleteConfirmLabel,
    renderCard,
    sheetLanguagePath,
    renderSheet,
    renderActionMenuChildren,
    renderSheetActionMenuChildren,
    cardViewClassName = GRID_TRANSACTIONAL,
    scrollRootClassName = "flex-full",
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
    const access = useAccess(accessModel, selfAccess ? "self" : "others");
    const {create, read, requestable = false} = access;
    // A requestable platform list (D160): request status filter, decisions in the menus, request instead of create.
    const canRequest = useActionAccess(accessModel, "request") && requestable && !create;
    const requestStatusFilter = useRequestStatusQuickFilter(requestable);
    const effectiveQuickFilters = requestable ? [...(quickFilters ?? []), ...requestStatusFilter] : quickFilters;
    const hasSheet = !!(renderSheet || sheetLanguagePath);
    const readFields = (read && typeof read === "object" ? read : undefined) as Record<string, unknown> | undefined;

    // Callers often pass `extraFilters` / `quickFilters` inline (`{projectId}`), i.e. a new
    // object every render. The DSL built from them is a fetch dependency of CardAndTableView
    // and carries fresh UUIDs, so key the memos by content to avoid refetching on every render.
    const extraFiltersKey = JSON.stringify(extraFilters ?? null);
    const quickFiltersKey = JSON.stringify(effectiveQuickFilters ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const extraFiltersDSL = useMemo(() => buildExtraFiltersDSL(extraFilters), [extraFiltersKey]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const stableQuickFilters = useMemo(() => effectiveQuickFilters ?? [], [quickFiltersKey]);

    const [searchParams, setSearchParams] = useSearchParams();
    const quickFilterFields = useMemo(() => stableQuickFilters.map((d) => d.field), [stableQuickFilters]);
    const listPageParamKey = listChromeParam(LIST_PAGE_PARAM, tableConfigKey);

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
        setQuickFilterValues((prev) => syncWithUrl(prev, fromUrl as Record<string, FilterValue | null>, quickFilterFields));
        setQuickFilterLabels((prev) => syncWithUrl(prev, labelsFromUrl, quickFilterFields));
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

        const dependents = collectDependentQuickFilterFields(stableQuickFilters, field);
        setQuickFilterValues((prev) => {
            const next = {...prev, [field]: value};
            for (const dep of dependents) next[dep] = null;
            return next;
        });
        setQuickFilterLabels((prev) => {
            const next = {
                ...prev,
                [field]: isBlank(value) ? null : (label ?? null),
            };
            for (const dep of dependents) next[dep] = null;
            return next;
        });

        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                const key = quickFilterParamKey(field);
                const labelKey = quickFilterLabelParamKey(field);
                if (isBlank(value)) {
                    next.delete(key);
                    next.delete(labelKey);
                } else {
                    next.set(key, String(value));
                    if (!isBlank(label)) next.set(labelKey, label!);
                    else next.delete(labelKey);
                }
                for (const dep of dependents) {
                    next.delete(quickFilterParamKey(dep));
                    next.delete(quickFilterLabelParamKey(dep));
                }
                next.delete(listPageParamKey);
                return next;
            },
            {replace: true},
        );
    };

    const clearQuickFilters = () => {
        setQuickFilterValues({});
        setQuickFilterLabels({});
        clearQuickFilterParams(setSearchParams, quickFilterFields, listPageParamKey);
    };

    const quickFilterDSL = useMemo(
        () => buildQuickFilterDSL(stableQuickFilters, quickFilterValues),
        [stableQuickFilters, quickFilterValues],
    );

    const quickFilterExtraParams = useMemo(
        () => buildQuickFilterExtraParams(stableQuickFilters, quickFilterValues),
        [stableQuickFilters, quickFilterValues],
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
    const listRef: EntityListRefs<T> = listApiRef ?? internalListRef;

    const openAction = (entity: T, actionName: string) => {
        setAction(actionName);
        setSheetEntity(entity);
    };
    // `?open=<id>` opens that record's sheet: the target of a notification's link (D145).
    const opened = useOpenRecord<T>(apiUrl, hasSheet);
    const closeAction = () => {
        setAction("");
        setSheetEntity(null);
        if (opened.openId) opened.close();
    };
    useEffect(() => {
        if (!opened.record) return;
        setSheetEntity(opened.record);
        setAction("view");
    }, [opened.record]);

    /** Patch a row in the list and, when it is the one open in the sheet/modal, there too. */
    const patchRow = (id: string, patch: EntityRowPatch<T>) => {
        listRef.current?.updateRow?.(id, patch);
        setSheetEntity((current) => (current?._id === id ? {...current, ...patch} : current));
    };

    const handleDelete = (entity: T, response?: DeletedData) => {
        // Soft delete: keep the row and show it as deleted. Hard delete: reload the page.
        if (response?.deletedAt != null || response?.deletedBy != null) {
            patchRow(entity._id, {deletedAt: response.deletedAt, deletedBy: response.deletedBy});
            return;
        }
        listRef.current?.refetch?.();
    };

    const handleRestore = (entity: T) =>
        patchRow(entity._id, {deletedAt: undefined, deletedBy: undefined});

    const replaceRow = (row: T) => {
        listRef.current?.updateRow?.(row._id, row as Partial<T>);
        setSheetEntity((current) => (current?._id === row._id ? row : current));
    };

    const sheetActionMenuChildren = renderSheetActionMenuChildren ?? renderActionMenuChildren;

    // A record without a `name` is named by its `title` (blog posts), so a dialog never reads "Delete item" (TD-F120).
    const titleOf = (entity: T) => {
        const title = findFromObject(entity, "title");
        return typeof title === "string" && title.trim() ? title : undefined;
    };
    const resolveDeleteLabel = (entity: T) =>
        buildDeleteConfirmLabel?.(entity, readFields) ??
        (readFields?.name && entity.name ? String(entity.name) : undefined) ??
        (readFields?.title ? titleOf(entity) : undefined);

    const resolveRowFlag = (flag: boolean | ((entity: T) => boolean) | undefined, entity: T) =>
        typeof flag === "function" ? flag(entity) : !!flag;

    const listHelpers = {replaceRow};
    const headerContext: EntityListHeaderContext = {resolveLanguageKey, canCreate: !!create, canRequest};
    // Cards and sheets that change their entity on their own (request decisions) keep the list's row in step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const rowContext = useMemo<EntityListRowContextValue>(() => ({patchRow: (id, patch) => patchRow(id, patch as EntityRowPatch<T>)}), [listRef]);
    if (read === false) {
        return <Forbidden />;
    }

    return (
        <EntityListRowContext value={rowContext}>
        <div className="min-w-0 flex-full gap-4">
            {header === undefined ? <EntityListHeader ctx={headerContext} /> : header && header(headerContext)}

            <HiddenElement hideAll={true}>
                <CardAndTableView<TableResponse<T>>
                    cardView={renderCard !== undefined}
                    url={apiUrl}
                    tableConfigKey={tableConfigKey}
                    access={accessModel}
                    selfAccess={selfAccess}
                    extraParams={mergedExtraParams}
                    toolbarFilterDSL={combinedToolbarDSL}
                    aboveToolbar={aboveToolbar}
                    quickFilterBar={
                        stableQuickFilters.length ? (
                            <QuickFilterBar
                                defs={stableQuickFilters}
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
                            placeholder: resolveLanguageKey("searchPlaceholder"),
                            fields: resolveLanguageKey("fields"),
                        },
                    }}
                    configurations={{limit: 20, ...configurations}}
                    containersClassName={{
                        cardViewClassName,
                        scrollRootClassName,
                    }}
                    listRef={listRef}
                    renderFunctions={{
                        cardRender: (entity) => (
                            <>
                                {renderCard?.(
                                    entity,
                                    (row, response) => handleDelete(row ?? entity, response),
                                    (row) => handleRestore(row ?? entity),
                                    listRef,
                                )}
                            </>
                        ),
                        onRowClick: hasSheet ? (entity) => openAction(entity, "view") : undefined,
                        action: (entity) => (
                            <ActionMenu
                                accessModel={accessModel}
                                deletedData={entity}
                                onAction={(a: string) => openAction(entity, a)}
                                editPath={buildEditPath(entity)}
                                hideEdit={resolveRowFlag(rowActionMenu?.hideEdit, entity) || (requestable && isClosedRequest(entity))}
                                hideView={rowActionMenu?.hideView}
                                hideDelete={resolveRowFlag(rowActionMenu?.hideDelete, entity)}
                                hideRestore={rowActionMenu?.hideRestore || (requestable && isClosedRequest(entity))}
                                allowMenuForCustomChildren={rowActionMenu?.allowMenuForCustomChildren}
                                standardMenuLabel={requestable ? <RequestableStandardMenuLabel entry={entity} collection={accessModel} /> : null}
                                afterStandardMenuChildren={
                                    requestable ? (
                                        <RequestableEntryMenu entry={entity} collection={accessModel} onAction={(a) => openAction(entity, a)} />
                                    ) : null
                                }
                            >
                                {renderActionMenuChildren?.(
                                    entity,
                                    (a) => openAction(entity, a),
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
                                onOpenChange: closeAction,
                                onDelete: (data) => handleDelete(sheetEntity, data),
                                onRestore: () => handleRestore(sheetEntity),
                                listRef,
                            })
                            : sheetLanguagePath && (
                                <AutoSheetView
                                    entity={sheetEntity as BaseEntity & Record<string, unknown>}
                                    sheetLanguagePath={sheetLanguagePath}
                                    collectionName={collectionName}
                                    apiUrl={apiUrl}
                                    open={true}
                                    onOpenChange={closeAction}
                                    onDelete={(data) => handleDelete(sheetEntity, data)}
                                    onRestore={() => handleRestore(sheetEntity)}
                                    access={access}
                                    buildEditPath={buildEditPath}
                                    hideEdit={resolveRowFlag(rowActionMenu?.hideEdit, sheetEntity)}
                                    actionMenuAllowCustomChildren={rowActionMenu?.allowMenuForCustomChildren}
                                    renderSheetActionMenuChildren={(e) =>
                                        sheetActionMenuChildren?.(e, (a) => openAction(e, a), listHelpers)
                                    }
                                    onSheetRowPatched={(row) => patchRow(sheetEntity._id, row as Partial<T>)}
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
                                closeAction();
                            }}
                            onCancel={closeAction}
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
                                closeAction();
                            }}
                            onCancel={closeAction}
                            url={`${apiUrl}/restore`}
                        />
                    )}
                    {requestable && isRequestDecision(action) && (
                        <RequestableEntryDialog
                            decision={action}
                            entry={sheetEntity}
                            apiUrl={apiUrl}
                            onClose={closeAction}
                            onDecided={(decided) => replaceRow({...sheetEntity, ...decided})}
                        />
                    )}
                    {action !== "view" && action !== "delete" && action !== "restore" && !isRequestDecision(action) &&
                        renderFloatingModals?.({
                            action,
                            entity: sheetEntity,
                            resetAction: closeAction,
                            listRef,
                        })}
                </>
            }
        </div>
        </EntityListRowContext>
    );
}
