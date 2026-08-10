import type {ReactNode} from "react";
import {
    CardAction,
    CardHeader,
    CardTitle,
} from "@coreModule/components/ui/card.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {EntityCardActionMenu} from "./EntityCardActionMenu.tsx";

type EntityTextCardHeaderProps = {
    /** Left tile: avatar, MdiIcon box, or Tabler icon wrapper. */
    iconTile?: ReactNode;
    title: ReactNode;
    subtitle?: ReactNode;
    badges?: ReactNode;
    titleExtra?: ReactNode;
    actionMenu?: ReactNode;
    hideActions?: boolean;
    className?: string;
    /** When false, title is masked with HiddenElement (city-style field permission). */
    showTitle?: boolean;
    /** When false, subtitle is masked with HiddenElement (permission denied). Omit / leave true when the card has no subtitle. */
    showSubtitle?: boolean;
    /** When false, badges are masked with HiddenElement. */
    showBadges?: boolean;
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
export function EntityTextCardHeader({
    iconTile,
    title,
    subtitle,
    badges,
    titleExtra,
    actionMenu,
    hideActions = false,
    className,
    showTitle = true,
    showSubtitle = true,
    showBadges = true,
}: EntityTextCardHeaderProps) {
    const hasSubtitle = subtitle != null && subtitle !== "";
    const hasBadges = badges != null;
    const showActions = !hideActions && actionMenu != null;

    return (
        <CardHeader className={cn("gap-1.5 px-2 pt-2 pb-1", className)}>
            <div className="flex min-w-0 items-start gap-2">
                {iconTile != null && <div className="shrink-0 self-center">{iconTile}</div>}
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <div className="flex min-w-0 items-center gap-1">
                        <CardTitle className="min-w-0 truncate text-sm leading-snug font-semibold">
                            <HiddenElement randomLength={10}>
                                {showTitle ? title : null}
                            </HiddenElement>
                        </CardTitle>
                        {titleExtra}
                    </div>
                    {(hasSubtitle || !showSubtitle) && (
                        <p className="truncate text-xs leading-snug text-muted-foreground">
                            <HiddenElement randomLength={8}>
                                {showSubtitle && hasSubtitle ? subtitle : null}
                            </HiddenElement>
                        </p>
                    )}
                </div>
            </div>
            {showActions && (
                <CardAction className="-mr-1">
                    <EntityCardActionMenu variant="inline">{actionMenu}</EntityCardActionMenu>
                </CardAction>
            )}
            {(hasBadges || !showBadges) && (
                <div className="col-start-1 flex flex-wrap items-center gap-1.5">
                    <HiddenElement randomLength={6}>
                        {showBadges && hasBadges ? badges : null}
                    </HiddenElement>
                </div>
            )}
        </CardHeader>
    );
}
