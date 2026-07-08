import {useState, type ReactNode, useEffect, useImperativeHandle, type ComponentType, useMemo} from "react";
import type { ViewConfig, ViewNode, SheetHeaderConfig } from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import type { AccessObject } from "@coreModule/helpers/hocs/withAccess.tsx";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@coreModule/components/ui/sheet.tsx";
import { Badge } from "@coreModule/components/ui/badge.tsx";
import { Button } from "@coreModule/components/ui/button.tsx";
import { X } from "lucide-react";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";
import { TooltipDisplayer } from "@coreModule/components/custom/tooltipDisplayer.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import ViewRenderer, { hasAccessPath, resolvePath, type ViewRendererContext } from "./ViewRenderer.tsx";
import { resolveIcon } from "./widgetRegistry.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {type DeletedData, SingleForm} from "armonia/src/modules/core/types/shared.types.ts";
import Loader from "@coreModule/components/custom/loader.tsx";
import {ErrorView} from "@coreModule/components/custom/errorView.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {SheetMenuNavigateDismissProvider} from "@coreModule/components/viewEngine/sheetMenuNavigateDismiss.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import SheetAuditHistoryDrawer, {SheetAuditHistoryMenuLabel} from "@coreModule/components/viewEngine/sheetAuditHistory.tsx";
import {
    collectAuditFieldHintsFromViewNodes,
    collectFieldLabelsFromViewNodes,
} from "@coreModule/components/viewEngine/collectFieldLabelsFromViewConfig.ts";
import {FLOATING_SHEET_CONTENT_CLASS} from "@coreModule/components/viewEngine/sheetFloatingChrome.ts";

export type SheetViewRendererProps = WithAxiosType<any, SingleForm> & {
    config: ViewConfig;
    data: Record<string, any>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resolveLanguageKey: ResolveLanguageKey;
    access: AccessObject;
    hideActions?: boolean;
    fetchId?: string,
    onDataFetched?: (data: any) => void,
    url?: string,
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
    editPath?: string;
    /**
     * When sheet `data` is not a unit (e.g. inspection), pass unit id/name so `#ReferencesRender`
     * cards receive correct `unitId` / `unitName`.
     */
    referenceCardUnitContext?: { unitId: string; unitName: string };
    /** Escape hatch: overrides config-driven title when provided. */
    headerTitle?: ReactNode;
    /** Escape hatch: overrides config-driven badges when provided. */
    headerDescription?: ReactNode;
    /** Extra action menu children (e.g. "View States", "View Cities"). */
    actionMenuChildren?: ReactNode;
    /** Show action menu for custom children without write/delete (e.g. floors-only actions on edifice). */
    actionMenuAllowCustomChildren?: boolean;
    /** Passed through to ActionMenu (e.g. workflow-gated edit). */
    hideEdit?: boolean;
    /** Passed through to ActionMenu; when true, sheet footer delete/restore modals are omitted too. */
    hideDelete?: boolean;
    hideRestore?: boolean;
    /** Overrides DeleteAction/RestoreAction name and confirmName (e.g. unit number when name is hidden). */
    deleteRestoreConfirmLabel?: string;
    /** Extra body content appended after config-driven nodes. */
    children?: ReactNode;
    /**
     * Inset panel with `bg-sidebar`, rounded corners, ring, and light shadow (same idea as
     * `Sidebar` `variant="floating"`). Overrides `config.header.sheetAppearance` when set.
     */
    sheetAppearance?: "default" | "floating";
    /**
     * When true, the header {@link ActionMenu} includes the standard View item (hideView=false).
     * Default false: the sheet is usually opened via View, so View is hidden in the header menu.
     */
    showViewInActionMenu?: boolean;
    /** Fired for any header ActionMenu selection (e.g. "view"); delete/restore still drive internal modals. */
    onActionMenuAction?: (action: string) => void;
    /**
     * When true, shows the Activity menu item and lazy-loads audit history ({@link ViewConfig.model} + `data._id`).
     * Default false until the flow is finalized.
     */
    showAuditHistory?: boolean;
    /** Merged with labels extracted from `config.nodes` for audit field names. */
    auditHistoryFieldLabels?: Record<string, string>;
    /**
     * After the sheet clears an embedded ref (linked entity delete via SmallInfoCard), receives the patched row so
     * the hosting list/card can mirror `data` across reopen (SheetViewRenderer state is ephemeral).
     */
    onSheetRowPatched?: (row: Record<string, any>) => void;
};

/** Props for the `withAxios`-wrapped default export (HOC-injected fields omitted; `data` is sheet row, not axios). */
export type SheetViewRendererPublicProps = Omit<
    SheetViewRendererProps,
    keyof WithAxiosType<any, SingleForm>
