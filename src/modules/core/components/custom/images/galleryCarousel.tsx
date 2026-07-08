import * as React from "react"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselApi,
    CarouselNext,
    CarouselPrevious,
} from "@coreModule/components/ui/carousel.tsx"
import { Dialog, DialogContent } from "@coreModule/components/ui/dialog.tsx"
import { Media } from "armonia/src/modules/core/types"
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";

function resolveMediaUrl(url: string, media: Media): string {
    return `${url}${media._id}`
}

export type GalleryCarouselPreviewLocation = "top" | "bottom" | "left" | "right"

interface GalleryCarouselProps {
    mediaUrl?: string
    mainImage?: Media
    imageGallery: Media[]
    videoGallery?: Media[]
    showThumbnails?: boolean
    allowFullScreen?: boolean
    coverAfterFirst?: boolean
    /**
     * When true, renders a scrollable strip of square preview tiles for all media.
     * Placement is controlled by `previewLocation`.
     * Prefer `showThumbnails={false}` when using previews to avoid duplicate navigators
     * (especially if both would sit at the bottom).
     */
    showPreviews?: boolean
    /** Where the preview strip appears when `showPreviews` is true. Default `"bottom"`. */
    previewLocation?: GalleryCarouselPreviewLocation
}

type PreviewRailOrientation = "horizontal" | "vertical"
type PreviewRailVariant = "thumbnail" | "preview"

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
    const thumbnailMediaClass = "h-16 w-24 object-cover"
    /** Preview tiles: slightly larger squares; media fills via object-cover on full button box. */
    const previewTileBoxClass = "flex aspect-square size-20 p-0"
    const previewMediaClass = "block h-full w-full object-cover"

    const verticalConstrained =
        !isHorizontal &&
        typeof constrainHeightPx === "number" &&
        constrainHeightPx > 0

    return (
        <div
            ref={railRef}
            className={
                isHorizontal
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
                <button
                    key={item._id}
                    type="button"
                    role="tab"
                    aria-selected={i === selectedIndex}
                    aria-label={`${variant === "preview" ? "Preview" : "Thumbnail"} ${i + 1} of ${media.length}`}
                    onClick={(e) => {
                        if (variant === "preview") {
                            e.preventDefault()
                        }
                        onPick(i)
                    }}
                    className={`shrink-0 overflow-hidden rounded border ${
                        variant === "preview" ? `${previewTileBoxClass} ` : ""
                    }${
                        i === selectedIndex ? "border-primary" : "border-muted"
                    }`}
                >
                    {item.mime.includes("video") ? (
                        <video
                            src={resolveMediaUrl(mediaUrl, item)}
                            muted
                            preload="metadata"
                            className={
                                variant === "preview"
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
                                variant === "preview"
                                    ? previewMediaClass
                                    : thumbnailMediaClass
                            }
                        />
                    )}
                </button>
            ))}
        </div>
    )
}

