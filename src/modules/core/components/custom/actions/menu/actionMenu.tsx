import {compose} from "redux";
import {ReactNode, useEffect, useLayoutEffect, useRef, useState} from "react";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {EllipsisVertical} from "lucide-react";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import DeleteDropdown from "@coreModule/components/custom/actions/dropdowns/deleteDropdown.tsx";
import RestoreDropdown from "@coreModule/components/custom/actions/dropdowns/restoreDropdown.tsx";
import EditDropdown from "@coreModule/components/custom/actions/dropdowns/editDropdown.tsx";
import {useNavigate} from "react-router-dom";
import ViewDropdown from "@coreModule/components/custom/actions/dropdowns/viewDropdown.tsx";
import {useDismissSheetBeforeMenuNavigate} from "@coreModule/components/viewEngine/sheetMenuNavigateDismiss.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {
    ACTION_MENU_OPEN_EVENT,
    type ActionMenuOpenEventDetail,
} from "@coreModule/components/custom/actions/menu/openActionMenuFromContextMenu.ts";

type ActionMenuProps = {
    deletedData: DeletedData,
    accessModel: string,
    editPath: string,
    children?: ReactNode,
    /**
     * Rendered after custom `children` and before View / Edit / Delete / Restore.
     * Use for sheet “Activity” so it stays above the standard actions and does not mix with domain-specific menu items.
     */
    beforeViewMenuChildren?: ReactNode,
    onAction?: (action: string) => void,
    hideView?: boolean,
    /** Show menu for custom `children` even without write/delete (e.g. edifice row with floors-only actions). */
    allowMenuForCustomChildren?: boolean,
    hideEdit?: boolean,
    hideDelete?: boolean,
    hideRestore?: boolean,
    alwaysShowDropDownMenuTrigger?: boolean
}

