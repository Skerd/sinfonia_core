import type {ReactNode, KeyboardEvent, MouseEvent, Ref} from "react";
import {Card} from "@coreModule/components/ui/card.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {
    CARD_SHELL_CLASS,
    CARD_SHELL_CLICKABLE_CLASS,
    DASHBOARD_SELECTABLE_RING,
} from "./entityCard.constants.ts";
import {openActionMenuFromContextMenu} from "@coreModule/components/custom/actions/menu/openActionMenuFromContextMenu.ts";

type EntityCardShellProps = {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    /** Dashboard / overview selectable card. */
    selectable?: boolean;
    isSelected?: boolean;
    /** Disable pointer cursor (e.g. fetch-only preview). */
    disableClick?: boolean;
    ref?: Ref<HTMLDivElement>;
};

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
    selectable = false,
    isSelected = false,
    disableClick = false,
    ref,
}: EntityCardShellProps) {
    const interactive = !!onClick && !disableClick;

    /*
     * Both branches share this. Previously only `selectable` cards were
     * focusable, which made every entity list in the panel mouse-only: the
     * card is the sole route into an entity's sheet view.
     */
    const activationProps = {
        role: "button",
        tabIndex: 0,
        onClick: (e: MouseEvent<HTMLDivElement>) => handleActivationClick(e, onClick),
        onContextMenu: openActionMenuFromContextMenu,
        onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => handleActivationKeyDown(e, onClick),
    } as const;

    if (selectable) {
        return (
            <Card
                ref={ref}
                {...activationProps}
                aria-pressed={isSelected}
                className={cn(
                    CARD_SHELL_CLASS,
                    "cursor-pointer p-5 gap-4 relative overflow-hidden",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isSelected && DASHBOARD_SELECTABLE_RING,
                    className,
                )}
            >
                {children}
            </Card>
        );
    }

    return (
        <Card
            ref={ref}
            {...(interactive ? activationProps : {})}
            className={cn(
                interactive ? CARD_SHELL_CLICKABLE_CLASS : CARD_SHELL_CLASS,
                interactive &&
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                className,
            )}
        >
            {children}
        </Card>
    );
}
