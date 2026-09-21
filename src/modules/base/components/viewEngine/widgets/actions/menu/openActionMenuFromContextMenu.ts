import type {MouseEvent} from "react";

/** Dispatched on `[data-action-menu-root]` so `ActionMenu` can open from a right-click. */
export const ACTION_MENU_OPEN_EVENT = "action-menu:open";

export type ActionMenuOpenEventDetail = {
    clientX: number;
    clientY: number;
};

/** While a sheet panel is open, list row/card context menus are disabled (sheet view, audit drawer, mobile sidebar sheet, etc.). */
function shouldSuppressOpenActionMenuFromContext(e: MouseEvent<HTMLElement>): boolean {
    const target = e.target;
    if (target instanceof Element && target.closest("[data-slot=sheet-content],[data-slot=sheet-overlay]")) {
        return true;
    }
    // Suppress when the contextmenu event leaked from a Dialog portal to an outer card wrapper via React's
    // synthetic event bubbling. Target is inside the dialog DOM but currentTarget is not — wrong card would open.
    if (
        target instanceof Element &&
        e.currentTarget instanceof Element &&
        target.closest("[data-slot=dialog-content],[data-slot=dialog-overlay]") &&
        !e.currentTarget.closest("[data-slot=dialog-content],[data-slot=dialog-overlay]")
    ) {
        return true;
    }
    if (typeof document === "undefined") return false;
    return document.querySelector('[data-slot=sheet-content][data-state="open"]') != null;
}

export function openActionMenuFromContextMenu(e: MouseEvent<HTMLElement>) {
    if (shouldSuppressOpenActionMenuFromContext(e)) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    const root = e.currentTarget.querySelector("[data-action-menu-root]");
    root?.dispatchEvent(
        new CustomEvent<ActionMenuOpenEventDetail>(ACTION_MENU_OPEN_EVENT, {
            bubbles: false,
            detail: {clientX: e.clientX, clientY: e.clientY},
        }),
    );
}
