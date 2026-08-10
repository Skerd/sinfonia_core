import type {ReactNode, KeyboardEvent} from "react";
import {Card} from "@coreModule/components/ui/card.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {
    CARD_SHELL_CLASS,
    CARD_SHELL_CLICKABLE_CLASS,
    DASHBOARD_SELECTABLE_RING,
} from "./entityCard.constants.ts";

type EntityCardShellProps = {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    /** Dashboard / overview selectable card. */
    selectable?: boolean;
    isSelected?: boolean;
    /** Disable pointer cursor (e.g. fetch-only preview). */
    disableClick?: boolean;
};

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

export function EntityCardShell({
    children,
    className,
    onClick,
    selectable = false,
    isSelected = false,
    disableClick = false,
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
        onClick,
        onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => handleActivationKeyDown(e, onClick),
    } as const;

    if (selectable) {
        return (
            <Card
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