function ActionMenu({
    deletedData,
    accessModel,
    editPath,
    children,
    beforeViewMenuChildren,
    onAction,
    hideView,
    allowMenuForCustomChildren,
    hideEdit,
    hideDelete,
    hideRestore,
    alwaysShowDropDownMenuTrigger,
}: ActionMenuProps){

    const navigate = useNavigate();
    const dismissSheetIfHosted = useDismissSheetBeforeMenuNavigate();
    const {read, write, delete: deleteModel, restore} = useAccess(accessModel);
    const effectiveDelete = deleteModel && !hideDelete;
    const effectiveRestore = restore && !hideRestore;

    const hasStandardTrailing =
        (!!read && !hideView) || (!!write && !hideEdit) || effectiveDelete || effectiveRestore;

    const shouldRenderMenu = !!(
        write || effectiveDelete || effectiveRestore || !children || !read
        || (allowMenuForCustomChildren && !!children) || !!beforeViewMenuChildren
    );

    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const resetContextAfterCloseTimerRef = useRef<number | null>(null);
    const [open, setOpen] = useState(false);
    /** When set, menu content is shifted so it opens at the right-click point (Popper offsets from ⋮ trigger). */
    const [contextPointer, setContextPointer] = useState<{clientX: number; clientY: number} | null>(null);
    const [pointerPopperShift, setPointerPopperShift] = useState<{alignOffset: number; sideOffset: number} | null>(null);
    /**
     * Incremented on each context-menu open so DropdownMenuContent remounts: Popper may not reposition when
     * alignOffset/sideOffset change while already open; a second right-click also races with pointerdown-outside dismiss + deferred reset timer.
     */
    const [contextMenuPositionNonce, setContextMenuPositionNonce] = useState(0);

    useEffect(() => {
        if (!shouldRenderMenu) return;
        const el = rootRef.current;
        if (!el) return;
        const onOpenFromContext = (ev: Event) => {
            const detail = (ev as CustomEvent<ActionMenuOpenEventDetail>).detail;
            if (detail == null) return;
            /* Cancel pending "closed" cleanup — pointerdown-outside may have fired before contextmenu and armed the timer. */
            if (resetContextAfterCloseTimerRef.current != null) {
                window.clearTimeout(resetContextAfterCloseTimerRef.current);
                resetContextAfterCloseTimerRef.current = null;
            }
            setContextPointer({clientX: detail.clientX, clientY: detail.clientY});
            setOpen(true);
            setContextMenuPositionNonce((n) => n + 1);
        };
        el.addEventListener(ACTION_MENU_OPEN_EVENT, onOpenFromContext);
        return () => { el.removeEventListener(ACTION_MENU_OPEN_EVENT, onOpenFromContext); };
    }, [shouldRenderMenu]);

    useEffect(() => {
        return () => {
            if (resetContextAfterCloseTimerRef.current != null) {
                window.clearTimeout(resetContextAfterCloseTimerRef.current);
            }
        };
    }, []);

    useLayoutEffect(() => {
        if (!open) {
            /* Do not clear pointerPopperShift here: Radix still runs the exit animation with open=false,
               and resetting offsets snaps the panel to the ⋮ anchor for one frame (“jump”). */
            return;
        }
        if (!contextPointer || !triggerRef.current) {
            setPointerPopperShift(null);
            return;
        }
        const tr = triggerRef.current.getBoundingClientRect();
        setPointerPopperShift({
            alignOffset: contextPointer.clientX - tr.left,
            sideOffset: contextPointer.clientY - tr.bottom,
        });
    }, [open, contextPointer]);

    if (!shouldRenderMenu) {
        return <HiddenElement />;
    }

    return (
        <div ref={rootRef} data-action-menu-root className="flex justify-end">
            <DropdownMenu
                open={open}
                onOpenChange={(next) => {
                    if (next) {
                        if (resetContextAfterCloseTimerRef.current != null) {
                            window.clearTimeout(resetContextAfterCloseTimerRef.current);
                            resetContextAfterCloseTimerRef.current = null;
                        }
                    }
                    setOpen(next);
                    if (!next) {
                        /* Defer reset so exit animation keeps pointer offsets; clearing sooner flips avoidCollisions and Popper props mid-fade. */
                        if (resetContextAfterCloseTimerRef.current != null) {
                            window.clearTimeout(resetContextAfterCloseTimerRef.current);
                        }
                        resetContextAfterCloseTimerRef.current = window.setTimeout(() => {
                            resetContextAfterCloseTimerRef.current = null;
                            setContextPointer(null);
                            setPointerPopperShift(null);
                        }, 200);
                    }
                }}
            >
                <DropdownMenuTrigger asChild ref={triggerRef}>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onPointerDown={(e) => {
                            if (e.button === 0) setContextPointer(null);
                        }}
                        className={`size-8 rounded-md ${alwaysShowDropDownMenuTrigger ? "opacity-100 scale-100" : "bg-muted/60 opacity-0 scale-[0.98] max-md:opacity-100 max-md:scale-100 md:group-hover:opacity-100 md:group-hover:scale-100 md:group-hover:bg-muted/60 md:group-hover/row:opacity-100 md:group-hover/row:scale-100 md:group-hover/row:bg-muted/60 hover:opacity-100 hover:bg-muted/80 hover:scale-100"} data-[state=open]:opacity-100 data-[state=open]:scale-100 data-[state=open]:bg-muted/60 transition-all duration-200 ease-out`}
                    >
                        <EllipsisVertical className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    key={contextMenuPositionNonce}
                    className="w-fit"
                    align="start"
                    sideOffset={pointerPopperShift?.sideOffset ?? 4}
                    alignOffset={pointerPopperShift?.alignOffset ?? 0}
                    avoidCollisions={!contextPointer}
                >

                    {
                        children &&
                        <>
                            {children}
                            <DropdownMenuSeparator />
                        </>
                    }

                    {beforeViewMenuChildren}

                    {beforeViewMenuChildren && hasStandardTrailing && <DropdownMenuSeparator />}

                    {!!read && !hideView && <ViewDropdown onAction={onAction} accessModel={accessModel} />}

                    {(!!write || effectiveDelete || effectiveRestore) && (
                        <>
                            {!!write && !hideEdit && (
                                <EditDropdown
                                    onAction={() => {
                                        dismissSheetIfHosted();
                                        navigate(editPath);
                                    }}
                                    accessModel={accessModel}
                                />
                            )}
                            {effectiveDelete && !deletedData?.deletedAt && (
                                <DeleteDropdown onAction={onAction} accessModel={accessModel} />
                            )}
                            {effectiveRestore && !!deletedData?.deletedAt && (
                                <RestoreDropdown onAction={onAction} accessModel={accessModel} />
                            )}
                        </>
                    )}

                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export default compose(
    withDebug(true, true)
)(ActionMenu);
