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
import { Media } from "armonia/src/modules/core/types"
import { cn } from "@coreModule/components/lib/utils.ts";
import {accessFieldPathExists} from "@coreModule/helpers/context/accessContext.tsx";
import {MEDIA_BASE_URL} from "@coreModule/helpers/constants/media.constants.ts";
import {IconPhoto} from "@tabler/icons-react";
import {Button} from "@coreModule/components/ui/button.tsx";

function resolveMediaUrl(url: string, media: Media): string {
    return `${url}${media._id}`
}

/** Stable fallback so `imageGallery={x || []}` / ACL denials do not remount media every render. */
const EMPTY_MEDIA: Media[] = []

export type GalleryCarouselPreviewLocation = "top" | "bottom" | "left" | "right"

interface GalleryCarouselProps {
    mediaUrl?: string
    mainImage?: Media
    imageGallery: Media[]
    videoGallery?: Media[]
    showThumbnails?: boolean
    allowFullScreen?: boolean
    coverAfterFirst?: boolean
    modifyImagesOnDarkMode?: React.ComponentType<{
        src: string
        alt: string
        className: string
    }>
    /**
     * When true, renders a scrollable strip of square preview tiles for all media.
     * Placement is controlled by `previewLocation`.
     * Prefer `showThumbnails={false}` when using previews to avoid duplicate navigators
     * (especially if both would sit at the bottom).
     */
    showPreviews?: boolean
    /** Where the preview strip appears when `showPreviews` is true. Default `"bottom"`. */
    previewLocation?: GalleryCarouselPreviewLocation
    /**
     * When set (width/height), skip natural media aspect and use this ratio.
     * `1` renders a square — used for logos and other fixed tiles.
     */
    forcedAspectRatio?: number
    /**
     * Sheet only. The slide keeps the photo's ratio, but the frame stops at
     * {@link SHEET_HERO_MAX_HEIGHT} so a portrait does not fill a wide panel.
     * Click still opens the fullscreen dialog. Cards leave this off.
     */
    capHero?: boolean
    className?: string
}

/** Tallest the sheet hero may grow. Matches `max-h-[28rem]`. */
const SHEET_HERO_MAX_HEIGHT = "28rem"

type PreviewRailOrientation = "horizontal" | "vertical"
type PreviewRailVariant = "thumbnail" | "preview" | "square"

function GalleryPreviewRail({
    media,
    mediaUrl,
    selectedIndex,
    onPick,
    orientation,
    variant,
    ariaLabel,
    /** When set (vertical rail only), height matches the main carousel / image viewport. */
    constrainHeightPx,
}: {
    media: Media[]
    mediaUrl: string
    selectedIndex: number
    onPick: (i: number) => void
    orientation: PreviewRailOrientation
    variant: PreviewRailVariant
    ariaLabel: string
    constrainHeightPx?: number | null
}) {
    const railRef = React.useRef<HTMLDivElement>(null)

    React.useLayoutEffect(() => {
        const el = railRef.current?.querySelector<HTMLElement>(
            '[role="tab"][aria-selected="true"]'
        )
        el?.scrollIntoView({ block: "nearest", inline: "nearest" })
    }, [selectedIndex, media])

    const isHorizontal = orientation === "horizontal"
    const isSquare = variant === "square"
    const thumbnailMediaClass = "h-16 w-24 object-cover"
    /** Preview tiles: slightly larger squares; media fills via object-cover on full button box. */
    const previewTileBoxClass = "flex aspect-square size-20 p-0"
    const previewMediaClass = "block h-full w-full object-cover"
    const squareMediaClass = "block size-full object-cover"

    const verticalConstrained =
        !isHorizontal &&
        typeof constrainHeightPx === "number" &&
        constrainHeightPx > 0

    return (
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
            aria-label={ariaLabel}
        >
            {media.map((item, i) => (
                <Button variant="bare"
                    key={item._id}
                    type="button"
                    role="tab"
                    aria-selected={i === selectedIndex}
                    aria-label={`${variant === "preview" ? "Preview" : "Thumbnail"} ${i + 1} of ${media.length}`}
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
                    {item.mime.includes("video") ? (
                        <video
                            src={resolveMediaUrl(mediaUrl, item)}
                            muted
                            preload="metadata"
                            className={
                                isSquare
                                    ? squareMediaClass
                                    : variant === "preview"
                                      ? previewMediaClass
                                      : thumbnailMediaClass
                            }
                            aria-hidden
                        />
                    ) : (
                        <img
                            src={resolveMediaUrl(mediaUrl, item)}
                            alt=""
                            className={
                                isSquare
                                    ? squareMediaClass
                                    : variant === "preview"
                                      ? previewMediaClass
                                      : thumbnailMediaClass
                            }
                        />
                    )}
                </Button>
            ))}
        </div>
    )
}

