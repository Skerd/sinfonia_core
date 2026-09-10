import {useEffect, useRef, useState} from "react";
import {ChevronLeft, ChevronRight} from "lucide-react";
import {Button} from "@coreModule/components/ui/button.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {fetchMediaBytes} from "@coreModule/helpers/media/fetchMediaBytes.ts";
import {getPdfPageCount, renderPdfPageToCanvas} from "@coreModule/helpers/pdf/renderPdfPage.ts";

type PdfDialogViewerProps = {
    src: string;
    className?: string;
};

function isAbort(err: unknown, signal: AbortSignal): boolean {
    return signal.aborted || (err instanceof DOMException && err.name === "AbortError");
}

export default function PdfDialogViewer({src, className}: PdfDialogViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const dataRef = useRef<Uint8Array | null>(null);
    const [page, setPage] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [failed, setFailed] = useState(false);
    const [ready, setReady] = useState(false);
    const [box, setBox] = useState({width: 0, height: 0});

    useEffect(() => {
        setPage(1);
        setNumPages(0);
        setFailed(false);
        setReady(false);
        dataRef.current = null;
        const controller = new AbortController();
        (async () => {
            try {
                const data = await fetchMediaBytes(src, controller.signal);
                if (controller.signal.aborted) return;
                dataRef.current = data;
                const count = await getPdfPageCount(data, controller.signal);
                if (controller.signal.aborted) return;
                setNumPages(count);
            } catch (err) {
                if (!isAbort(err, controller.signal)) setFailed(true);
            }
        })();
        return () => controller.abort();
    }, [src]);

    /*
     * Measure a box that does not include the canvas in its layout. Sizing the
     * wrap from the canvas (or toggling min-height while rendering) feeds
     * ResizeObserver and re-fetches/re-renders forever.
     */
    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        let timeout = 0;
        const measure = () => {
            const width = Math.round(el.clientWidth);
            const height = Math.round(el.clientHeight);
            window.clearTimeout(timeout);
            timeout = window.setTimeout(() => {
                setBox((current) => {
                    if (Math.abs(current.width - width) < 8 && Math.abs(current.height - height) < 8) {
                        return current;
                    }
                    return {width, height};
                });
            }, 120);
        };
        measure();
        const frame = window.requestAnimationFrame(measure);
        const resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(el);
        window.addEventListener("resize", measure);
        return () => {
            window.clearTimeout(timeout);
            window.cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, [src]);

    useEffect(() => {
        const data = dataRef.current;
        const canvas = canvasRef.current;
        if (!data || !canvas || numPages < 1 || failed) return;
        if (box.width < 40 || box.height < 40) return;
        const controller = new AbortController();
        (async () => {
            try {
                await renderPdfPageToCanvas({
                    data,
                    pageNumber: page,
                    cssWidth: box.width,
                    cssMaxHeight: box.height,
                    fit: "contain",
                    canvas,
                    signal: controller.signal,
                });
                if (!controller.signal.aborted) setReady(true);
            } catch (err) {
                if (!isAbort(err, controller.signal)) setFailed(true);
            }
        })();
        return () => controller.abort();
    }, [page, numPages, failed, box.width, box.height]);

    if (failed) {
        return (
            <p className="text-sm text-muted-foreground p-4">Unable to preview this PDF.</p>
        );
    }

    return (
        <div
            className={cn(
                "flex h-[min(85vh,52rem)] w-[min(96vw,56rem)] max-w-full min-h-0 flex-col items-center gap-2",
                className,
            )}
        >
            <div
                ref={wrapRef}
                className="relative min-h-0 w-full flex-1"
            >
                <canvas
                    ref={canvasRef}
                    className={cn(
                        "absolute inset-0 m-auto max-h-full max-w-full",
                        !ready && "opacity-0",
                    )}
                />
            </div>
            {numPages > 1 && (
                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground tabular-nums">
                        {page} / {numPages}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={page >= numPages}
                        onClick={() => setPage((p) => Math.min(numPages, p + 1))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