export function GalleryCarousel({
    mediaUrl = "/api/auxiliary/media/",
    mainImage,
    imageGallery,
    videoGallery = [],
    showThumbnails = true,
    allowFullScreen = true,
    coverAfterFirst = false,
    showPreviews = false,
    previewLocation = "right",
}: GalleryCarouselProps) {
    const media = React.useMemo<Media[]>(
        () => [...(mainImage ? [mainImage] : []), ...videoGallery, ...imageGallery],
        [mainImage, imageGallery, videoGallery]
    )

    const [open, setOpen] = React.useState(false)
    const [index, setIndex] = React.useState(-1)
    const [api, setApi] = React.useState<CarouselApi | null>(null)
    const [aspectRatio, setAspectRatio] = React.useState<number | null>(null)
    const [fullscreenIndex, setFullscreenIndex] = React.useState(0)
    const [fullscreenApi, setFullscreenApi] = React.useState<CarouselApi | null>(null)

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

    /* ---------------- Resolve main image aspect ratio ---------------- */
    React.useEffect(() => {
        if (!media?.length) {
            setAspectRatio(null)
            return
        }

        setAspectRatio(null)
        const mainMedia = media[0]
        const url = resolveMediaUrl(mediaUrl, mainMedia)

        if (mainMedia.mime?.includes("image")) {
            const img = new Image()
            img.src = url
            img.onload = () => {
                setAspectRatio(img.naturalWidth / img.naturalHeight)
            }
            return () => {
                img.onload = null
            }
        }

        if (mainMedia.mime?.includes("video")) {
            const video = document.createElement("video")
            video.src = url
            video.preload = "metadata"
            video.onloadedmetadata = () => {
                setAspectRatio(video.videoWidth / video.videoHeight)
            }
            return () => {
                video.onloadedmetadata = null
            }
        }
    }, [media, mediaUrl])

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

    const mainCarouselContent = React.useMemo(() => {
        if (!media?.length || aspectRatio == null) return null
        return (
            <CarouselContent>
                {media.map((item, i) => (
                    <CarouselItem key={item._id}>
                        <button
                            type="button"
                            className="w-full h-full"
                            onClick={() => {
                                setIndex(i)
                                api?.scrollTo(i)
                                if (allowFullScreen) setOpen(true)
                            }}
                            aria-label={`View media ${i + 1} of ${media.length}`}
                        >
                            <div
                                className="relative w-full h-full"
                                style={{ aspectRatio }}
                            >
                                {item.mime.includes("video") ? (
                                    <video
                                        ref={setVideoRef(i, false)}
                                        autoPlay={i === 0}
                                        src={resolveMediaUrl(mediaUrl, item)}
                                        aria-label={item.name ?? "Gallery video"}
                                        controls
                                        muted
                                        playsInline
                                        preload="metadata"
                                        className={
                                            mediaClassBase +
                                            (coverAfterFirst
                                                ? "object-cover"
                                                : "object-contain")
                                        }
                                    />
                                ) : (
                                    <img
                                        src={resolveMediaUrl(mediaUrl, item)}
                                        alt={item.name ?? ""}
                                        className={
                                            mediaClassBase +
                                            (coverAfterFirst
                                                ? "object-cover"
                                                : "object-contain")
                                        }
                                    />
                                )}
                            </div>
                        </button>
                    </CarouselItem>
                ))}
            </CarouselContent>
        )
    }, [
        media,
        aspectRatio,
        mediaUrl,
        coverAfterFirst,
        allowFullScreen,
        setVideoRef,
        api,
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
        </Carousel>
    )

    const isRowRoot = showPreviews && previewRailVertical

    /** Left/right: shell matches slide aspect ratio so height equals rendered media box. */
    const carouselShellClassName = isRowRoot
        ? "relative w-full min-h-0 min-w-0 shrink-0 overflow-hidden"
        : "relative min-h-0 min-w-0 flex-1"
    const carouselShellStyle: React.CSSProperties | undefined =
        isRowRoot && aspectRatio != null
            ? { aspectRatio: `${aspectRatio}` }
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

    const rootClassName = isRowRoot ? "flex h-full min-h-0 min-w-0 w-full flex-row items-start" : "flex h-full min-h-0 min-w-0 w-full flex-col"

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

    if( media.length === 0 ) return <ValueNotSet />

    if (!aspectRatio) return null

    return (
        <div className={rootClassName}>
            {layoutBody}
            {allowFullScreen && (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="max-w-6xl border-none p-0 overflow-hidden">
                        <Carousel
                            opts={{ startIndex: index }}
                            setApi={setFullscreenApi}
                        >
                            <CarouselContent>
                                {media.map((item, i) => (
                                    <CarouselItem key={item._id}>
                                        <div className="max-h-[85vh] w-full">
                                            <div
                                                className="relative w-full h-full"
                                                style={{
                                                    aspectRatio:
                                                        aspectRatio ?? undefined,
                                                }}
                                            >
                                                {item.mime.includes("video") ? (
                                                    <video
                                                        ref={setVideoRef(i, true)}
                                                        autoPlay={
                                                            i === fullscreenIndex
                                                        }
                                                        src={resolveMediaUrl(
                                                            mediaUrl,
                                                            item
                                                        )}
                                                        aria-label={
                                                            item.name ??
                                                            "Gallery video fullscreen"
                                                        }
                                                        controls
                                                        muted
                                                        playsInline
                                                        preload="metadata"
                                                        className={
                                                            mediaClassBase +
                                                            (coverAfterFirst
                                                                ? "object-cover"
                                                                : "object-contain")
                                                        }
                                                    />
                                                ) : (
                                                    <img
                                                        src={resolveMediaUrl(
                                                            mediaUrl,
                                                            item
                                                        )}
                                                        alt={item.name ?? ""}
                                                        className={
                                                            mediaClassBase +
                                                            (coverAfterFirst
                                                                ? "object-cover"
                                                                : "object-contain")
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                        </Carousel>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