> & {
    data: Record<string, any>;
};

const DEFAULT_CONTENT_CLASS = "max-w-[98vw] min-w-[98vw] lg:max-w-[45vw] lg:min-w-[45vw] overflow-y-auto border";

function setValueAtDotPath(record: Record<string, any>, dotPath: string, value: unknown): Record<string, any> {
    const segments = dotPath.split(".").filter((s) => s.length > 0);
    if (segments.length === 0) {
        return record;
    }
    const root = { ...record };
    let node: Record<string, any> = root;
    for (let i = 0; i < segments.length - 1; i++) {
        const key = segments[i]!;
        const nested = node[key];
        const branch =
            nested !== null &&
            nested !== undefined &&
            typeof nested === "object" &&
            !Array.isArray(nested)
                ? { ...(nested as Record<string, any>) }
                : {};
        node[key] = branch;
        node = branch;
    }
    node[segments[segments.length - 1]!] = value;
    return root;
}

export function SheetViewRenderer({
    config,
    data: dataProps,
    open,
    onOpenChange,
    resolveLanguageKey,
    fetchId,
    onDataFetched,
    url,
    onFilterChange,
    loading,
    error,
    access,
    hideActions = false,
    onDelete,
    onRestore,
    editPath,
    headerTitle,
    headerDescription,
    actionMenuChildren,
    actionMenuAllowCustomChildren,
    hideEdit,
    hideDelete,
    hideRestore,
    deleteRestoreConfirmLabel,
    children,
    sheetAppearance: sheetAppearanceProp,
    referenceCardUnitContext,
    showViewInActionMenu = false,
    onActionMenuAction,
    onSheetRowPatched,
    innerRef,
    showAuditHistory = false,
    auditHistoryFieldLabels,
}: SheetViewRendererProps) {

    const [data, setData] = useState(dataProps || {});
    const [action, setAction] = useState("");
    const [forceReload, setForceReload] = useState(0);
    const [auditHistoryOpen, setAuditHistoryOpen] = useState(false);
    const header = config.header;
    const readAccess = access.read && typeof access.read === "object" ? access.read : {};
    const deleteRestoreName = deleteRestoreConfirmLabel ?? (readAccess.name && data.name ? data.name : undefined);

    const ctx: ViewRendererContext = {
        data,
        resolveLanguageKey,
        access: readAccess,
        mode: "sheet",
        referenceCardUnitContext,
        unlinkEmbeddedRefPath: (dotPath: string) => {
            setData((prev: Record<string, any>) => {
                const next = setValueAtDotPath(prev, dotPath, null);
                queueMicrotask(() => {
                    onSheetRowPatched?.(next);
                });
                return next;
            });
        },
        unlinkEmbeddedListRefItem: (listPath: string, itemIndex: number) => {
            setData((prev: Record<string, any>) => {
                const list = resolvePath(prev, listPath);
                if (!Array.isArray(list) || itemIndex < 0 || itemIndex >= list.length) {
                    return prev;
                }
                const nextList = list.filter((_, i) => i !== itemIndex);
                const next = setValueAtDotPath(prev, listPath, nextList);
                queueMicrotask(() => {
                    onSheetRowPatched?.(next);
                });
                return next;
            });
        },
    };

    const contentClassName = header?.contentClassName ?? DEFAULT_CONTENT_CLASS;
    const sheetAppearance = sheetAppearanceProp ?? header?.sheetAppearance ?? "floating";
    const floatingClasses = sheetAppearance === "floating" ? FLOATING_SHEET_CONTENT_CLASS : "";

    const auditLabels = useMemo(
        () => ({
            ...collectFieldLabelsFromViewNodes(config.nodes, config.header),
            ...(auditHistoryFieldLabels ?? {}),
        }),
        [config.nodes, config.header, auditHistoryFieldLabels],
    );

    const auditFieldHints = useMemo(
        () => collectAuditFieldHintsFromViewNodes(config.nodes, config.header),
        [config.nodes, config.header],
    );

    const canSeeAuditTrail =
        showAuditHistory &&
        !hideActions &&
        !!data?._id &&
        Object.keys(readAccess).length > 0 &&
        !!config?.model;

    useImperativeHandle(innerRef, () => ({
        success: (newData: any) => {
            setData(newData || {});
            onDataFetched?.(newData);
        }
    }))

    useEffect(() => {
        if( !!fetchId && !! url ){
            onFilterChange({
                _id: fetchId
            })
        }
    }, [fetchId, url, forceReload]);

    useEffect(() => {
        if( !dataProps ) return;
        setData(dataProps);
    }, [dataProps]);

    return (
        <SheetMenuNavigateDismissProvider onDismiss={() => onOpenChange(false)}>
            <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className={cn(floatingClasses, contentClassName)}
            >
                {/*{data?._id} {forceReload} {fetchId} {data?.name}*/}
                <div className="flex-full">
                    <SheetHeader className="flex p-0 group hover:cursor-pointer shadow-sm">
                        <div className="relative flex w-full items-stretch">
                            {
                                (readAccess.deletedBy || readAccess.deletedAt) &&
                                <div className="h-full flex rounded-tl-full items-stretch overflow-hidden">
                                    <DeletedInfo
                                        deletedAt={data.deletedAt}
                                        deletedBy={data.deletedBy}
                                    />
                                </div>
                            }
                            <div className="flex items-start justify-between gap-2 p-2 w-full">
                                <div className="min-w-0">
                                    {renderTitle(header, headerTitle, data, readAccess, resolveLanguageKey)}
                                    {renderDescription(header, headerDescription, data, readAccess, resolveLanguageKey)}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {
                                        !hideActions && !loading && !error &&
                                        <ActionMenu
                                            accessModel={config.accessModel}
                                            deletedData={data}
                                            onAction={(a: string) => {
                                                onActionMenuAction?.(a);
                                                if (a === "delete" || a === "restore") {
                                                    setAction(a);
                                                }
                                            }}
                                            editPath={editPath ?? ""}
                                            hideView={!showViewInActionMenu}
                                            allowMenuForCustomChildren={actionMenuAllowCustomChildren}
                                            hideEdit={hideEdit}
                                            hideDelete={hideDelete}
                                            hideRestore={hideRestore}
                                            alwaysShowDropDownMenuTrigger={true}
                                            beforeViewMenuChildren={
                                                canSeeAuditTrail ? (
                                                    <DropdownMenuItem
                                                        data-slot="sheet-audit-history-menu-item"
                                                        onSelect={(e: {preventDefault: () => void}) => {
                                                            e.preventDefault();
                                                            setAuditHistoryOpen(true);
                                                        }}
                                                    >
                                                        <SheetAuditHistoryMenuLabel />
                                                    </DropdownMenuItem>
                                                ) : null
                                            }
                                        >
                                            {actionMenuChildren}
                                        </ActionMenu>
                                    }
                                    {
                                        header?.showCloseButton &&
                                        <SheetClose asChild>
                                            <Button variant="ghost" size="icon" className="shrink-0">
                                                <X />
                                            </Button>
                                        </SheetClose>
                                    }
                                </div>
                            </div>
                        </div>
                    </SheetHeader>
                    {
                        (loading) ?
                        <Loader />
                        :
                        <>
                            {
                                !!error ?
                                <div className="px-2">
                                    <ErrorView
                                        title={resolveLanguageKey("failedTitle")}
                                        description={resolveLanguageKey("failedDescription")}
                                        tooltipDescription={resolveLanguageKey("failedTooltipDescription")}
                                        onClick={() => setForceReload((p) => p + 1)}
                                    />
                                </div>
                                :
                                <div className="flex-full px-4 pb-6 mt-4 space-y-4">
                                    <ViewRenderer nodes={config.nodes} ctx={ctx} />
                                    {children}
                                </div>
                            }
                        </>
                    }
                </div>
            </SheetContent>

            {
                !!action && !loading && !error &&
                <>
                    {
                        action === "delete" && !hideDelete &&
                        <DeleteAction
                            accessModel={config.accessModel}
                            deleteId={data._id}
                            openAlert={action === "delete"}
                            name={deleteRestoreName}
                            confirmName={deleteRestoreName}
                            onSuccess={onDelete}
                            onCancel={() => setAction("")}
                            url={config.apiUrl}
                        />
                    }
                    {
                        action === "restore" && !hideRestore &&
                        <RestoreAction
                            accessModel={config.accessModel}
                            deleteId={data._id}
                            openAlert={action === "restore"}
                            name={deleteRestoreName}
                            confirmName={deleteRestoreName}
                            onSuccess={onRestore}
                            onCancel={() => setAction("")}
                            url={`${config.apiUrl}/restore`}
                        />
                    }
                </>
            }
            </Sheet>
            {canSeeAuditTrail && (
                <SheetAuditHistoryDrawer
                    open={auditHistoryOpen}
                    onOpenChange={setAuditHistoryOpen}
                    documentId={String(data._id)}
                    collectionName={config.model}
                    fieldLabels={auditLabels}
                    auditFieldHints={auditFieldHints}
                    sheetResolveLanguageKey={resolveLanguageKey}
                />
            )}
        </SheetMenuNavigateDismissProvider>
    );
}

