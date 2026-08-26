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
}: PdfFirstPageThumbProps) {
    const onFailRef = useRef(onFail);
    onFailRef.current = onFail;
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [visible, setVisible] = useState(false);
    const [ready, setReady] = useState(false);

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
        setReady(false);
        if (!visible) return;
        if (fileSizeBytes != null && fileSizeBytes > PDF_THUMB_MAX_BYTES) {
            onFailRef.current?.();
            return;
        }

        const canvas = canvasRef.current;
        const wrap = wrapRef.current;
        if (!canvas || !wrap) return;

        const cssWidth = Math.max(wrap.clientWidth || 150, 80);
        const controller = new AbortController();

        (async () => {
            try {
                const data = await fetchMediaBytes(src, controller.signal);
                if (controller.signal.aborted) return;
                if (data.byteLength > PDF_THUMB_MAX_BYTES) {
                    onFailRef.current?.();
                    return;
                }
                await renderPdfPageToCanvas({
                    data,
                    pageNumber: 1,
                    cssWidth,
                    canvas,
                    signal: controller.signal,
                });
                if (!controller.signal.aborted) setReady(true);
            } catch {
                if (controller.signal.aborted) return;
                onFailRef.current?.();
            }
        })();

        return () => controller.abort();
    }, [src, visible, fileSizeBytes]);

    return (
        <div ref={wrapRef} className={cn("relative h-full w-full bg-muted", className)}>
            <canvas
                ref={canvasRef}
                className={cn(
                    "h-full w-full object-cover",
                    !ready && "opacity-0",
                )}
            />
        </div>
    );
}
