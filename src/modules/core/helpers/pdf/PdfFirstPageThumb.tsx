import {useEffect, useRef, useState} from "react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {PDF_THUMB_MAX_BYTES} from "@coreModule/components/custom/files/mediaPreviewKind.ts";
import {fetchMediaBytes} from "@coreModule/helpers/media/fetchMediaBytes.ts";
import {renderPdfPageToCanvas} from "@coreModule/helpers/pdf/renderPdfPage.ts";

type PdfFirstPageThumbProps = {
    src: string;
    fileSizeBytes?: number;
    className?: string;
    onFail?: () => void;
    /** `cover` crops to fill the tile. `contain` keeps the full page visible. */
    fit?: "cover" | "contain";
};

/**
 * Renders PDF page 1 into a canvas when the tile scrolls into view.
 * Caps concurrent pdf.js work so a documents grid does not spawn a worker per tile.
 */
export default function PdfFirstPageThumb({
    src,
    fileSizeBytes,
    className,
    onFail,
    fit = "cover",
}: PdfFirstPageThumbProps) {
    const onFailRef = useRef(onFail);
    onFailRef.current = onFail;
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [visible, setVisible] = useState(false);
    const [ready, setReady] = useState(false);
    const [box, setBox] = useState({width: 0, height: 0});
    const [payload, setPayload] = useState<Uint8Array | null>(null);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setVisible(true);
                }
            },
            {rootMargin: "80px"},
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [src]);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el || !visible) return;
        let timeout = 0;
        const measure = () => {
            const width = Math.round(el.clientWidth);
            const height = Math.round(el.clientHeight);
            window.clearTimeout(timeout);
            timeout = window.setTimeout(() => {
                setBox((current) => (
                    current.width === width && current.height === height ? current : {width, height}
                ));
            }, 80);
        };
        measure();
        const resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(el);
        return () => {
            window.clearTimeout(timeout);
            resizeObserver.disconnect();
        };
    }, [src, visible]);

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
            } catch {
                if (controller.signal.aborted) return;
                onFailRef.current?.();
            }
        })();

        return () => controller.abort();
    }, [src, visible, fileSizeBytes]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !payload || (box.width < 40 && box.height < 40)) return;

        const controller = new AbortController();
        setReady(false);
        const cssWidth = Math.max(box.width, 80);
        const cssMaxHeight = Math.max(box.height, 80);

        (async () => {
            try {
                await renderPdfPageToCanvas({
                    data: payload,
                    pageNumber: 1,
                    cssWidth,
                    cssMaxHeight,
                    fit,
                    canvas,
                    signal: controller.signal,
                });
                canvas.style.width = "100%";
                canvas.style.height = "100%";
                canvas.style.objectFit = fit;
                if (!controller.signal.aborted) setReady(true);
            } catch {
                if (controller.signal.aborted) return;
                onFailRef.current?.();
            }
        })();

        return () => controller.abort();
    }, [payload, box.width, box.height, fit]);

    return (
        <div ref={wrapRef} className={cn("relative h-full w-full min-h-0 min-w-0 bg-muted", className)}>
            <canvas
                ref={canvasRef}
                className={cn(
                    "absolute inset-0 size-full object-center",
                    fit === "contain" ? "object-contain" : "object-cover",
                    !ready && "opacity-0",
                )}
            />
        </div>
    );
}
