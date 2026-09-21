import type {ReactNode, KeyboardEvent, MouseEvent, Ref} from "react";
import {Card} from "@coreModule/components/ui/card.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {
    CARD_SHELL_CLASS,
    CARD_SHELL_CLICKABLE_CLASS,
    DASHBOARD_SELECTABLE_RING,
} from "@coreModule/components/entityPage/list/entityCard.constants.ts";
import {openActionMenuFromContextMenu} from "@coreModule/components/viewEngine/widgets/actions/menu/openActionMenuFromContextMenu.ts";

type EntityCardShellProps = {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    /**
     * Pass only for cards that toggle something (dashboard drill-down). Presence
     * is what makes the card a toggle: it renders `aria-pressed` and rings the
     * card when on. Leave it off and the card is a plain one.
     */
    isSelected?: boolean;
    /** Disable pointer cursor (e.g. fetch-only preview). */
    disableClick?: boolean;
    ref?: Ref<HTMLDivElement>;
};

const FOCUS_RING_CLASS =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Nested controls (filters, menus, pagination) must not activate the card sheet. */
const NESTED_INTERACTIVE_SELECTOR = [
    "button",
    "a",
    "input",
    "textarea",
    "select",
    "label",
    "[role=combobox]",
    "[role=option]",
    "[role=listbox]",
    "[role=checkbox]",
    "[role=switch]",
    "[role=menuitem]",
    "[role=tab]",
    "[data-slot=button]",
    "[data-slot=checkbox]",
    "[data-slot=dropdown-menu-trigger]",
    "[data-slot=popover-trigger]",
].join(",");

function eventTargetElement(target: EventTarget | null): Element | null {
    if (target instanceof Element) return target;
    if (target instanceof Node) return target.parentElement;
    return null;
}

function isNestedInteractiveTarget(event: MouseEvent<HTMLDivElement>): boolean {
    const currentTarget = event.currentTarget;
    const path = event.nativeEvent.composedPath();
    for (const node of path) {
        if (node === currentTarget) break;
        if (node instanceof Element && node.matches(NESTED_INTERACTIVE_SELECTOR)) return true;
    }
    const el = eventTargetElement(event.target);
    if (!el) return false;
    const hit = el.closest(NESTED_INTERACTIVE_SELECTOR);
    return !!hit && hit !== currentTarget && currentTarget.contains(hit);
}

function handleActivationKeyDown(
    e: KeyboardEvent<HTMLDivElement>,
    onClick?: () => void,
) {
    /*
     * Only self-originated keys activate the card. Cards embed their own
     * controls (action menu trigger, carousel arrows); without this guard,
     * Space on a nested button would also open the entity sheet behind it.
     */
    if (e.target !== e.currentTarget) return;
    if (onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onClick();
    }
}

function handleActivationClick(
    e: MouseEvent<HTMLDivElement>,
    onClick?: () => void,
) {
    if (!onClick) return;
    if (isNestedInteractiveTarget(e)) return;
    onClick();
}

export function EntityCardShell({
    children,
    className,
    onClick,
    isSelected,
    disableClick = false,
    ref,
}: EntityCardShellProps) {
    const interactive = !!onClick && !disableClick;

    /*
     * Every card with an `onClick` is keyboard-reachable, selectable or not: the
     * card is the sole route into an entity's sheet view, so gating focus on a
     * mode flag made whole entity lists mouse-only.
     *
     * `aria-pressed` is undefined unless the caller passes `isSelected`, so only
     * real toggles announce themselves as pressed.
     */
    return (
        <Card
            ref={ref}
            {...(interactive
                ? {
                      role: "button",
                      tabIndex: 0,
                      onClick: (e: MouseEvent<HTMLDivElement>) =>
                          handleActivationClick(e, onClick),
                      onContextMenu: openActionMenuFromContextMenu,
                      onKeyDown: (e: KeyboardEvent<HTMLDivElement>) =>
                          handleActivationKeyDown(e, onClick),
                  }
                : {})}
            aria-pressed={isSelected}
            className={cn(
                interactive ? CARD_SHELL_CLICKABLE_CLASS : CARD_SHELL_CLASS,
                interactive && FOCUS_RING_CLASS,
                isSelected && DASHBOARD_SELECTABLE_RING,
                className,
            )}
        >
            {children}
        </Card>
    );
}
