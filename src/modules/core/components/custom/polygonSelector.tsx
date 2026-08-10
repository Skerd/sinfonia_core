import React, {useState, useRef, useEffect, useLayoutEffect, useMemo} from 'react';
import {createPortal} from 'react-dom';
import {ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Eraser, Undo2} from 'lucide-react';
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Card} from "@coreModule/components/ui/card.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Separator} from "@coreModule/components/ui/separator.tsx";

/** External API: x and y are percentages (0-1) of image dimensions */
export interface PolygonPoint {
    x: number;
    y: number;
}

/** Internal: x,y in pixels; xCoeff,yCoeff as 0-1 */
interface InternalPolygonPoint {
    x: number;
    y: number;
    xCoeff: number;
    yCoeff: number;
}

interface PolygonSelectorProps {
    imageUrl: string;
    imageWidth?: number;
    imageHeight?: number;
    /** Points with x,y as percentages (0-1) */
    initialPoints?: PolygonPoint[];
    /** Other polygons to show grayed out (view only). Each polygon is an array of points with x,y as percentages (0-1) */
    phantomPoints?: {_id: string, name: string, polygonCoordinates: PolygonPoint[]}[];
    onFloorClick?: (floor: any) => void;
    /** Optional content to show when hovering over a phantom polygon (e.g. floor card) */
    phantomHoverContent?: (item: {_id: string, name: string, polygonCoordinates: PolygonPoint[]}) => React.ReactNode;
    /** Fired when pointer enters/leaves a phantom polygon (dashboard hover sync). */
    onPhantomHoverChange?: (id: string | null) => void;
    /** External highlight id (e.g. sidebar hover) — same fill treatment as stayHovered. */
    externalHoveredId?: string;
    onPointsChange: (points: PolygonPoint[]) => void;
    onClosedChange?: (isClosed: boolean) => void;
    disabled?: boolean;
    className?: string;
    dashboard?: boolean;
    stayHovered?: string;
    fillHeight?: boolean;
    /** Strip Card chrome (border/ring/padding) for embedded marketing viewers. */
    borderless?: boolean;
    /** Hide zoom / edit toolbar (marketing viewers). */
    hideControls?: boolean;
    /**
     * How the image fills the stage. `cover` fills the container (crops overflow);
     * polygon math stays aligned. Marketing full-bleed viewers typically want `cover`.
     */
    objectFit?: "contain" | "cover";
    /** Keep phantom polygons faintly visible even when not hovered (marketing explorers). */
    phantomsAlwaysVisible?: boolean;
}

const MIN_ZOOM = 100;
const MAX_ZOOM = 1000;
const ZOOM_STEP = 10;
const EXPANDED_IMAGE_HEIGHT = "1000px";
const COLLAPSED_IMAGE_HEIGHT = "500px";
const IMAGE_PADDING = 10;
const CIRCLE_RADIUS = 8;
const CIRCLE_TEXT = 10;
const MIN_CONTAINER_HEIGHT = 300;
const MAX_CONTAINER_HEIGHT = 1400;

/** True when the ring is closed: at least 3 vertices and last point repeats the first (within float tolerance). */
export function isPolygonRingClosed(pts: PolygonPoint[] | undefined | null, eps = 1e-6): boolean {
    if (!pts || pts.length < 3) return false;
    const f = pts[0];
    const l = pts[pts.length - 1];
    return Math.abs(f.x - l.x) < eps && Math.abs(f.y - l.y) < eps;
}

const ZOOM_RANGES = [
    { min: 100, max: 109, value: 10 },
    { min: 110, max: 209, value: 20 },
    { min: 210, max: 329, value: 30 },
    { min: 330, max: 409, value: 40 },
    { min: 410, max: 509, value: 50 },
    { min: 510, max: 629, value: 60 },
    { min: 630, max: MAX_ZOOM, value: 70 },
];

function getRenderedImageSize(
    naturalWidth: number,
    naturalHeight: number,
    containerWidth: number,
    containerHeight: number,
    objectFit: "contain" | "cover" = "contain",
): { width: number; height: number; left: number; top: number } {
    if (naturalWidth <= 0 || naturalHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) {
        return { width: 0, height: 0, left: 0, top: 0 };
    }
    const imageAspect = naturalWidth / naturalHeight;
    const containerAspect = containerWidth / containerHeight;

    let renderedWidth: number;
    let renderedHeight: number;

    if (objectFit === "cover") {
        if (imageAspect > containerAspect) {
            renderedHeight = containerHeight;
            renderedWidth = containerHeight * imageAspect;
        } else {
            renderedWidth = containerWidth;
            renderedHeight = containerWidth / imageAspect;
        }
    } else if (imageAspect > containerAspect) {
        renderedWidth = containerWidth;
        renderedHeight = containerWidth / imageAspect;
    } else {
        renderedHeight = containerHeight;
        renderedWidth = containerHeight * imageAspect;
    }

    return {
        width: renderedWidth,
        height: renderedHeight,
        left: (containerWidth - renderedWidth) / 2,
        top: (containerHeight - renderedHeight) / 2,
    };
}

/** Generates distinct colors for phantom polygons. Uses golden-angle hue distribution so colors never repeat predictably. */
function getPhantomColor(index: number): { fill: string; stroke: string } {
    const hue = (index * 137.5) % 360; // golden angle gives good spread
    return {
        fill: `hsla(${hue}, 50%, 45%, 0.5)`,
        stroke: `hsl(${hue}, 50%, 45%, 0.5)`,
    };
}

