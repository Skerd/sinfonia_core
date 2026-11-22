import {useState} from "react";
import {IconEyeOff} from "@tabler/icons-react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {UiTexts} from "@coreModule/components/ui/ui-texts.tsx";

const LANGUAGE_PATH = "src/modules/core/components/viewEngine/widgets/media/flaggedMedia.tsx";
const ENGLISH = {flagged: "May contain nudity", show: "Show"} as const;

/**
 * Whether a content check status keeps a file covered (D177): flagged and waiting for the platform's review, or removed
 * by it. An approved file is shown as any other.
 */
export function isHeldModerationStatus(status: unknown): boolean {
    return status === "flagged" || status === "rejected";
}

/**
 * Whether the content check holds a file (D177), read from either media shape: the full DTO (`moderation`) or a
 * populated snippet (`metadata.moderation.status`).
 */
export function isFlaggedMedia(media: unknown): boolean {
    if (typeof media !== "object" || media === null) return false;
    const {moderation, metadata} = media as {moderation?: unknown; metadata?: {moderation?: {status?: unknown}}};
    return isHeldModerationStatus(moderation) || isHeldModerationStatus(metadata?.moderation?.status);
}

/** The URL of a flagged file's original: without `reveal=1` the server sends a blurred copy. */
export function revealedMediaSrc(src: string): string {
    return `${src}${src.includes("?") ? "&" : "?"}reveal=1`;
}

/** Flagged files shown during this visit stay shown wherever they appear again (a thumbnail, then its full view). */
const shownThisVisit = new Set<string>();

export const wasShownThisVisit = (src: string): boolean => shownThisVisit.has(src);
export const markShownThisVisit = (src: string): void => {
    shownThisVisit.add(src);
};

/** The URL to load for a file: a flagged one's original once it was shown, else as given (blurred when flagged). */
export function flaggedAwareSrc(src: string, flagged: boolean): string {
    return flagged && wasShownThisVisit(src) ? revealedMediaSrc(src) : src;
}

/** Whether a flagged image is shown, and the action that shows it, shared by every place that displays `src`. */
export function useShowFlagged(src: string | undefined): [boolean, () => void] {
    const [shown, setShown] = useState(() => !!src && wasShownThisVisit(src));
    const show = () => {
        if (src) markShownThisVisit(src);
        setShown(true);
    };
    return [shown || (!!src && wasShownThisVisit(src)), show];
}

/**
 * Covers a flagged image (the server sends it as a blurred copy) with what it is and a button that shows the image
 * itself. The button keeps its click from reaching what is under it (a thumbnail that opens a viewer).
 */
export function FlaggedMediaCover({onShow, compact, className}: {onShow: () => void; compact?: boolean; className?: string}) {
    return (
        <UiTexts path={LANGUAGE_PATH} english={ENGLISH}>
            {(text) => (
                <div
                    data-slot="flagged-media-cover"
                    className={cn("absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/50 p-1 text-center text-foreground", className)}
                >
                    <IconEyeOff className="size-5 shrink-0" aria-hidden/>
                    {!compact && <span className="text-xs font-medium">{text("flagged")}</span>}
                    <Button
                        type="button"
                        size="xs"
                        variant="secondary"
                        aria-label={`${text("show")}: ${text("flagged")}`}
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onShow();
                        }}
                    >
                        {text("show")}
                    </Button>
                </div>
            )}
        </UiTexts>
    );
}