const SheetViewRendererWithAxios = compose(
    withAxios(
        {
            url: "overriden-from-component",
            method: "POST",
            data: {}
        },
        true,
        "modelData"
    ),
    withDebug(true, true)
)(SheetViewRenderer);

export default SheetViewRendererWithAxios as unknown as ComponentType<SheetViewRendererPublicProps>;

// ---------------------------------------------------------------------------
// Header renderers
// ---------------------------------------------------------------------------

function renderTitle(
    header: SheetHeaderConfig | undefined,
    headerTitleProp: ReactNode | undefined,
    data: Record<string, any>,
    readAccess: Record<string, any>,
    resolveLanguageKey: ResolveLanguageKey
): ReactNode {
    if (headerTitleProp) {
        return (
            <SheetTitle className="flex flex-wrap items-center gap-2 mb-0">
                <HiddenElement>{headerTitleProp}</HiddenElement>
            </SheetTitle>
        );
    }

    if (header) {
        const rawTitle = resolvePath(data, header.titleField);
        const cat =
            typeof header.titleFieldLanguageCategory === "string" &&
            header.titleFieldLanguageCategory.length > 0
                ? header.titleFieldLanguageCategory
                : "";
        const titleValue =
            cat &&
            rawTitle != null &&
            rawTitle !== "" &&
            (typeof rawTitle === "string" || typeof rawTitle === "number" || typeof rawTitle === "boolean")
                ? resolveLanguageKey(`${cat}.${String(rawTitle)}`)
                : rawTitle;
        const titleCls = header.titleClassName ?? "md:text-xl";
        return (
            <SheetTitle className="flex flex-col flex-wrap justify-center gap-1">
                <TooltipDisplayer tooltip={resolveLanguageKey(header.titleField)} show={!!readAccess[header.titleField]}>
                    <p className={`truncate w-fit ${titleCls}`}>{titleValue}</p>
                </TooltipDisplayer>
                {
                    header.subtitleKey &&
                    <Badge variant="secondary">
                        {resolveLanguageKey(header.subtitleKey)}
                    </Badge>
                }
            </SheetTitle>
        );
    }

    return (
        <SheetTitle className="flex flex-wrap items-center gap-2 mb-0">
            <HiddenElement>
                {readAccess.name && data.name && (
                    <span className="truncate">{data.name}</span>
                )}
            </HiddenElement>
        </SheetTitle>
    );
}