export function GalleryCarousel({
    mediaUrl = MEDIA_BASE_URL,
    mainImage,
    imageGallery,
    videoGallery,
    showThumbnails = true,
    allowFullScreen = true,
    coverAfterFirst = false,
    modifyImagesOnDarkMode,
    showPreviews = false,
    previewLocation = "right",
    forcedAspectRatio,
    capHero = false,
    className,
}: GalleryCarouselProps) {
    const images = imageGallery?.length ? imageGallery : EMPTY_MEDIA
    const videos = videoGallery?.length ? videoGallery : EMPTY_MEDIA
    const media = React.useMemo<Media[]>(
        () => [...(mainImage ? [mainImage] : []), ...videos, ...images],
        [mainImage, images, videos]
    )
    const leadMedia = media[0]
    const leadUrl = leadMedia ? resolveMediaUrl(mediaUrl, leadMedia) : null

    const [open, setOpen] = React.useState(false)
    const [index, setIndex] = React.useState(-1)
    const [api, setApi] = React.useState<CarouselApi | null>(null)
    const [detectedAspectRatio, setDetectedAspectRatio] = React.useState<number | null>(null)
    const forcedRatio =
        typeof forcedAspectRatio === "number" && Number.isFinite(forcedAspectRatio) && forcedAspectRatio > 0
            ? forcedAspectRatio
            : null
    const aspectRatio = forcedRatio ?? detectedAspectRatio
    const [fullscreenIndex, setFullscreenIndex] = React.useState(0)
    const [fullscreenApi, setFullscreenApi] = React.useState<CarouselApi | null>(null)
    /** Keep showing the last ratio while the same lead URL reloads — avoids empty-frame twitch on parent re-render. */
    const measuredLeadUrlRef = React.useRef<string | null>(null)

    // Refs for video elements in main carousel
    const videoRefs = React.useRef<Map<number, HTMLVideoElement>>(new Map())
    // Refs for video elements in fullscreen dialog
    const fullscreenVideoRefs = React.useRef<Map<number, HTMLVideoElement>>(new Map())

    const pickSlide = React.useCallback(
        (i: number) => {
            setIndex(i)
            api?.scrollTo(i)
        },
        [api]
    )

    const pickFullscreenSlide = React.useCallback(
        (i: number) => {
            setFullscreenIndex(i)
            fullscreenApi?.scrollTo(i)
        },
        [fullscreenApi]
    )

    /* ---------------- Resolve main image aspect ratio ---------------- */
    React.useEffect(() => {
        if (forcedRatio != null) {
            measuredLeadUrlRef.current = null
            setDetectedAspectRatio(null)
            return
        }
        if (!leadMedia || !leadUrl) {
            measuredLeadUrlRef.current = null
            setDetectedAspectRatio(null)
            return
        }

        // Same lead media already measured: keep current ratio. Callers often pass fresh `[]`
        // for empty galleries on each render (menu open, dialog mount), which must not blank the image.
        if (measuredLeadUrlRef.current === leadUrl) return

        setDetectedAspectRatio(null)

        if (leadMedia.mime?.includes("image")) {
            const img = new Image()
            img.src = leadUrl
            img.onload = () => {
                measuredLeadUrlRef.current = leadUrl
                setDetectedAspectRatio(img.naturalWidth / img.naturalHeight)
            }
            return () => {
                img.onload = null
            }
        }

        if (leadMedia.mime?.includes("video")) {
            const video = document.createElement("video")
            video.src = leadUrl
            video.preload = "metadata"
            video.onloadedmetadata = () => {
                measuredLeadUrlRef.current = leadUrl
                setDetectedAspectRatio(video.videoWidth / video.videoHeight)
            }
            return () => {
                video.onloadedmetadata = null
            }
        }
    }, [leadMedia, leadUrl, forcedRatio])

    /* ---------------- Sync main carousel index → state ---------------- */
    React.useEffect(() => {
        if (!api) return
        const onSelect = () => setIndex(api.selectedScrollSnap())
        api.on("select", onSelect)
        return () => {
            api.off("select", onSelect)
        }
    }, [api])

    /* ---------------- Control video playback in main carousel ---------------- */
    React.useEffect(() => {
        videoRefs.current.forEach((video, videoIndex) => {
            if (video && videoIndex !== index) video.pause()
        })
        const currentVideo = videoRefs.current.get(index)
        if (currentVideo) {
            currentVideo.play().catch(() => {
                /* Autoplay may be blocked by browser policy */
            })
        }
    }, [index])

    /* ---------------- Sync fullscreen carousel index → state ---------------- */
    React.useEffect(() => {
        if (!fullscreenApi) return
        const onSelect = () =>
            setFullscreenIndex(fullscreenApi.selectedScrollSnap())
        fullscreenApi.on("select", onSelect)
        return () => {
            fullscreenApi.off("select", onSelect)
        }
    }, [fullscreenApi])

    /* ---------------- Control video playback in fullscreen dialog ---------------- */
    React.useEffect(() => {
        if (!open) {
            // Pause all videos when dialog closes
            fullscreenVideoRefs.current.forEach((video) => {
                if (video) {
                    video.pause()
                }
            })
            return
        }

        // Pause all videos in fullscreen
        fullscreenVideoRefs.current.forEach((video, videoIndex) => {
            if (video && videoIndex !== fullscreenIndex) {
                video.pause()
            }
        })
        // Play current video if it's a video
        const currentVideo = fullscreenVideoRefs.current.get(fullscreenIndex)
        if (currentVideo) {
            currentVideo.play().catch(() => {
                /* Autoplay may be blocked by browser policy */
            })
        }
    }, [fullscreenIndex, open])

    /* ---------------- Sync fullscreen index when dialog opens ---------------- */
    React.useEffect(() => {
        if (open) {
            setFullscreenIndex(index)
        }
    }, [open, index])

    const mediaClassBase =
        "absolute inset-0 m-auto max-w-full max-h-full w-full h-full "
    const setVideoRef = React.useCallback(
        (mediaIndex: number, isFullscreen: boolean) =>
            (el: HTMLVideoElement | null) => {
                const map = isFullscreen ? fullscreenVideoRefs : videoRefs
                if (el) map.current.set(mediaIndex, el)
                else map.current.delete(mediaIndex)
            },
        []
    )

    /** A capped sheet image is a preview. Click opens the dialog even when the view turns fullscreen off. */
    const enlarge = allowFullScreen || capHero

    const mediaObjectClass =
        mediaClassBase +
        (capHero || !coverAfterFirst ? "object-contain" : "object-cover") +
        (enlarge ? "" : " pointer-events-none")

    const mainCarouselContent = React.useMemo(() => {
        if (!media?.length || aspectRatio == null) return null
        return (
            <CarouselContent>
                {media.map((item, i) => {
                    const slide = (
                        <div
                            className={cn(
                                "relative w-full",
                                capHero
                                    ? "h-auto max-h-[28rem] overflow-hidden rounded-md bg-muted"
                                    : "h-full",
                            )}
                            style={
                                capHero
                                    ? {aspectRatio, maxHeight: SHEET_HERO_MAX_HEIGHT}
                                    : {aspectRatio}
                            }
                        >
                            {item.mime.includes("video") ? (
                                <video
                                    ref={setVideoRef(i, false)}
                                    autoPlay={i === 0}
                                    src={resolveMediaUrl(mediaUrl, item)}
                                    aria-label={item.name ?? "Gallery video"}
                                    controls={allowFullScreen}
                                    muted
                                    playsInline
                                    preload="metadata"
                                    className={mediaObjectClass}
                                />
                            ) : modifyImagesOnDarkMode ? (
                                React.createElement(modifyImagesOnDarkMode, {
                                    src: resolveMediaUrl(mediaUrl, item),
                                    alt: item.name ?? "",
                                    className: mediaObjectClass,
                                })
                            ) : (
                                <img
                                    src={resolveMediaUrl(mediaUrl, item)}
                                    alt={item.name ?? ""}
                                    className={mediaObjectClass}
                                />
                            )}
                        </div>
                    )
                    return (
                        <CarouselItem key={item._id}>
                            {enlarge ? (
                                <Button variant="bare"
                                    type="button"
                                    className={cn(
                                        "cursor-zoom-in",
                                        capHero ? "h-auto w-full" : "h-full w-full",
                                    )}
                                    onClick={() => {
                                        setIndex(i)
                                        api?.scrollTo(i)
                                        setOpen(true)
                                    }}
                                    aria-label={`View media ${i + 1} of ${media.length}`}
                                >
                                    {slide}
                                </Button>
                            ) : (
                                <div className={capHero ? "h-auto w-full" : "h-full w-full"}>{slide}</div>
                            )}
                        </CarouselItem>
                    )
                })}
            </CarouselContent>
        )
    }, [
        media,
        aspectRatio,
        mediaUrl,
        coverAfterFirst,
        modifyImagesOnDarkMode,
        allowFullScreen,
        capHero,
        enlarge,
        setVideoRef,
        api,
        mediaObjectClass,
    ])

    const previewRailVertical = previewLocation === "left" || previewLocation === "right"
    const previewOrientation: PreviewRailOrientation = previewRailVertical
        ? "vertical"
        : "horizontal"

    const carouselViewportRef = React.useRef<HTMLDivElement>(null)
    const [carouselViewportHeightPx, setCarouselViewportHeightPx] =
        React.useState<number | null>(null)

    React.useLayoutEffect(() => {
        if (!previewRailVertical || !aspectRatio) {
            setCarouselViewportHeightPx(null)
            return
        }
        const el = carouselViewportRef.current
        if (!el) return
        const sync = () => {
            const h = el.getBoundingClientRect().height
            setCarouselViewportHeightPx(Number.isFinite(h) && h > 0 ? h : null)
        }
        sync()
        const ro = new ResizeObserver(sync)
        ro.observe(el)
        return () => ro.disconnect()
    }, [previewRailVertical, aspectRatio, media.length])

    const previewRailNode =
        showPreviews && media.length > 0 ? (
            <GalleryPreviewRail
                media={media}
                mediaUrl={mediaUrl}
                selectedIndex={index}
                onPick={pickSlide}
                orientation={previewOrientation}
                variant="preview"
                ariaLabel="Gallery previews"
                constrainHeightPx={
                    previewRailVertical ? carouselViewportHeightPx : null
                }
            />
        ) : null

    const thumbnailRailNode =
        showThumbnails && media.length > 0 ? (
            <GalleryPreviewRail
                media={media}
                mediaUrl={mediaUrl}
                selectedIndex={index}
                onPick={pickSlide}
                orientation="horizontal"
                variant="thumbnail"
                ariaLabel="Gallery thumbnails"
            />
        ) : null

    const mainCarousel = (
        <Carousel
            className="h-full w-full min-h-0 min-w-0"
            opts={{ align: "start" }}
            setApi={setApi}
        >
            {mainCarouselContent}
            {media.length > 1 && (
                <>
                    <div
                        onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                        }}
                        role="presentation"
                    >
                        <CarouselPrevious className="left-6" />
                    </div>
                    <div
                        onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                        }}
                        role="presentation"
                    >
                        <CarouselNext className="right-6" />
                    </div>
                </>
            )}
        </Carousel>
    )

    const isRowRoot = showPreviews && previewRailVertical

    /** Left/right: shell matches slide aspect ratio so height equals rendered media box. */
    const carouselShellClassName = isRowRoot
        ? cn(
              "relative w-full min-h-0 min-w-0 shrink-0 overflow-hidden",
              capHero && "max-h-[28rem]",
          )
        : cn("relative min-h-0 min-w-0", capHero ? "max-h-[28rem] shrink-0" : "flex-1")
    const carouselShellStyle: React.CSSProperties | undefined =
        isRowRoot && aspectRatio != null
            ? {
                  aspectRatio: `${aspectRatio}`,
                  ...(capHero ? {maxHeight: SHEET_HERO_MAX_HEIGHT} : {}),
              }
            : capHero
              ? {maxHeight: SHEET_HERO_MAX_HEIGHT}
              : undefined

    const mainColumn = (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div
                ref={carouselViewportRef}
                className={carouselShellClassName}
                style={carouselShellStyle}
            >
                {mainCarousel}
            </div>
            {thumbnailRailNode}
        </div>
    )

    const rootClassName = cn(
        "flex min-h-0 min-w-0 w-full",
        isRowRoot ? "flex-row items-start" : "flex-col",
        capHero ? "h-auto" : "h-full",
    )

    const layoutBody = (() => {
        if (!showPreviews || !previewRailNode) {
            return mainColumn
        }
        switch (previewLocation) {
            case "top":
                return (
                    <>
                        {previewRailNode}
                        {mainColumn}
                    </>
                )
            case "bottom":
                return (
                    <>
                        {mainColumn}
                        {previewRailNode}
                    </>
                )
            case "left":
                return (
                    <>
                        {previewRailNode}
                        {mainColumn}
                    </>
                )
            case "right":
                return (
                    <>
                        {mainColumn}
                        {previewRailNode}
                    </>
                )
            default:
                return mainColumn
        }
    })()

    const root = cn(rootClassName, className)

    if (media.length === 0) {
        return (
            <div
                data-slot="gallery-carousel"
                className={cn(
                    "flex min-h-(--card-media-height) w-full items-center justify-center overflow-hidden bg-linear-to-br from-muted via-muted/70 to-muted/40",
                    className,
                )}
                aria-hidden
            >
                <IconPhoto className="size-10 text-muted-foreground/15" />
            </div>
        )
    }

    if (!aspectRatio) {
        return (
            <div
                data-slot="gallery-carousel"
                className={cn(root, "min-h-(--card-media-height)")}
            />
        )
    }

    return (
        <div data-slot="gallery-carousel" className={root}>
            {layoutBody}
            {enlarge && (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent
                        className="w-auto max-w-[min(96vw,80rem)] gap-0 border-none bg-background p-3 sm:max-w-[min(96vw,80rem)]"
                        aria-describedby={undefined}
                    >
                        <DialogTitle className="sr-only">Gallery</DialogTitle>
                        <div className="flex w-[min(92vw,76rem)] flex-col gap-3">
                        <Carousel
                            className="w-full"
                            opts={{ startIndex: index }}
                            setApi={setFullscreenApi}
                        >
                            <CarouselContent>
                                {media.map((item, i) => (
                                    <CarouselItem key={item._id}>
                                        <div className="flex h-[min(75vh,48rem)] w-full items-center justify-center">
                                            {item.mime.includes("video") ? (
                                                <video
                                                    ref={setVideoRef(i, true)}
                                                    autoPlay={i === fullscreenIndex}
                                                    src={resolveMediaUrl(mediaUrl, item)}
                                                    aria-label={item.name ?? "Gallery video fullscreen"}
                                                    controls
                                                    muted
                                                    playsInline
                                                    preload="metadata"
                                                    className="max-h-full max-w-full object-contain"
                                                />
                                            ) : modifyImagesOnDarkMode ? (
                                                React.createElement(modifyImagesOnDarkMode, {
                                                    src: resolveMediaUrl(mediaUrl, item),
                                                    alt: item.name ?? "",
                                                    className: "max-h-full max-w-full object-contain",
                                                })
                                            ) : (
                                                <img
                                                    src={resolveMediaUrl(mediaUrl, item)}
                                                    alt={item.name ?? ""}
                                                    className="max-h-full max-w-full object-contain"
                                                />
                                            )}
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            {media.length > 1 && (
                                <>
                                    <CarouselPrevious className="left-2" />
                                    <CarouselNext className="right-2" />
                                </>
                            )}
                        </Carousel>
                        {media.length > 1 && (
                            <GalleryPreviewRail
                                media={media}
                                mediaUrl={mediaUrl}
                                selectedIndex={fullscreenIndex}
                                onPick={pickFullscreenSlide}
                                orientation="horizontal"
                                variant="square"
                                ariaLabel="Gallery thumbnails"
                            />
                        )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}

const DEFAULT_GALLERY_READ_PATHS = {
    mainImage: "mainImage",
    imageGallery: "imageGallery",
    videoGallery: "videoGallery",
} as const;

/**
 * Drops gallery props the session cannot read so cards match sheet `#GalleryCarousel`
 * field ACL (and withDebug field toggles).
 */
export function AccessGatedGalleryCarousel({
    read,
    mainImage,
    imageGallery,
    videoGallery,
    mainImagePath = DEFAULT_GALLERY_READ_PATHS.mainImage,
    imageGalleryPath = DEFAULT_GALLERY_READ_PATHS.imageGallery,
    videoGalleryPath = DEFAULT_GALLERY_READ_PATHS.videoGallery,
    ...rest
}: GalleryCarouselProps & {
    read: unknown;
    mainImagePath?: string;
    imageGalleryPath?: string;
    videoGalleryPath?: string;
}) {
    /* No map at all means the caller is not gating; an empty or false one is a real deny. */
    const canRead = (path: string) => read == null || accessFieldPathExists(read, path);
    const canMain = canRead(mainImagePath);
    const canImages = canRead(imageGalleryPath);
    const canVideos = canRead(videoGalleryPath);
    if (!canMain && !canImages && !canVideos) return null;

    return (
        <GalleryCarousel
            {...rest}
            mainImage={canMain ? mainImage : undefined}
            imageGallery={canImages ? imageGallery : EMPTY_MEDIA}
            videoGallery={canVideos ? videoGallery : EMPTY_MEDIA}
        />
    );
}