function PolygonSelector({
    imageUrl,
    initialPoints = [],
    phantomPoints = [],
    phantomHoverContent,
    onPhantomHoverChange,
    externalHoveredId = "",
    onFloorClick = () => {},
    onPointsChange,
    onClosedChange,
    disabled = false,
    className,
    resolveLanguageKey,
    dashboard = false,
    stayHovered = "",
    fillHeight = false,
    borderless = false,
    hideControls = false,
    objectFit = "contain",
    phantomsAlwaysVisible = false,
}: PolygonSelectorProps & WithLanguageType) {

    const imagePadding = borderless ? 0 : IMAGE_PADDING;
    const [zoom, setZoom] = useState(MIN_ZOOM);
    const [isPanning, setIsPanning] = useState(false);
    const [small, setSmall] = useState(!dashboard);
    const [svgCoordinates, setSvgCoordinates] = useState<{top: number, left: number, width: number, height: number}>({top: 0, left: 0, width: 0, height: 0});
    const [points, setPoints] = useState<InternalPolygonPoint[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const startX = useRef(0);
    const startY = useRef(0);
    const startScrollLeft = useRef(0);
    const startScrollTop = useRef(0);

    const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
    const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
    const [hoveredPhantomIndex, setHoveredPhantomIndex] = useState<number | null>(null);
    const [phantomHoverPosition, setPhantomHoverPosition] = useState<{ x: number; y: number } | null>(null);
    const phantomHoverHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const draggingPointRef = useRef(-1);
    const [hoveredMidpointIndex, setHoveredMidpointIndex] = useState<number | null>(null);
    const midpointClickRef = useRef(-1);
    /** Suppress phantom onClick after a drag-pan so releasing over a unit does not navigate. */
    const didPanRef = useRef(false);
    const phantomPointerDownRef = useRef<{ x: number; y: number } | null>(null);

    const [isClosed, setIsClosed] = useState(initialPoints?.length >= 3);

    const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number } | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
    /** Only swap the visible <img> src once natural size is known — avoids stretch→snap “zoom”. */
    const [renderedImageUrl, setRenderedImageUrl] = useState(imageUrl);

    const imageRef = useRef<HTMLImageElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const pendingScrollRef = useRef<{ x: number; y: number } | null>(null);
    const hasHadPointsRef = useRef(false);

    const [containerHeight, setContainerHeight] = useState(() =>
        small ? parseInt(COLLAPSED_IMAGE_HEIGHT, 10) : parseInt(EXPANDED_IMAGE_HEIGHT, 10)
    );
    const zoomRef = useRef(zoom);
    const containerResizeStartY = useRef(0);
    const containerResizeStartHeight = useRef(0);
    const isResizingContainer = useRef(false);

    // Keep zoomRef in sync so the native wheel handler always sees the current zoom value.
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);

    /**
     * Non-passive wheel listener for ctrl/meta image-zoom and for panning when
     * the container itself overflows. At min zoom with no overflow we must NOT
     * call preventDefault — otherwise the page (and dialog) cannot scroll while
     * the pointer is over the polygon viewer (desktop + trackpad).
     */
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            const containerRect = el.getBoundingClientRect();
            if (
                e.clientX < containerRect.left || e.clientX > containerRect.right ||
                e.clientY < containerRect.top  || e.clientY > containerRect.bottom
            ) return;

            if (e.metaKey || e.ctrlKey) {
                e.preventDefault();
                e.stopPropagation();

                const currentZoom = zoomRef.current;
                const viewportX = e.clientX - containerRect.left;
                const viewportY = e.clientY - containerRect.top;
                const contentX  = viewportX + el.scrollLeft;
                const contentY  = viewportY + el.scrollTop;

                const zoomDelta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
                const newZoom   = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + zoomDelta));

                if (newZoom !== currentZoom) {
                    pendingScrollRef.current = {
                        x: contentX * (newZoom / currentZoom) - viewportX,
                        y: contentY * (newZoom / currentZoom) - viewportY,
                    };
                    setZoom(newZoom);
                }
                return;
            }

            const canScrollY = el.scrollHeight > el.clientHeight + 1;
            const canScrollX = el.scrollWidth > el.clientWidth + 1;
            if (!canScrollY && !canScrollX) {
                // Content fits: let the page/dialog scroll.
                return;
            }

            const eps = 1;
            const atTop = el.scrollTop <= eps;
            const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - eps;
            const atLeft = el.scrollLeft <= eps;
            const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - eps;

            const wantsDown = e.deltaY > 0;
            const wantsUp = e.deltaY < 0;
            const wantsRight = e.deltaX > 0;
            const wantsLeft = e.deltaX < 0;

            const absorbY =
                canScrollY &&
                ((wantsDown && !atBottom) || (wantsUp && !atTop));
            const absorbX =
                canScrollX &&
                ((wantsRight && !atRight) || (wantsLeft && !atLeft));

            if (!absorbY && !absorbX) {
                // Edge of the internal scroller — chain scroll to the page.
                return;
            }

            e.preventDefault();
            e.stopPropagation();
            const multiplier = e.deltaMode === 1 ? 20 : e.deltaMode === 2 ? el.clientHeight : 1;
            el.scrollLeft += e.deltaX * multiplier;
            el.scrollTop  += e.deltaY * multiplier;
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    // Apply scroll after zoom renders to avoid wobble (scroll must match new content dimensions)
    useLayoutEffect(() => {
        const pending = pendingScrollRef.current;
        pendingScrollRef.current = null;
        if (pending && containerRef.current) {
            const maxScrollX = Math.max(0, containerRef.current.scrollWidth - containerRef.current.clientWidth);
            const maxScrollY = Math.max(0, containerRef.current.scrollHeight - containerRef.current.clientHeight);
            containerRef.current.scrollLeft = Math.max(0, Math.min(maxScrollX, pending.x));
            containerRef.current.scrollTop = Math.max(0, Math.min(maxScrollY, pending.y));
        }
    }, [zoom]);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {

        if (!containerRef.current || e.button !== 0) return; // Only left mouse button
        // View-only: allow pan when zoomed; block draw/edit interactions.
        if (disabled && zoom <= MIN_ZOOM) return;

        const targetEl = e.target as HTMLElement | null;
        if (!disabled && targetEl && (targetEl.tagName === 'circle' || targetEl.tagName === 'text') && !targetEl.id?.includes('phantom-point')) {
            const parsed = parseInt(targetEl.id, 10);
            if (!Number.isNaN(parsed)) {
                draggingPointRef.current = parsed;
                setDraggingPointIndex(parsed);
            }
            // return;
        } // Don't pan when clicking points

        if (!disabled && targetEl?.id?.startsWith('mid-')) {
            const mi = parseInt(targetEl.id.replace('mid-', ''), 10);
            if (!isNaN(mi)) {
                midpointClickRef.current = mi;
            }
        }

        startX.current = e.clientX;
        startY.current = e.clientY;
        startScrollLeft.current = containerRef.current.scrollLeft;
        startScrollTop.current = containerRef.current.scrollTop;
        didPanRef.current = false;

        document.body.style.userSelect = "none";

        setTimeout(() => {
            window.addEventListener("pointermove", onPointerMove);
            window.addEventListener("pointerup", onPointerUp);
        }, 10);
    }
    const onPointerMove = (e: PointerEvent) => {

        // console.log(draggingPointIndex, (e.target as HTMLElement).tagName);

        if( !containerRef.current ) return;

        const moveTarget = e.target as HTMLElement | null;
        const dragActive =
            draggingPointRef.current >= 0 ||
            draggingPointIndex !== null ||
            !!(moveTarget && (moveTarget.tagName === 'circle' || moveTarget.tagName === 'text') &&
               !moveTarget.id?.startsWith('mid-'));

        // this is for drag
        if( !disabled && dragActive ){
            const content = getContentRect();
            if (!content) return;
            const dx = e.clientX - startX.current;
            const dy = e.clientY - startY.current;

            const dragIndex =
                draggingPointRef.current >= 0
                    ? draggingPointRef.current
                    : draggingPointIndex !== null
                      ? draggingPointIndex
                      : parseInt(moveTarget?.id ?? '-1', 10);
            // console.log(dragIndex, dx, dy);

            if (dragIndex < 0 || dragIndex >= points.length || Number.isNaN(dragIndex)) return;

            const newX = Math.max(0, Math.min(content.width, points[dragIndex].x + dx));
            const newY = Math.max(0, Math.min(content.height, points[dragIndex].y + dy));

            const newPoint = {
                x: newX,
                y: newY,
                xCoeff: Math.max(0, Math.min(1, newX / content.width)),
                yCoeff: Math.max(0, Math.min(1, newY / content.height)),
            }
            const updatedPoints = [...points];
            updatedPoints[dragIndex] = newPoint;
            setPoints(updatedPoints);
        }
        else if( midpointClickRef.current < 0 && (e.clientX !== startX.current || e.clientY !== startY.current) ){
            didPanRef.current = true;
            setIsPanning(true);
            const dx = e.clientX - startX.current;
            const dy = e.clientY - startY.current;
            containerRef.current.scrollLeft = startScrollLeft.current - dx;
            containerRef.current.scrollTop = startScrollTop.current - dy;
        }

        return;
    }
    const onPointerUp = (e: PointerEvent) => {

        setIsPanning(false);
        document.body.style.userSelect = "";
        setDraggingPointIndex(null);

        // View-only: pan is allowed when zoomed, but never edit / add points.
        if (disabled) {
            if (Math.hypot(e.clientX - startX.current, e.clientY - startY.current) > 0) {
                didPanRef.current = true;
            }
            draggingPointRef.current = -1;
            midpointClickRef.current = -1;
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
            return;
        }

        if (midpointClickRef.current >= 0) {
            const midIndex = midpointClickRef.current;
            midpointClickRef.current = -1;
            draggingPointRef.current = -1;
            const dx = e.clientX - startX.current;
            const dy = e.clientY - startY.current;
            const movedDistance = Math.sqrt(dx * dx + dy * dy);
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
            if (movedDistance < 8) {
                setPoints(prev => {
                    if (midIndex >= prev.length) return prev;
                    const p1 = prev[midIndex];
                    const nextIdx = isClosed && midIndex === prev.length - 1 ? 0 : midIndex + 1;
                    if (nextIdx > prev.length) return prev;
                    const p2 = nextIdx < prev.length ? prev[nextIdx] : prev[0];
                    if (!p1 || !p2) return prev;
                    const mx = (p1.x + p2.x) / 2;
                    const my = (p1.y + p2.y) / 2;
                    const newPt: InternalPolygonPoint = {
                        x: mx,
                        y: my,
                        xCoeff: Math.max(0, Math.min(1, mx / svgCoordinates.width)),
                        yCoeff: Math.max(0, Math.min(1, my / svgCoordinates.height)),
                    };
                    return [...prev.slice(0, midIndex + 1), newPt, ...prev.slice(midIndex + 1)];
                });
            }
            return;
        }

        const upTarget = e.target as unknown as SVGCircleElement | HTMLElement | null;
        const circleTarget = upTarget && "cx" in upTarget ? (upTarget as SVGCircleElement) : null;

        if (circleTarget?.id?.includes("phantom-point") && circleTarget.cx && circleTarget.cy) {
            setIsClosed(false);
            const content = getContentRect();
            if (!content) return;

            console.log(circleTarget.cx);
            const x = parseFloat(circleTarget.cx.animVal.valueAsString);
            const y = parseFloat(circleTarget.cy.animVal.valueAsString);

            setPoints((prev) => [
                ...prev,
                {
                    x,
                    y,
                    xCoeff: Math.max(0, Math.min(1, x / content.width)),
                    yCoeff: Math.max(0, Math.min(1, y / content.height)),
                },
            ]);

        }
        else if (e.target === imageRef?.current && e.clientX === startX.current && e.clientY === startY.current) {
            setIsClosed(false);
            const content = getContentRect();
            if (!content) return;
            const localX = e.clientX - content.left;
            const localY = e.clientY - content.top;
            if (localX < 0 || localY < 0 || localX > content.width || localY > content.height) return;

            setPoints((prev) => [
                ...prev,
                {
                    x: localX,
                    y: localY,
                    xCoeff: Math.max(0, Math.min(1, localX / content.width)),
                    yCoeff: Math.max(0, Math.min(1, localY / content.height)),
                },
            ]);
        }
        else if(
            draggingPointRef.current >= 0 ||
            draggingPointIndex !== null ||
            (e.target && ((e.target as HTMLElement).tagName === 'circle' || (e.target as HTMLElement).tagName === 'text'))
        ){
            if( e.clientX === startX.current && e.clientY === startY.current ){
                const upEl = e.target as HTMLElement;
                const circleId =
                    draggingPointRef.current >= 0
                        ? draggingPointRef.current
                        : draggingPointIndex !== null
                          ? draggingPointIndex
                          : parseInt(upEl.id ?? '-1', 10);
                if( circleId === 0 && points.length >= 3 ){
                    setIsClosed(true);
                }
            }
        }

        draggingPointRef.current = -1;

        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
    }

    const getZoomValue = (currentZoom: number): number => {
        return (ZOOM_RANGES.find(r => currentZoom >= r.min && currentZoom <= r.max)?.value ?? 10);
    }

    /** Content (drawn image) box in viewport coords — correct for contain-sized / object-fit imgs. */
    const getContentRect = () => {
        const stage = stageRef.current;
        if (!stage || svgCoordinates.width <= 0 || svgCoordinates.height <= 0) {
            return null;
        }
        const stageRect = stage.getBoundingClientRect();
        return {
            left: stageRect.left + svgCoordinates.left,
            top: stageRect.top + svgCoordinates.top,
            width: svgCoordinates.width,
            height: svgCoordinates.height,
        };
    };

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const updateDimensions = () => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setContainerDimensions({ width: rect.width, height: rect.height });
            }
        };
        updateDimensions();
        const observer = new ResizeObserver(updateDimensions);
        observer.observe(el);
        return () => observer.disconnect();
    }, [small, containerHeight]);

    // Preload the next image and only commit src + natural size together so the
    // fitted box never briefly uses the previous image’s aspect (looks like a zoom).
    useLayoutEffect(() => {
        let cancelled = false;
        setZoom(MIN_ZOOM);
        setHoveredPhantomIndex(null);
        setPhantomHoverPosition(null);
        onPhantomHoverChange?.(null);

        const commit = (width: number, height: number, url: string) => {
            if (cancelled || width <= 0 || height <= 0) return;
            setNaturalSize({width, height});
            setRenderedImageUrl(url);
            setImageLoaded(true);
        };

        const preload = new Image();
        preload.onload = () => commit(preload.naturalWidth, preload.naturalHeight, imageUrl);
        preload.onerror = () => {
            if (cancelled) return;
            setRenderedImageUrl(imageUrl);
            setImageLoaded(true);
        };
        preload.src = imageUrl;
        if (preload.complete && preload.naturalWidth > 0) {
            commit(preload.naturalWidth, preload.naturalHeight, imageUrl);
        }

        return () => {
            cancelled = true;
        };
        // intentionally omit onPhantomHoverChange — parent often passes an unstable callback
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageUrl]);

    useLayoutEffect(() => {
        if (!imageLoaded || !naturalSize || !containerDimensions) return;

        const contentWidth = (zoom / 100) * (containerDimensions.width - imagePadding);
        const contentHeight = (zoom / 100) * (containerDimensions.height - imagePadding);
        const newSvgCoordinates = getRenderedImageSize(
            naturalSize.width,
            naturalSize.height,
            contentWidth,
            contentHeight,
            objectFit,
        );

        setSvgCoordinates((prev) => {
            if (prev.width > 0 && prev.height > 0 && (prev.width !== newSvgCoordinates.width || prev.height !== newSvgCoordinates.height)) {
                const widthCoeff = newSvgCoordinates.width / prev.width;
                const heightCoeff = newSvgCoordinates.height / prev.height;
                setPoints((prevPoints) =>
                    prevPoints.map((point) => ({
                        ...point,
                        x: point.x * widthCoeff,
                        y: point.y * heightCoeff,
                        xCoeff: Math.max(0, Math.min(1, (point.x * widthCoeff) / newSvgCoordinates.width)),
                        yCoeff: Math.max(0, Math.min(1, (point.y * heightCoeff) / newSvgCoordinates.height)),
                    }))
                );
            }
            return newSvgCoordinates;
        });
    }, [imageLoaded, naturalSize, containerDimensions, zoom, imagePadding, objectFit]);
    useEffect(() => {
        return () => {
            window.removeEventListener("pointerup", onPointerUp);
            //@ts-expect-error
            window.removeEventListener("pointerdown", onPointerDown);
            window.removeEventListener("pointermove", onPointerMove);
        };
    }, []);
    // Sync initialPoints (percentages) to internal state when we have dimensions.
    // Only sync when we have no points yet (initial load) to avoid overwriting user edits.
    useEffect(() => {
        if (
            points.length === 0 &&
            initialPoints &&
            initialPoints.length > 0 &&
            svgCoordinates.width > 0 &&
            svgCoordinates.height > 0
        ) {
            const internal: InternalPolygonPoint[] = initialPoints.map((p) => {
                const xCoeff = Math.max(0, Math.min(1, p.x));
                const yCoeff = Math.max(0, Math.min(1, p.y));
                return {
                    x: xCoeff * svgCoordinates.width,
                    y: yCoeff * svgCoordinates.height,
                    xCoeff,
                    yCoeff,
                };
            });
            setPoints(internal);
            // setIsClosed(isPolygonRingClosed(initialPoints));
        }
    }, [points.length, initialPoints, svgCoordinates.width, svgCoordinates.height]);

    useEffect(() => {
        // Don't override parent's initial values with [] before sync has run
        if (points.length === 0 && initialPoints && initialPoints.length > 0 && !hasHadPointsRef.current) return;
        hasHadPointsRef.current = points.length > 0;
        let asPercentages: PolygonPoint[] = (points || []).map((p) => ({ x: p.xCoeff, y: p.yCoeff }));
        if (isClosed && asPercentages.length >= 3) {
            const f = asPercentages[0];
            const l = asPercentages[asPercentages.length - 1];
            if (Math.abs(f.x - l.x) > 1e-6 || Math.abs(f.y - l.y) > 1e-6) {
                // asPercentages = [...asPercentages, { x: f.x, y: f.y }];
            }
        }
        onPointsChange?.(asPercentages);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omit initialPoints to avoid loop (parent passes it back after onPointsChange)
    }, [points, isClosed]);
    useEffect(() => {
        onClosedChange?.(isClosed);
    }, [isClosed]);

    const canPhantomHover = !!phantomHoverContent || dashboard;
    const forcedHighlightId = externalHoveredId || stayHovered;

    const phantomPolygonsMemo = useMemo(() => {
        return (
            <>
                {
                    phantomPoints.map((floorCoordinates, index) => {
                        const { fill, stroke } = getPhantomColor(index);
                        const isForced = forcedHighlightId === phantomPoints[index]._id;
                        const isHovered = hoveredPhantomIndex === index;
                        const isActive = isForced || isHovered;
                        const mutedFill = fill.replace(/,\s*[\d.]+\)$/, ", 0.16)");
                        if( floorCoordinates.polygonCoordinates?.length > 0 ){
                            return (
                                <React.Fragment key={floorCoordinates._id + "_" + index}>
                                    {
                                        !dashboard && floorCoordinates.polygonCoordinates.map((point, pointIdx) => (
                                            <g
                                                key={pointIdx}
                                                style={{
                                                    pointerEvents: "none",
                                                }}
                                            >
                                                <circle
                                                    cx={point.x * svgCoordinates.width}
                                                    cy={point.y * svgCoordinates.height}
                                                    r={4}
                                                    fill={stroke}
                                                    stroke="white"
                                                    strokeWidth={1}
                                                />
                                            </g>
                                        ))
                                    }
                                    <g
                                        onMouseEnter={(e) => {
                                            if (canPhantomHover) {
                                                if (phantomHoverHideTimeoutRef.current) {
                                                    clearTimeout(phantomHoverHideTimeoutRef.current);
                                                    phantomHoverHideTimeoutRef.current = null;
                                                }
                                                setHoveredPhantomIndex(index);
                                                setPhantomHoverPosition({ x: e.clientX, y: e.clientY });
                                                onPhantomHoverChange?.(phantomPoints[index]._id);
                                            }
                                        }}
                                        onMouseMove={(e) => {
                                            if (canPhantomHover) {
                                                setPhantomHoverPosition({ x: e.clientX, y: e.clientY });
                                            }
                                        }}
                                        onMouseLeave={() => {
                                            if (canPhantomHover) {
                                                phantomHoverHideTimeoutRef.current = setTimeout(() => {
                                                    setHoveredPhantomIndex(null);
                                                    setPhantomHoverPosition(null);
                                                    onPhantomHoverChange?.(null);
                                                }, 150);
                                            }
                                        }}
                                        onPointerDown={(e) => {
                                            phantomPointerDownRef.current = { x: e.clientX, y: e.clientY };
                                            didPanRef.current = false;
                                        }}
                                        onClick={(e) => {
                                            if (!dashboard) return;
                                            const down = phantomPointerDownRef.current;
                                            phantomPointerDownRef.current = null;
                                            // If panned, don't treat release as a click.
                                            if (didPanRef.current) return;
                                            if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) return;
                                            onFloorClick(phantomPoints[index]);
                                        }}
                                        style={{ pointerEvents: canPhantomHover ? 'visible' : 'none' }}
                                    >
                                        <path
                                            d={`${floorCoordinates.polygonCoordinates.map((coord) => ({x: coord.x * svgCoordinates.width, y: coord.y * svgCoordinates.height})).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} Z`}
                                            fill={
                                                isActive
                                                    ? fill
                                                    : phantomsAlwaysVisible
                                                      ? mutedFill
                                                      : dashboard
                                                        ? "none"
                                                        : fill
                                            }
                                            stroke={
                                                isActive || phantomsAlwaysVisible || !dashboard
                                                    ? stroke
                                                    : "none"
                                            }
                                            strokeWidth={isActive ? "2.5" : "2"}
                                            strokeDasharray="0"
                                        />
                                    </g>
                                </React.Fragment>
                            )
                        }
                    })
                }
            </>
        )

    }, [phantomPoints, svgCoordinates, canPhantomHover, hoveredPhantomIndex, forcedHighlightId, dashboard, phantomsAlwaysVisible, onFloorClick, onPhantomHoverChange]);

    const imageSyncReady = renderedImageUrl === imageUrl && imageLoaded;
    const hasContentToShow =
        imageSyncReady &&
        (points.length > 0 || phantomPoints.some((p) => p.polygonCoordinates?.length));

    /*
     * View-only (disabled) at 100% zoom: allow the page/dialog to scroll under
     * the finger. Zoomed-in or edit mode still needs touch-action:none so pans
     * and vertex drags do not fight the browser scroll.
     */
    const allowPageTouchScroll = disabled && zoom <= MIN_ZOOM;
    const touchActionStyle = allowPageTouchScroll ? "pan-y" : "none";
    // At 100% zoom, overflow:auto can introduce a sub-pixel scrollbar and shrink
    // the container → ResizeObserver → fitted image “zooms”. Only scroll when zoomed.
    const containerOverflow = zoom > MIN_ZOOM ? "auto" : "hidden";
    const viewOnlyPan = disabled && zoom > MIN_ZOOM;
    // Full-bleed marketing stage: lock to inset at 100% (stable), grow with zoom above that.
    const fullBleedLocked = borderless && fillHeight && zoom <= MIN_ZOOM;
    const stageZoomStyle = fullBleedLocked
        ? undefined
        : {
              width:  (zoom / 100) * Math.max(0, (containerDimensions?.width ?? 0) - imagePadding),
              height: (zoom / 100) * Math.max(0, (containerDimensions?.height ?? 0) - imagePadding),
          };
    const cardCursor = viewOnlyPan
        ? (isPanning ? "grabbing" : "grab")
        : disabled
          ? "default"
          : (isPanning ? "grabbing" : "default");
    const imageCursor = viewOnlyPan
        ? (isPanning ? "grabbing" : "grab")
        : disabled
          ? "default"
          : (isPanning ? "grabbing" : "crosshair");

    return (
        <>
            {
                canPhantomHover && hoveredPhantomIndex !== null && phantomHoverPosition && phantomHoverContent && phantomPoints[hoveredPhantomIndex] && createPortal(
                    <div className="fixed z-9999 pointer-events-none" style={{left: phantomHoverPosition.x + 12, top: phantomHoverPosition.y + 12,}}>
                        <div
                            className="pointer-events-auto overflow-hidden rounded-[5px] border border-black/10 bg-white shadow-lg"
                            onMouseEnter={() => {
                                if (phantomHoverHideTimeoutRef.current) {
                                    clearTimeout(phantomHoverHideTimeoutRef.current);
                                    phantomHoverHideTimeoutRef.current = null;
                                }
                            }}
                            onMouseLeave={() => {
                                setHoveredPhantomIndex(null);
                                setPhantomHoverPosition(null);
                                onPhantomHoverChange?.(null);
                            }}
                        >
                            {phantomHoverContent(phantomPoints[hoveredPhantomIndex])}
                        </div>
                    </div>,
                    document.body
                )
            }

            {/*
              Only stretch to parent height in overlay/dashboard (`fillHeight`).
              In forms, `h-full` resolves against the panel scrollport and forces a
              second scrollbar alongside the page scroll once the selector mounts.
            */}
            <div className={cn("w-full", fillHeight ? "h-full max-h-full" : "max-w-3xl mx-auto")}>

                <div
                    className={cn("relative w-full", !fillHeight && "max-w-3xl mx-auto", className)}
                    style={{
                        height:    fillHeight ? "100%" : `${containerHeight}px`,
                        minHeight: fillHeight ? "100%" : `${MIN_CONTAINER_HEIGHT}px`,
                        maxHeight: fillHeight ? "100%" : `${MAX_CONTAINER_HEIGHT}px`,
                    }}
                >
                    <Card
                        className={cn(
                            "relative flex scrollbar-thin-custom",
                            borderless
                                ? "gap-0 rounded-none border-0 bg-transparent p-0 py-0 shadow-none ring-0"
                                : "rounded-lg border bg-muted/60 p-1",
                        )}
                        style={{
                            height: '100%',
                            width: '100%',
                            overflow: containerOverflow,
                            cursor: cardCursor,
                            touchAction: touchActionStyle,
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                        }}
                        onPointerDown={onPointerDown}
                        onContextMenu={(e) => e.preventDefault()}
                        ref={containerRef}
                    >
                            <div
                                ref={stageRef}
                                className={cn(
                                    "absolute overflow-hidden",
                                    fullBleedLocked
                                        ? "inset-0 size-full"
                                        : borderless
                                          ? "top-0 left-0"
                                          : "top-1 left-1",
                                    !borderless && "flex items-center justify-center",
                                )}
                                style={stageZoomStyle}
                            >
                                <img
                                    ref={imageRef}
                                    src={renderedImageUrl}
                                    alt="Image for polygon selection"
                                    className={cn(
                                        "block",
                                        borderless
                                            ? cn(
                                                  "absolute",
                                                  fillHeight ? "rounded-none" : "rounded-[5px]",
                                              )
                                            : "rounded-lg",
                                    )}
                                    style={
                                        borderless
                                            ? svgCoordinates.width > 0 && svgCoordinates.height > 0
                                                ? {
                                                      top: svgCoordinates.top,
                                                      left: svgCoordinates.left,
                                                      width: `${svgCoordinates.width}px`,
                                                      height: `${svgCoordinates.height}px`,
                                                      maxWidth: "none",
                                                      cursor: imageCursor,
                                                      touchAction: touchActionStyle,
                                                      userSelect: "none",
                                                      WebkitUserSelect: "none",
                                                      WebkitTouchCallout: "none",
                                                  }
                                                : {
                                                      inset: 0,
                                                      width: "100%",
                                                      height: "100%",
                                                      objectFit,
                                                      cursor: imageCursor,
                                                      touchAction: touchActionStyle,
                                                      userSelect: "none",
                                                      WebkitUserSelect: "none",
                                                      WebkitTouchCallout: "none",
                                                  }
                                            : {
                                                  width: svgCoordinates.width > 0 ? `${svgCoordinates.width}px` : undefined,
                                                  height: svgCoordinates.height > 0 ? `${svgCoordinates.height}px` : undefined,
                                                  cursor: imageCursor,
                                                  touchAction: touchActionStyle,
                                                  userSelect: "none",
                                                  WebkitUserSelect: "none",
                                                  WebkitTouchCallout: "none",
                                              }
                                    }
                                    draggable={false}
                                    onContextMenu={(e) => e.preventDefault()}
                                />

                                {
                                    svgCoordinates.width > 0 && svgCoordinates.height > 0 && hasContentToShow && (
                                    <svg
                                        width={svgCoordinates.width}
                                        height={svgCoordinates.height}
                                        onDragStart={(e) => e.preventDefault()}
                                        style={{
                                            border: "0px dashed red",
                                            position: 'absolute',
                                            top: svgCoordinates.top,
                                            left: svgCoordinates.left,
                                            minHeight: svgCoordinates.height,
                                            height: svgCoordinates.height,
                                            minWidth: svgCoordinates.width,
                                            width: svgCoordinates.width,
                                            pointerEvents: 'none'
                                        }}
                                        // onPointerDown={onPointerDown}
                                    >

                                        {phantomPolygonsMemo}

                                        {/* Main polygon path */}
                                        {points.length >= 2 && (
                                            <path
                                                d={`${points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} ${isClosed ? 'Z' : ''}`}
                                                fill={isClosed ? "rgba(59, 130, 246, 0.3)" : "none"}
                                                stroke="rgb(59, 130, 246)"
                                                strokeWidth="3"
                                                strokeDasharray="0"
                                                style={{ pointerEvents: 'none' }}
                                            />
                                        )}

                                        {/* Preview close segment — dotted red from last point back to first */}
                                        {!isClosed && points.length >= 3 && (
                                            <line
                                                x1={points[points.length - 1].x}
                                                y1={points[points.length - 1].y}
                                                x2={points[0].x}
                                                y2={points[0].y}
                                                stroke="rgb(239, 68, 68)"
                                                strokeWidth="2"
                                                strokeDasharray="6,4"
                                                style={{ pointerEvents: 'none' }}
                                            />
                                        )}

                                        {/* Midpoint insertion circles */}
                                        {!disabled && points.length >= 2 && points.map((point, index) => {
                                            if (!isClosed && index === points.length - 1) return null;
                                            const nextIndex = isClosed ? (index + 1) % points.length : index + 1;
                                            const nextPoint = points[nextIndex];
                                            if (!nextPoint) return null;
                                            const mx = (point.x + nextPoint.x) / 2;
                                            const my = (point.y + nextPoint.y) / 2;
                                            const isHovered = hoveredMidpointIndex === index;
                                            return (
                                                <g key={`mid-g-${index}`}>
                                                    <circle
                                                        id={`mid-${index}`}
                                                        cx={mx}
                                                        cy={my}
                                                        r={11}
                                                        fill="transparent"
                                                        stroke="none"
                                                        style={{ cursor: "crosshair", pointerEvents: "auto" }}
                                                        onMouseEnter={() => setHoveredMidpointIndex(index)}
                                                        onMouseLeave={() => setHoveredMidpointIndex(null)}
                                                    />
                                                    <circle
                                                        cx={mx}
                                                        cy={my}
                                                        r={isHovered ? 6 : 4}
                                                        fill={isHovered ? "rgb(59, 130, 246)" : "rgba(255,255,255,0.9)"}
                                                        stroke="rgb(59, 130, 246)"
                                                        strokeWidth={1.5}
                                                        style={{ pointerEvents: "none" }}
                                                    />
                                                    {isHovered && (
                                                        <text
                                                            x={mx}
                                                            y={my}
                                                            textAnchor="middle"
                                                            dominantBaseline="central"
                                                            fill="white"
                                                            fontSize={8}
                                                            fontWeight="bold"
                                                            style={{ pointerEvents: "none" }}
                                                        >+</text>
                                                    )}
                                                </g>
                                            );
                                        })}

                                        {/* Regular point circles (dragging point skipped — rendered as pin below) */}
                                        {points.map((point, index) => {
                                            if (index === draggingPointIndex) return null;
                                            return (
                                                <g
                                                    key={index}
                                                    data-point-index={index}
                                                    style={{
                                                        pointerEvents: disabled ? "none" : "auto",
                                                        cursor: "pointer",
                                                    }}
                                                    onMouseEnter={() => setHoveredPointIndex(index)}
                                                    onMouseLeave={() => setHoveredPointIndex(null)}
                                                >
                                                    <circle
                                                        cx={point.x}
                                                        cy={point.y}
                                                        id={index + ""}
                                                        r={CIRCLE_RADIUS}
                                                        fill={(hoveredPointIndex === index) ? "rgb(96, 165, 250)" : "rgb(59, 130, 246)"}
                                                        stroke="white"
                                                        strokeWidth={1}
                                                    />
                                                    <text
                                                        x={point.x}
                                                        y={point.y}
                                                        textAnchor="middle"
                                                        dominantBaseline="central"
                                                        fill="white"
                                                        fontSize={CIRCLE_TEXT}
                                                        fontWeight="bold"
                                                        pointerEvents="none"
                                                    >
                                                        {index + 1}
                                                    </text>
                                                </g>
                                            );
                                        })}

                                        {/* Pin marker for the point currently being dragged (rendered last = on top) */}
                                        {draggingPointIndex !== null && draggingPointIndex < points.length && (() => {
                                            const point = points[draggingPointIndex];
                                            return (
                                                <g
                                                    key={`pin-${draggingPointIndex}`}
                                                    style={{ pointerEvents: "auto", cursor: "move" }}
                                                >
                                                    <g transform={`translate(${point.x}, ${point.y})`}>
                                                        {/* Pin body: teardrop with tip at (0,0) pointing down, head centred at (0,-20) */}
                                                        <path
                                                            id={draggingPointIndex + ""}
                                                            d="M 0 0 C -8 -5 -12 -12 -12 -20 a 12 12 0 1 0 24 0 C 12 -12 8 -5 0 0 Z"
                                                            fill="rgb(37, 99, 235)"
                                                            stroke="white"
                                                            strokeWidth={1.5}
                                                            strokeLinejoin="round"
                                                        />
                                                        <text
                                                            x={0}
                                                            y={-20}
                                                            textAnchor="middle"
                                                            dominantBaseline="central"
                                                            fill="white"
                                                            fontSize={CIRCLE_TEXT}
                                                            fontWeight="bold"
                                                            style={{ pointerEvents: "none" }}
                                                        >
                                                            {draggingPointIndex + 1}
                                                        </text>
                                                    </g>
                                                </g>
                                            );
                                        })()}
                                    </svg>
                                    )
                                }
                            </div>
                        </Card>

                    {/* Drag-to-resize handle — bottom-right corner */}
                    {!fillHeight && (
                        <div
                            style={{ position: 'absolute', bottom: 4, right: 4, zIndex: 20, cursor: 'se-resize', opacity: 0.4, lineHeight: 0 }}
                            className="hover:opacity-80 transition-opacity select-none"
                            title="Drag to resize"
                            onPointerDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                containerResizeStartY.current = e.clientY;
                                containerResizeStartHeight.current = containerHeight;
                                isResizingContainer.current = true;
                                const onMove = (ev: PointerEvent) => {
                                    if (!isResizingContainer.current) return;
                                    const dy = ev.clientY - containerResizeStartY.current;
                                    setContainerHeight(Math.max(MIN_CONTAINER_HEIGHT, Math.min(MAX_CONTAINER_HEIGHT, containerResizeStartHeight.current + dy)));
                                };
                                const onUp = () => {
                                    isResizingContainer.current = false;
                                    window.removeEventListener('pointermove', onMove);
                                    window.removeEventListener('pointerup', onUp);
                                };
                                window.addEventListener('pointermove', onMove);
                                window.addEventListener('pointerup', onUp);
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 12L12 2M6 12L12 6M10 12L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                        </div>
                    )}

                    {!hideControls && (
                    <div className={cn("absolute bottom-2 left-0 z-20 w-full flex items-center justify-center", {"bottom-4 ":  zoom !== 100})}>
                        <div
                            data-polygon-zoom-controls
                            className="flex flex-row items-center gap-2 rounded-lg border border-border bg-background p-1 shadow-md"
                        >
                            <TooltipDisplayer tooltip={resolveLanguageKey("zoomOut")}>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="bg-muted text-foreground hover:bg-muted/80"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setZoom(prev => Math.max(MIN_ZOOM, prev - getZoomValue(prev)));
                                    }}
                                    disabled={zoom <= MIN_ZOOM}
                                >
                                    <ZoomOut />
                                </Button>
                            </TooltipDisplayer>

                            <TooltipDisplayer tooltip={resolveLanguageKey("zoomIn")}>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="bg-muted text-foreground hover:bg-muted/80"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setZoom(prev => Math.min(MAX_ZOOM, prev + getZoomValue(prev)));
                                    }}
                                    disabled={zoom >= MAX_ZOOM}
                                >
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                            </TooltipDisplayer>

                            <TooltipDisplayer tooltip={resolveLanguageKey("resetZoom")}>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="bg-muted text-foreground hover:bg-muted/80"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setZoom(MIN_ZOOM);
                                    }}
                                    disabled={zoom <= MIN_ZOOM}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </TooltipDisplayer>

                            <p className="min-w-10 rounded-md bg-muted px-2 py-1.5 text-center text-sm font-medium text-foreground">
                                {Math.round(zoom)}%
                            </p>

                            {
                                !dashboard &&
                                <TooltipDisplayer tooltip={resolveLanguageKey(small ? "expand" : "collapse")}>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                            const newSmall = !small;
                                            setSmall(newSmall);
                                            setContainerHeight(newSmall ? parseInt(COLLAPSED_IMAGE_HEIGHT, 10) : parseInt(EXPANDED_IMAGE_HEIGHT, 10));
                                        }}
                                        title={resolveLanguageKey(small ? "expand" : "collapse")}
                                    >
                                        {small ? <Maximize2 /> : <Minimize2 />}
                                    </Button>
                                </TooltipDisplayer>
                            }

                            {
                                (!dashboard || (!disabled && points.length !== 0)) &&
                                <Separator orientation="vertical" className="h-6" />
                            }

                            {
                                !disabled && points.length !== 0 &&
                                <div className="flex grow items-center justify-end gap-x-2">

                                    <TooltipDisplayer tooltip={resolveLanguageKey("revert")}>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                const newPoints = points.slice(0, -1);
                                                setPoints(newPoints);
                                                onPointsChange?.(
                                                    newPoints.map((p) => ({ x: p.xCoeff, y: p.yCoeff })),
                                                );
                                                setIsClosed(false);
                                            }}
                                            title={resolveLanguageKey("revert")}
                                        >
                                            <Undo2 />
                                        </Button>
                                    </TooltipDisplayer>

                                    <TooltipDisplayer tooltip={resolveLanguageKey("clear")}>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                if (disabled) return;
                                                setPoints([]);
                                                setIsClosed(false);
                                                onPointsChange?.([]);
                                            }}
                                            style={{borderColor: "red"}}
                                            title={resolveLanguageKey("clear")}
                                        >
                                            <Eraser />
                                        </Button>
                                    </TooltipDisplayer>

                                </div>
                            }
                        </div>
                    </div>
                    )}
                </div>

                {
                    !disabled &&
                    <Card className="mt-2 flex gap-0 flex-wrap px-2 py-1 w-full text-sm text-muted-foreground">
                        <p>1. {resolveLanguageKey("info")}</p>
                        <p className={cn({"text-success": isClosed})}>2. {resolveLanguageKey("currentPolygon")} {points.length} {resolveLanguageKey(points.length !== 1 ? "points" : "point")}</p>
                        {
                            !isClosed &&
                            <p>3. {resolveLanguageKey("clickToClose")}</p>
                        }
                    </Card>
                }

            </div>
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/polygonSelector.tsx")
)(PolygonSelector)