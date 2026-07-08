/**
 * Floating sheet panel tokens (aligned with entity {@link SheetViewRenderer} sheets).
 */
export const FLOATING_SHEET_CONTENT_CLASS =
    "bg-sidebar text-sidebar-foreground !border-0 shadow-sm ring-1 ring-sidebar-border rounded-lg " +
    "!top-1 !right-1 !bottom-1 !left-auto !h-auto gap-0 sm:!top-1 sm:!right-1 sm:!bottom-1 md:!top-2 md:!right-2 md:!bottom-2 " +
    "[&_[data-slot=sheet-title]]:!text-sidebar-foreground " +
    "[&_[data-slot=sheet-description]]:!text-sidebar-foreground/90";
