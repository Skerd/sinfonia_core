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
    /** When false, the subtitle row is masked. The row is omitted unless `subtitle` is passed. */
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
    const showSubtitleRow = subtitle != null;
    const hasBadges = badges != null;
    const showActions = !hideActions && actionMenu != null;

    return (
        <CardHeader className={cn("gap-1.5 px-2 pt-2 pb-1", !showSubtitleRow && "items-center", className)}>
            <div className={cn("flex min-w-0 gap-2", showSubtitleRow ? "items-start" : "items-center")}>
                {iconTile != null && (
                    <div className="flex shrink-0 items-center justify-center self-center leading-none">
                        {iconTile}
                    </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <div className="flex min-w-0 items-center gap-1">
                        <CardTitle className="min-w-0 truncate  text-lg leading-snug font-semibold">
                            <HiddenElement randomLength={10}>
                                {showTitle ? title : null}
                            </HiddenElement>
                        </CardTitle>
                        {titleExtra}
                    </div>
                    {showSubtitleRow && (
                        <p className="truncate text-xs leading-snug text-muted-foreground">
                            <HiddenElement randomLength={8}>
                                {showSubtitle ? subtitle : null}
                            </HiddenElement>
                        </p>
                    )}
                    {(hasBadges || !showBadges) && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            <HiddenElement randomLength={6}>
                                {showBadges && hasBadges ? badges : null}
                            </HiddenElement>
                        </div>
                    )}
                </div>
            </div>
            {showActions && (
                <CardAction className={cn("-mr-1", showSubtitleRow ? "row-span-2" : "row-span-1 self-center")}>
                    <EntityCardActionMenu variant="inline">{actionMenu}</EntityCardActionMenu>
                </CardAction>
            )}
        </CardHeader>
    );
}
