import type {MouseEvent, ReactNode} from "react";
import {
    CardAction,
    CardHeader,
    CardTitle,
} from "@coreModule/components/ui/card.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {ACTION_MENU_PIN_WHEN_GALLERY} from "@baseModule/components/entityPage/list/entityCard.constants.ts";

type EntityTextCardHeaderProps = {
    /** Left tile: avatar, MdiIcon box, or Tabler icon wrapper. */
    iconTile?: ReactNode;
    /** Already access-gated by the caller — `EntityCard.Header` passes a `DisplayValue`. */
    title: ReactNode;
    subtitle?: ReactNode;
    badges?: ReactNode;
    actionMenu?: ReactNode;
    hideActions?: boolean;
    className?: string;
};

/**
 * Header row for text-first entity cards: optional icon tile, title, badges,
 * inline action menu.
 *
 * Title + subtitle share one flex column (so an icon tile can sit beside both).
 * Subtitle is intentionally NOT `CardDescription`: CardHeader's
 * `has-data-[slot=card-description]:grid-rows-[auto_auto]` assumes description
 * is a grid sibling of the title, which collapsed the title block to one row
 * and made headers with subtitles look cramped/clipped.
 */
export function EntityCardHeader({
    iconTile,
    title,
    subtitle,
    badges,
    actionMenu,
    hideActions = false,
    className,
}: EntityTextCardHeaderProps) {

    const showSubtitleRow = subtitle != null;
    const hasBadges = badges != null;
    const showActions = !hideActions && actionMenu != null;

    return (
        <CardHeader className={cn(
            "gap-1.5 px-2 pt-2 pb-1 items-start",
            "group-has-data-[slot=gallery-carousel]/card:grid-cols-1 rounded-none",
            className,
        )}>
            <div className={cn("flex min-w-0 gap-2", showSubtitleRow || hasBadges ? "items-start" : "items-center")}>
                {iconTile != null && (
                    <div className="flex shrink-0 items-center justify-center self-center leading-none">
                        {iconTile}
                    </div>
                )}
                {/*
                  * No `HiddenElement` wrappers here. Each slot arrives already gated — `title`
                  * and `subtitle` are `DisplayValue`s that mask themselves — so the wrappers were
                  * pass-throughs that still paid for `withLanguage` (a store subscription and a
                  * dictionary load) three times per card. The badge row also used to render a
                  * blurred placeholder for cards that simply had no badges.
                  */}
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <div className="flex min-w-0 items-center gap-1">
                        <CardTitle className="min-w-0 truncate text-lg leading-snug font-semibold">
                            {title}
                        </CardTitle>
                    </div>
                    {showSubtitleRow && (
                        <p className="truncate text-xs leading-snug text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                    {hasBadges && (
                        <div className="flex flex-wrap items-center gap-1.5">{badges}</div>
                    )}
                </div>
            </div>
            {showActions && (
                <CardAction className={cn("-mr-1 self-start", ACTION_MENU_PIN_WHEN_GALLERY)}>
                    <div
                        className={cn("shrink-0 flex justify-end", className)}
                        onClick={(e: MouseEvent) => e.stopPropagation()}
                        role="presentation"
                    >
                        {actionMenu}
                    </div>
                </CardAction>
            )}
        </CardHeader>
    );
}
