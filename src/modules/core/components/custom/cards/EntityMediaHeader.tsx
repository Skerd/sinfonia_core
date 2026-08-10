import type {ReactNode} from "react";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {MEDIA_CAROUSEL_CLASS} from "./entityCard.constants.ts";
import {EntityCardActionMenu} from "./EntityCardActionMenu.tsx";

type EntityMediaHeaderProps = {
    carouselKey: string;
    showMedia: boolean;
    gallery: ReactNode;
    title?: string | null;
    subtitle?: string | null;
    /** When false, title is masked with HiddenElement (city-style field permission). */
    showTitle?: boolean;
    /** When false, subtitle is masked with HiddenElement. */
    showSubtitle?: boolean;
    actionMenu?: ReactNode;
    hideActions?: boolean;
    /** Optional badge overlay (e.g. unit status on image). */
    titleExtra?: ReactNode;
};

export function EntityMediaHeader({
    carouselKey,
    showMedia,
    gallery,
    title,
    subtitle,
    showTitle = true,
    showSubtitle = true,
    actionMenu,
    hideActions = false,
    titleExtra,
}: EntityMediaHeaderProps) {
    const hasTitle = title != null && title !== "";
    const hasSubtitle = subtitle != null && subtitle !== "";
    const hasOverlayText = (showTitle && hasTitle) || hasSubtitle || !showSubtitle;

    return (
        <div className="relative">
            {showMedia && (
                <div className={cn(MEDIA_CAROUSEL_CLASS)} key={carouselKey}>
                    {gallery}
                </div>
            )}

            {hasOverlayText && (
                /*
                 * Text sits on arbitrary photography, so it stays literally white
                 * rather than tokenised. The scrim is a three-stop gradient because
                 * a single from-black/30 was not enough to keep a title legible
                 * over a bright sky.
                 */
                <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-3 pt-10 pb-3">
                    <div className="flex items-end gap-2">
                        <div className="min-w-0 flex-1">
                            <HiddenElement randomLength={10}>
                                {showTitle && hasTitle ? (
                                    <TooltipDisplayer tooltip={title} show>
                                        <p className="line-clamp-1 text-2xl leading-tight font-bold text-overlay-foreground">
                                            {title}
                                        </p>
                                    </TooltipDisplayer>
                                ) : null}
                            </HiddenElement>
                        </div>
                        {titleExtra}
                    </div>
                    {(hasSubtitle || !showSubtitle) && (
                        <div className="mt-0.5">
                            <HiddenElement randomLength={8}>
                                {showSubtitle && hasSubtitle ? (
                                    <p className="line-clamp-1 text-xs leading-tight text-overlay-foreground/80">
                                        {subtitle}
                                    </p>
                                ) : null}
                            </HiddenElement>
                        </div>
                    )}
                </div>
            )}

            {!hideActions && actionMenu != null && (
                <EntityCardActionMenu>{actionMenu}</EntityCardActionMenu>
            )}
        </div>
    );
}
