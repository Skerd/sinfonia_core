import * as React from "react"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselApi,
    CarouselNext,
    CarouselPrevious,
} from "@coreModule/components/ui/carousel.tsx"
import { Dialog, DialogContent, DialogTitle } from "@coreModule/components/ui/dialog.tsx"
import { Button } from "@coreModule/components/ui/button.tsx"
import { UiTexts } from "@coreModule/components/ui/ui-texts.tsx"
import { cn } from "@coreModule/components/lib/utils.ts"

const LANGUAGE_PATH = "src/modules/core/components/viewEngine/widgets/gallery/galleryDialog.tsx"
const ENGLISH = {
    gallery: "Gallery",
    previews: "Gallery previews",
    thumbnails: "Gallery thumbnails",
    preview: "Preview {number} of {total}",
    thumbnail: "Thumbnail {number} of {total}",
} as const

/**
 * One photo or video the gallery shows. Callers resolve the URL: the panel from a Media id, a public
 * site from its public media URL (which carries no extension, so `video` says what it is).
 */
export type GalleryMediaItem = {
    key: string
    src: string
    video: boolean
    name?: string
}

export type GalleryImageComponent = React.ComponentType<{
    src: string
    alt: string
    className: string
}>

type PreviewRailOrientation = "horizontal" | "vertical"
type PreviewRailVariant = "thumbnail" | "preview" | "square"

function numbered(template: string, index: number, total: number): string {
    return template.replace("{number}", String(index + 1)).replace("{total}", String(total))
}

export function GalleryPreviewRail({
    items,
    selectedIndex,
    onPick,
    orientation,
    variant,
    /** When set (vertical rail only), height matches the main carousel / image viewport. */
    constrainHeightPx,
}: {
    items: GalleryMediaItem[]
    selectedIndex: number
    onPick: (i: number) => void
    orientation: PreviewRailOrientation
    variant: PreviewRailVariant
    constrainHeightPx?: number | null
}) {
    const railRef = React.useRef<HTMLDivElement>(null)

    React.useLayoutEffect(() => {
        const el = railRef.current?.querySelector<HTMLElement>(
            '[role="tab"][aria-selected="true"]'
        )
        el?.scrollIntoView({ block: "nearest", inline: "nearest" })
    }, [selectedIndex, items])

    const isHorizontal = orientation === "horizontal"
    const isSquare = variant === "square"
    const thumbnailMediaClass = "h-16 w-24 object-cover"
    /** Preview tiles: slightly larger squares; media fills via object-cover on full button box. */
    const previewTileBoxClass = "flex aspect-square size-20 p-0"
    const previewMediaClass = "block h-full w-full object-cover"
    const squareMediaClass = "block size-full object-cover"
    const mediaClass = isSquare
        ? squareMediaClass
        : variant === "preview"
          ? previewMediaClass
          : thumbnailMediaClass

    const verticalConstrained =
        !isHorizontal &&
        typeof constrainHeightPx === "number" &&
        constrainHeightPx > 0

    return (
        <UiTexts path={LANGUAGE_PATH} english={ENGLISH}>
            {(text) => (
                <div
                    ref={railRef}
                    className={
                        isSquare
                            ? "mx-auto flex w-fit max-w-full shrink-0 flex-row gap-2 overflow-x-auto px-1 py-1"
                            : isHorizontal
                            ? "flex shrink-0 flex-row gap-2 overflow-x-auto px-2 py-0.5"
                            : verticalConstrained
                              ? "flex min-h-0 w-22 shrink-0 flex-col gap-2 overflow-y-auto overflow-x-hidden px-1 py-0.5"
                              : "flex min-h-0 max-h-full w-22 shrink-0 flex-col gap-2 overflow-y-auto overflow-x-hidden px-1 py-2"
                    }
                    style={
                        verticalConstrained
                            ? {
                                  height: constrainHeightPx,
                                  maxHeight: constrainHeightPx,
                              }
                            : undefined
                    }
                    role="tablist"
                    aria-label={text(variant === "preview" ? "previews" : "thumbnails")}
                >
                    {items.map((item, i) => (
                        <Button variant="bare"
                            key={item.key}
                            type="button"
                            role="tab"
                            aria-selected={i === selectedIndex}
                            aria-label={numbered(text(variant === "preview" ? "preview" : "thumbnail"), i, items.length)}
                            onClick={(e) => {
                                if (variant === "preview" || variant === "square") {
                                    e.preventDefault()
                                }
                                onPick(i)
                            }}
                            className={cn(
                                "shrink-0 overflow-hidden border p-0",
                                isSquare ? "size-14 rounded-lg" : "rounded",
                                variant === "preview" && previewTileBoxClass,
                                i === selectedIndex ? "border-primary" : "border-muted",
                                isSquare && i === selectedIndex && "border-2",
                            )}
                        >
                            {item.video ? (
                                <video
                                    src={item.src}
                                    muted
                                    preload="metadata"
                                    className={mediaClass}
                                    aria-hidden
                                />
                            ) : (
                                <img src={item.src} alt="" className={mediaClass} />
                            )}
                        </Button>
                    ))}
                </div>
            )}
        </UiTexts>
    )
}