function renderDescription(
    header: SheetHeaderConfig | undefined,
    headerDescriptionProp: ReactNode | undefined,
    data: Record<string, any>,
    readAccess: Record<string, any>,
    resolveLanguageKey: ResolveLanguageKey
): ReactNode {
    if (headerDescriptionProp) {
        return (
            <SheetDescription className="flex flex-wrap gap-1">
                {headerDescriptionProp}
            </SheetDescription>
        );
    }

    if (header?.badges && header.badges.length > 0) {
        const rendered = header.badges
            .map((node, i) => renderHeaderBadge(node, data, readAccess, resolveLanguageKey, i))
            .filter(Boolean);

        if (rendered.length === 0) return null;

        return (
            <SheetDescription className="flex flex-wrap gap-1">
                {rendered}
            </SheetDescription>
        );
    }

    return null;
}

function renderHeaderBadge(
    node: ViewNode,
    data: Record<string, any>,
    readAccess: Record<string, any>,
    _resolveLanguageKey: ResolveLanguageKey,
    index: number
): ReactNode {
    if (node.dependent) {
        const value = resolvePath(data, node.dependent);
        if (!value) return null;
    }
    if (node.permissions?.read && !hasAccessPath(readAccess, node.permissions.read)) {
        return null;
    }

    const field = node.field;
    if (!field) return null;

    let displayValue: any = resolvePath(data, field.name);
    const wp = field.widgetProps ?? {};

    if (wp.prefix && displayValue && typeof displayValue === "string" && !displayValue.includes(wp.prefix)) {
        displayValue = wp.prefix + displayValue;
    }

    const Icon = wp.icon ? resolveIcon(wp.icon) : null;
    const badgeProps = node.props ?? {};

    return (
        <HiddenElement key={index}>
            {displayValue && (
                <Badge {...badgeProps}>
                    {Icon && <Icon className="h-3 w-3 mr-1" />}
                    {displayValue}
                </Badge>
            )}
        </HiddenElement>
    );
}
