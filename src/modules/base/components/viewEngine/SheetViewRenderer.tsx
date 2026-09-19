import {useEffect, useImperativeHandle, useMemo, useState, type ComponentType, type ReactNode} from "react";
import {compose} from "redux";
import {X} from "lucide-react";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {type DeletedData, SingleForm} from "armonia/src/modules/core/types/shared.types.ts";
import type {ResolveLanguageKey} from "@baseModule/helpers/hocs/withLanguage.tsx";
import type {AccessObject} from "@baseModule/helpers/context/accessContext.tsx";
import withAxios, {WithAxiosType} from "@baseModule/helpers/hocs/withAxios.tsx";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import {Sheet, SheetClose, SheetContent, SheetHeader} from "@coreModule/components/ui/sheet.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";
import Loader from "@baseModule/components/custom/loader/loader.tsx";
import {ErrorView} from "@baseModule/components/custom/errors/errorView.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import ViewRenderer, {type ViewRendererContext} from "./ViewRenderer.tsx";
import SheetAuditHistoryDrawer, {SheetAuditHistoryMenuLabel} from "./audit/sheetAuditHistory.tsx";
import {collectAuditFieldHintsFromViewNodes, collectFieldLabelsFromViewNodes} from "./audit/auditFieldHints.ts";
import {SheetDescriptionBlock, SheetTitleBlock} from "./sheet/shell/sheetHeaderBlocks.tsx";
import {useSheetPresence} from "./sheet/shell/useSheetPresence.ts";
import {useSheetRow} from "./sheet/shell/useSheetRow.ts";
import {SheetMenuNavigateDismissProvider} from "./sheet/widgets/sheetMenuNavigateDismiss.tsx";
import {FLOATING_SHEET_CONTENT_CLASS} from "./sheet/widgets/sheetFloatingChrome.ts";

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
     * Shows the Activity menu item, which lazy-loads the record's audit history
     * ({@link ViewConfig.model} + `data._id`). On by default; pass `false` to hide it on a sheet.
     */
    showAuditHistory?: boolean;
    /** Merged with labels extracted from `config.nodes` for audit field names. */
    auditHistoryFieldLabels?: Record<string, string>;
    /**
     * After the sheet clears an embedded ref (linked entity delete via DisplayCard), receives the patched row so
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

const DEFAULT_CONTENT_CLASS = "max-w-[98vw] min-w-[98vw] lg:max-w-[58vw] lg:min-w-[58vw] overflow-y-auto border";

/**
 * Entity side sheet driven by a view config: header (title, badges, action menu), body
 * (`ViewRenderer` in sheet mode), delete / restore confirmations and the activity drawer.
 */
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
    showAuditHistory = true,
    auditHistoryFieldLabels,
}: SheetViewRendererProps) {
    const {row: data, setRow, unlinkRefPath, unlinkListItem} = useSheetRow(dataProps, onSheetRowPatched);
    const {present, handleOpenChange, dismissNow} = useSheetPresence(open, onOpenChange);
    const [action, setAction] = useState<"" | "delete" | "restore">("");
    const [reloadCount, setReloadCount] = useState(0);
    const [auditHistoryOpen, setAuditHistoryOpen] = useState(false);

    const header = config.header;
    const readAccess = access.read && typeof access.read === "object" ? access.read : {};
    const deleteRestoreName = deleteRestoreConfirmLabel ?? (readAccess.name && data.name ? data.name : undefined);

    useImperativeHandle(innerRef, () => ({
        success: (newData: any) => {
            setRow(newData || {});
            onDataFetched?.(newData);
        },
    }));

    // Fetch the full row on open and on retry; `onFilterChange` is recreated by the HOC each render.
    useEffect(() => {
        if (fetchId && url) {
            onFilterChange({_id: fetchId});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchId, url, reloadCount]);

    const ctx: ViewRendererContext = {
        data,
        resolveLanguageKey,
        access: readAccess,
        mode: "sheet",
        sheetModel: config.model,
        referenceCardUnitContext,
        unlinkEmbeddedRefPath: unlinkRefPath,
        unlinkEmbeddedListRefItem: unlinkListItem,
    };

    const auditLabels = useMemo(
        () => ({
            ...collectFieldLabelsFromViewNodes(config.nodes, config.header),
            ...auditHistoryFieldLabels,
        }),
        [config.nodes, config.header, auditHistoryFieldLabels],
    );
    const auditFieldHints = useMemo(
        () => collectAuditFieldHintsFromViewNodes(config.nodes, config.header),
        [config.nodes, config.header],
    );
    const canSeeAuditTrail =
        showAuditHistory && !hideActions && !!data._id && Object.keys(readAccess).length > 0 && !!config.model;

    const sheetAppearance = sheetAppearanceProp ?? header?.sheetAppearance ?? "floating";
    const contentClassName = cn(
        sheetAppearance === "floating" && FLOATING_SHEET_CONTENT_CLASS,
        header?.contentClassName ?? DEFAULT_CONTENT_CLASS,
    );
    const ready = !loading && !error;
    const headerProps = {header, data, readAccess, resolveLanguageKey};

    let body: ReactNode;
    if (loading) {
        body = <Loader />;
    } else if (error) {
        body = (
            <div className="px-2">
                <ErrorView
                    title={resolveLanguageKey("failedTitle")}
                    description={resolveLanguageKey("failedDescription")}
                    tooltipDescription={resolveLanguageKey("failedTooltipDescription")}
                    onClick={() => setReloadCount((n) => n + 1)}
                />
            </div>
        );
    } else {
        body = (
            <div className="flex-full px-4 pb-6 mt-4 gap-y-4">
                <ViewRenderer nodes={config.nodes} ctx={ctx} />
                {children}
            </div>
        );
    }

    return (
        <SheetMenuNavigateDismissProvider onDismiss={dismissNow}>
            <Sheet open={present} onOpenChange={handleOpenChange}>
                <SheetContent side="right" showCloseButton={false} className={contentClassName}>
                    <div className="flex-full">
                        <SheetHeader className="flex p-0 group hover:cursor-pointer shadow-sm">
                            <div className="relative flex w-full items-stretch">
                                {(readAccess.deletedBy || readAccess.deletedAt) && (
                                    <div className="h-full flex rounded-tl-full items-stretch overflow-hidden">
                                        <DeletedInfo deletedAt={data.deletedAt} deletedBy={data.deletedBy} />
                                    </div>
                                )}
                                <div className="flex items-start justify-between gap-2 p-2 w-full">
                                    <div className="min-w-0">
                                        <SheetTitleBlock {...headerProps} override={headerTitle} />
                                        <SheetDescriptionBlock {...headerProps} override={headerDescription} />
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {!hideActions && ready && (
                                            <ActionMenu
                                                accessModel={config.accessModel}
                                                deletedData={data}
                                                onAction={(a: string) => {
                                                    onActionMenuAction?.(a);
                                                    if (a === "delete" || a === "restore") setAction(a);
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
                                                            onSelect={() => {
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
                                        )}
                                        {header?.showCloseButton && (
                                            <SheetClose asChild>
                                                <Button variant="ghost" size="icon" className="shrink-0">
                                                    <X />
                                                </Button>
                                            </SheetClose>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </SheetHeader>
                        {body}
                    </div>
                </SheetContent>

                {ready && action === "delete" && !hideDelete && (
                    <DeleteAction
                        accessModel={config.accessModel}
                        deleteId={data._id}
                        openAlert
                        name={deleteRestoreName}
                        confirmName={deleteRestoreName}
                        onSuccess={onDelete}
                        onCancel={() => setAction("")}
                        url={config.apiUrl}
                    />
                )}
                {ready && action === "restore" && !hideRestore && (
                    <RestoreAction
                        accessModel={config.accessModel}
                        deleteId={data._id}
                        openAlert
                        name={deleteRestoreName}
                        confirmName={deleteRestoreName}
                        onSuccess={onRestore}
                        onCancel={() => setAction("")}
                        url={`${config.apiUrl}/restore`}
                    />
                )}
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
