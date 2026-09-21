import {useEffect, useRef, useState} from "react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {PDF_THUMB_MAX_BYTES} from "@baseModule/components/viewEngine/widgets/media/mediaPreviewKind.ts";
import {fetchMediaBytes} from "@baseModule/helpers/media/fetchMediaBytes.ts";
import {isAbortError, renderPdfBytesToCanvas} from "@baseModule/components/custom/pdf/renderPdfPage.ts";

type PdfFirstPageThumbProps = {
    src: string;
    fileSizeBytes?: number;
    className?: string;
    onFail?: () => void;
    /** `cover` crops to fill the tile. `contain` keeps the full page visible. */
    fit?: "cover" | "contain";
};

const RESIZE_TOLERANCE = 2;
const RESIZE_DEBOUNCE_MS = 80;

/**
 * Renders PDF page 1 into a canvas once the tile scrolls into view.
 * Rendering goes through the shared render slots and worker in `renderPdfPage.ts`,
 * so a documents grid does not start one worker per tile.
 */
export default function PdfFirstPageThumb({
    src,
    fileSizeBytes,
    className,
    onFail,
    fit = "cover",
}: PdfFirstPageThumbProps) {
    const onFailRef = useRef(onFail);
    useEffect(() => {
        onFailRef.current = onFail;
    });
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [visible, setVisible] = useState(false);
    const [ready, setReady] = useState(false);
    const [box, setBox] = useState({width: 0, height: 0});
    const [payload, setPayload] = useState<Uint8Array | null>(null);

    // Only the first intersection matters; after that the observer is dropped.
    useEffect(() => {
        const el = wrapRef.current;
        if (!el || visible) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            {rootMargin: "80px"},
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [visible]);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el || !visible) return;
        let timeout = 0;
        const measure = () => {
            const width = Math.round(el.clientWidth);
            const height = Math.round(el.clientHeight);
            window.clearTimeout(timeout);
            timeout = window.setTimeout(() => {
                setBox((current) =>
                    Math.abs(current.width - width) < RESIZE_TOLERANCE &&
                    Math.abs(current.height - height) < RESIZE_TOLERANCE
                        ? current
                        : {width, height},
                );
            }, RESIZE_DEBOUNCE_MS);
        };
        measure();
        const resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(el);
        return () => {
            window.clearTimeout(timeout);
            resizeObserver.disconnect();
        };
    }, [visible]);

    useEffect(() => {
        setPayload(null);
        setReady(false);
        if (!visible) return;
        if (fileSizeBytes != null && fileSizeBytes > PDF_THUMB_MAX_BYTES) {
            onFailRef.current?.();
            return;
        }

        const controller = new AbortController();
        (async () => {
            try {
                const data = await fetchMediaBytes(src, controller.signal);
                if (controller.signal.aborted) return;
                if (data.byteLength > PDF_THUMB_MAX_BYTES) {
                    onFailRef.current?.();
                    return;
                }
                setPayload(data);
            } catch (err) {
                if (!isAbortError(err, controller.signal)) onFailRef.current?.();
            }
        })();
        return () => controller.abort();
    }, [src, visible, fileSizeBytes]);

    useEffect(() => {
        const canvas = canvasRef.current;
        /* Table file tiles are `size-9` (~36px), so any measured size is rendered;
           only an unmeasured box is skipped. */
        if (!canvas || !payload || box.width < 1 || box.height < 1) return;

        const controller = new AbortController();
        (async () => {
            try {
                // The canvas is sized by CSS (`size-full` + object-fit); only its bitmap comes from here.
                await renderPdfBytesToCanvas(payload, {
                    pageNumber: 1,
                    cssWidth: box.width,
                    cssMaxHeight: box.height,
                    fit,
                    canvas,
                    signal: controller.signal,
                });
                if (!controller.signal.aborted) setReady(true);
            } catch (err) {
                if (!isAbortError(err, controller.signal)) onFailRef.current?.();
            }
        })();
        return () => controller.abort();
    }, [payload, box.width, box.height, fit]);

    return (
        <div ref={wrapRef} className={cn("relative h-full w-full min-h-0 min-w-0 bg-muted", className)}>
            <canvas
                ref={canvasRef}
                aria-hidden
                className={cn(
                    "absolute inset-0 size-full object-center transition-opacity",
                    fit === "contain" ? "object-contain" : "object-cover",
                    !ready && "opacity-0",
                )}
            />
        </div>
    );
}