/**
 * The large media viewer of the sheet gallery: one item at a time, arrows, and the others as small
 * squares under it. Its colours are the app's tokens, so a public site shows it in its own theme.
 */
export function GalleryDialog({
    items,
    open,
    onOpenChange,
    startIndex,
    title,
    imageComponent,
}: {
    items: GalleryMediaItem[]
    open: boolean
    onOpenChange: (open: boolean) => void
    /** The item shown first each time the dialog opens. */
    startIndex: number
    /** Screen-reader name of the dialog; "Gallery" when not given. */
    title?: string
    /** Draws the images instead of a plain `<img>` (e.g. logos inverted in dark mode). */
    imageComponent?: GalleryImageComponent
}) {
    const firstIndex = Math.min(Math.max(0, startIndex), Math.max(0, items.length - 1))
    const [currentIndex, setCurrentIndex] = React.useState(firstIndex)
    const [api, setApi] = React.useState<CarouselApi | null>(null)
    const videoRefs = React.useRef<Map<number, HTMLVideoElement>>(new Map())
    // Radix returns focus only to a DialogTrigger; the gallery opens from its own photo buttons (as DialogFrame does).
    const openerRef = React.useRef<HTMLElement | null>(null)

    const pickSlide = React.useCallback(
        (i: number) => {
            setCurrentIndex(i)
            api?.scrollTo(i)
        },
        [api]
    )

    React.useEffect(() => {
        if (open) setCurrentIndex(firstIndex)
    }, [open, firstIndex])

    React.useEffect(() => {
        if (!api) return
        const onSelect = () => setCurrentIndex(api.selectedScrollSnap())
        api.on("select", onSelect)
        return () => {
            api.off("select", onSelect)
        }
    }, [api])

    /* Only the item on screen plays; closing the dialog stops it. */
    React.useEffect(() => {
        videoRefs.current.forEach((video, videoIndex) => {
            if (video && (!open || videoIndex !== currentIndex)) video.pause()
        })
        if (!open) return
        videoRefs.current.get(currentIndex)?.play().catch(() => {
            /* Autoplay may be blocked by browser policy */
        })
    }, [currentIndex, open])

    const setVideoRef = React.useCallback(
        (mediaIndex: number) => (el: HTMLVideoElement | null) => {
            if (el) videoRefs.current.set(mediaIndex, el)
            else videoRefs.current.delete(mediaIndex)
        },
        []
    )

    const mediaClass = "max-h-full max-w-full object-contain"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-auto max-w-[min(96vw,80rem)] gap-0 border-none bg-background p-3 sm:max-w-[min(96vw,80rem)]"
                aria-describedby={undefined}
                onOpenAutoFocus={() => {
                    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
                }}
                onCloseAutoFocus={(event) => {
                    event.preventDefault()
                    openerRef.current?.focus()
                }}
            >
                <DialogTitle className="sr-only">
                    {title ?? <UiTexts path={LANGUAGE_PATH} english={ENGLISH}>{(text) => text("gallery")}</UiTexts>}
                </DialogTitle>
                <div className="flex w-[min(92vw,76rem)] flex-col gap-3">
                    <Carousel
                        className="w-full"
                        opts={{ startIndex: firstIndex }}
                        setApi={setApi}
                    >
                        <CarouselContent>
                            {items.map((item, i) => (
                                <CarouselItem key={item.key}>
                                    <div className="flex h-[min(75vh,48rem)] w-full items-center justify-center">
                                        {item.video ? (
                                            <video
                                                ref={setVideoRef(i)}
                                                autoPlay={i === currentIndex}
                                                src={item.src}
                                                aria-label={item.name ?? "Gallery video fullscreen"}
                                                controls
                                                muted
                                                playsInline
                                                preload="metadata"
                                                className={mediaClass}
                                            />
                                        ) : imageComponent ? (
                                            React.createElement(imageComponent, {
                                                src: item.src,
                                                alt: item.name ?? "",
                                                className: mediaClass,
                                            })
                                        ) : (
                                            <img src={item.src} alt={item.name ?? ""} className={mediaClass} />
                                        )}
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        {items.length > 1 && (
                            <>
                                <CarouselPrevious className="left-2" />
                                <CarouselNext className="right-2" />
                            </>
                        )}
                    </Carousel>
                    {items.length > 1 && (
                        <GalleryPreviewRail
                            items={items}
                            selectedIndex={currentIndex}
                            onPick={pickSlide}
                            orientation="horizontal"
                            variant="square"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
