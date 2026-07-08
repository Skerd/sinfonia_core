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
    onPointsChange: (points: PolygonPoint[]) => void;
    onClosedChange?: (isClosed: boolean) => void;
    disabled?: boolean;
    className?: string;
    dashboard?: boolean;
    stayHovered?: string;
    fillHeight?: boolean
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

function getRenderedImageSize(naturalWidth: number, naturalHeight: number, containerWidth: number, containerHeight: number): { width: number; height: number; left: number; top: number } {
    if (naturalWidth <= 0 || naturalHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) {
        return { width: 0, height: 0, left: 0, top: 0 };
    }
    const imageAspect = naturalWidth / naturalHeight;
    const containerAspect = containerWidth / containerHeight;

    let renderedWidth: number;
    let renderedHeight: number;

    if (imageAspect > containerAspect) {
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
    onFloorClick = () => {},
    onPointsChange,
    onClosedChange,
    disabled = false,
    className,
    resolveLanguageKey,
    dashboard = false,
    stayHovered = "",
    fillHeight = false
}: PolygonSelectorProps & WithLanguageType) {

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

    const [isClosed, setIsClosed] = useState(initialPoints?.length >= 3);

    const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number } | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

    const imageRef = useRef<HTMLImageElement>(null);
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

    // Non-passive native wheel listener — prevents both browser page-zoom (Ctrl+scroll)
    // and page scroll when the pointer is inside the container.
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const containerRect = el.getBoundingClientRect();
            if (
                e.clientX < containerRect.left || e.clientX > containerRect.right ||
                e.clientY < containerRect.top  || e.clientY > containerRect.bottom
            ) return;

            if (e.metaKey || e.ctrlKey) {
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
            } else {
                // Manual scroll: preventDefault killed the browser's own scroll so drive it ourselves.
                const multiplier = e.deltaMode === 1 ? 20 : e.deltaMode === 2 ? el.clientHeight : 1;
                el.scrollLeft += e.deltaX * multiplier;
                el.scrollTop  += e.deltaY * multiplier;
            }
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

        if (!containerRef.current || disabled || e.button !== 0) return; // Only left mouse button
        const targetEl = e.target as HTMLElement | null;
        if (targetEl && (targetEl.tagName === 'circle' || targetEl.tagName === 'text') && !targetEl.id?.includes('phantom-point')) {
            const parsed = parseInt(targetEl.id, 10);
            if (!Number.isNaN(parsed)) {
                draggingPointRef.current = parsed;
                setDraggingPointIndex(parsed);
            }
            // return;
        } // Don't pan when clicking points

        if (targetEl?.id?.startsWith('mid-')) {
            const mi = parseInt(targetEl.id.replace('mid-', ''), 10);
            if (!isNaN(mi)) {
                midpointClickRef.current = mi;
            }
        }

        startX.current = e.clientX;
        startY.current = e.clientY;
        startScrollLeft.current = containerRef.current.scrollLeft;
        startScrollTop.current = containerRef.current.scrollTop;

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
        if( dragActive ){
            const img = imageRef.current;
            if (!img) return;
            const rect = img.getBoundingClientRect();
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

            const newX = Math.max(0, Math.min(rect.width, points[dragIndex].x + dx));
            const newY = Math.max(0, Math.min(rect.height, points[dragIndex].y + dy));

            const newPoint = {
                x: newX,
                y: newY,
                xCoeff: Math.max(0, Math.min(1, newX / rect.width)),
                yCoeff: Math.max(0, Math.min(1, newY / rect.height)),
            }
            const updatedPoints = [...points];
            updatedPoints[dragIndex] = newPoint;
            setPoints(updatedPoints);
        }
        else if( midpointClickRef.current < 0 && (e.clientX !== startX.current || e.clientY !== startY.current) ){
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
            const img = imageRef.current;
            if (!img) return;
            const rect = img.getBoundingClientRect();

            console.log(circleTarget.cx);
            const x = parseFloat(circleTarget.cx.animVal.valueAsString);
            const y = parseFloat(circleTarget.cy.animVal.valueAsString);

            setPoints((prev) => [
                ...prev,
                {
                    x,
                    y,
                    xCoeff: Math.max(0, Math.min(1, x / rect.width)),
                    yCoeff: Math.max(0, Math.min(1, y / rect.height)),
                },
            ]);

        }
        else if (e.target === imageRef?.current && (e.clientX === startX.current || e.clientY === startY.current) ) {
            setIsClosed(false);
            const img = imageRef.current;
            if (!img) return;
            const rect = img.getBoundingClientRect();
            const localX = e.clientX - rect.left;
            const localY = e.clientY - rect.top;

            setPoints((prev) => [
                ...prev,
                {
                    x: localX,
                    y: localY,
                    xCoeff: Math.max(0, Math.min(1, localX / rect.width)),
                    yCoeff: Math.max(0, Math.min(1, localY / rect.height)),
                },
            ]);
        }
        else if(
            draggingPointRef.current >= 0 ||
            draggingPointIndex !== null ||
            (e.target && ((e.target as HTMLElement).tagName === 'circle' || (e.target as HTMLElement).tagName === 'text'))
        ){
            if( (e.clientX === startX.current || e.clientY === startY.current) ){
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

    useLayoutEffect(() => {
        if (!imageLoaded || !naturalSize || !containerDimensions) return;

        const contentWidth = (zoom / 100) * (containerDimensions.width - IMAGE_PADDING);
        const contentHeight = (zoom / 100) * (containerDimensions.height - IMAGE_PADDING);
        const newSvgCoordinates = getRenderedImageSize(
            naturalSize.width,
            naturalSize.height,
            contentWidth,
            contentHeight
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
    }, [imageLoaded, naturalSize, containerDimensions, zoom]);
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

    const phantomPolygonsMemo = useMemo(() => {
        return (
            <>
                {
                    phantomPoints.map((floorCoordinates, index) => {
                        const { fill, stroke } = getPhantomColor(index);
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
                                                }, 150);
                                            }
                                        }}
                                        onClick={() => {
                                            if( !!dashboard ){
                                                onFloorClick(phantomPoints[index]);
                                            }
                                        }}
                                        style={{ pointerEvents: canPhantomHover ? 'visible' : 'none' }}
                                    >
                                        <path
                                            d={`${floorCoordinates.polygonCoordinates.map((coord) => ({x: coord.x * svgCoordinates.width, y: coord.y * svgCoordinates.height})).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} Z`}
                                            fill={ (stayHovered === phantomPoints[index]._id) ? fill : (!dashboard ? (hoveredPhantomIndex !== index ? fill : "none") : (hoveredPhantomIndex === index ? fill : "none")) }
                                            stroke={ !dashboard ? (hoveredPhantomIndex !== index ? stroke : "none") : (hoveredPhantomIndex === index ? stroke : "none") }
                                            strokeWidth="2"
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

    }, [phantomPoints, svgCoordinates, canPhantomHover, hoveredPhantomIndex]);

    const hasContentToShow = points.length > 0 || phantomPoints.some((p) => p.polygonCoordinates?.length );

    return (
        <>
            {
                canPhantomHover && hoveredPhantomIndex !== null && phantomHoverPosition && phantomHoverContent && phantomPoints[hoveredPhantomIndex] && createPortal(
                    <div className="fixed z-9999 pointer-events-none" style={{left: phantomHoverPosition.x + 12, top: phantomHoverPosition.y + 12,}}>
                        <div
                            className="pointer-events-auto rounded-lg border bg-card shadow-lg overflow-hidden"
                            onMouseEnter={() => {
                                if (phantomHoverHideTimeoutRef.current) {
                                    clearTimeout(phantomHoverHideTimeoutRef.current);
                                    phantomHoverHideTimeoutRef.current = null;
                                }
                            }}
                            onMouseLeave={() => {
                                setHoveredPhantomIndex(null);
                                setPhantomHoverPosition(null);
                            }}
                        >
                            {phantomHoverContent(phantomPoints[hoveredPhantomIndex])}
                        </div>
                    </div>,
                    document.body
                )
            }

            <div className="w-full max-w-3xl mx-auto max-h-full h-full">

                <div
                    className={cn("relative w-full max-w-3xl mx-auto", className)}
                    style={{
                        height:    fillHeight ? "100%" : `${containerHeight}px`,
                        minHeight: fillHeight ? "100%" : `${MIN_CONTAINER_HEIGHT}px`,
                        maxHeight: fillHeight ? "100%" : `${MAX_CONTAINER_HEIGHT}px`,
                    }}
                >
                    <Card
                        className="relative flex border overflow-auto scrollbar-thin-custom rounded-lg bg-muted/60 p-1"
                        style={{
                            height: '100%',
                            width: '100%',
                            cursor: (disabled) ? 'default' : ( isPanning ? 'grabbing' : 'default' ),
                            touchAction: 'none',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                        }}
                        onPointerDown={onPointerDown}
                        onContextMenu={(e) => e.preventDefault()}
                        ref={containerRef}
                    >
                            <div
                                className="absolute top-1 left-1 flex items-center justify-center"
                                style={{
                                    width:  (zoom / 100) * Math.max(0, (containerDimensions?.width ?? 0) - IMAGE_PADDING),
                                    height: (zoom / 100) * Math.max(0, (containerDimensions?.height ?? 0) - IMAGE_PADDING)
                                }}
                            >
                                <img
                                    ref={imageRef}
                                    src={imageUrl}
                                    alt="Image for polygon selection"
                                    className="block rounded-lg"
                                    onLoad={() => {
                                        const img = imageRef.current;
                                        if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
                                            setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                                            setImageLoaded(true);
                                        }
                                    }}
                                    style={{
                                        width: svgCoordinates.width > 0 ? `${svgCoordinates.width}px` : undefined,
                                        height: svgCoordinates.height > 0 ? `${svgCoordinates.height}px` : undefined,
                                        cursor: disabled ? 'default' : (isPanning ? 'grabbing' : 'crosshair'),
                                        touchAction: 'none',
                                        userSelect: 'none',
                                        WebkitUserSelect: 'none',
                                        WebkitTouchCallout: 'none',
                                    }}
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

                    <div className={cn("absolute bottom-2 left-0 w-full flex items-center justify-center", {"bottom-4 ":  zoom !== 100})}>
                        <Card className="flex flex-row items-center gap-2 p-1 bg-card/60">

                            <TooltipDisplayer tooltip={resolveLanguageKey("zoomOut")}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {setZoom(prev => Math.max(MIN_ZOOM, prev - getZoomValue(prev)))}}
                                    disabled={zoom <= MIN_ZOOM}
                                >
                                    <ZoomOut />
                                </Button>
                            </TooltipDisplayer>

                            <TooltipDisplayer tooltip={resolveLanguageKey("zoomIn")}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {setZoom(prev => Math.min(MAX_ZOOM, prev + getZoomValue(prev)))}}
                                    disabled={zoom >= MAX_ZOOM}
                                >
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                            </TooltipDisplayer>

                            <TooltipDisplayer tooltip={resolveLanguageKey("resetZoom")}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setZoom(MIN_ZOOM);
                                    }}
                                    disabled={(zoom === 1)}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </TooltipDisplayer>

                            <p className="text-sm text-center">
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

                            <Separator orientation="vertical" className="h-6" />

                            {
                                !disabled && points.length !== 0 &&
                                <div className="flex grow items-center justify-end space-x-2">

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
                        </Card>
                    </div>
                </div>

                {
                    !disabled &&
                    <Card className="mt-2 flex gap-0 flex-wrap px-2 py-1 w-full text-sm text-muted-foreground">
                        <p>1. {resolveLanguageKey("info")}</p>
                        <p className={cn({"text-green-600": isClosed})}>2. {resolveLanguageKey("currentPolygon")} {points.length} {resolveLanguageKey(points.length !== 1 ? "points" : "point")}</p>
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