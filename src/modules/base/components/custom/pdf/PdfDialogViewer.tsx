import {useEffect, useRef, useState} from "react";
import {ChevronLeft, ChevronRight} from "lucide-react";
import {Button} from "@coreModule/components/ui/button.tsx";
import Loader from "@baseModule/components/custom/loader/loader.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {fetchMediaBytes} from "@baseModule/helpers/media/fetchMediaBytes.ts";
import {
    isAbortError,
    openPdfDocument,
    renderPdfPageToCanvas,
    type PdfDocument,
} from "@baseModule/components/custom/pdf/renderPdfPage.ts";

type PdfDialogViewerProps = {
    src: string;
    className?: string;
};

/** Ignore size jitter below this many pixels so scrollbars and rounding do not trigger re-renders. */
const RESIZE_TOLERANCE = 8;
const RESIZE_DEBOUNCE_MS = 120;
const MIN_RENDER_SIZE = 40;

/**
 * Full-size PDF preview with page navigation. The document is parsed once per `src`;
 * turning pages only renders the new page.
 */
export default function PdfDialogViewer({src, className}: PdfDialogViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const [pdf, setPdf] = useState<PdfDocument | null>(null);
    const [page, setPage] = useState(1);
    const [failed, setFailed] = useState(false);
    const [ready, setReady] = useState(false);
    const [rendering, setRendering] = useState(false);
    const [box, setBox] = useState({width: 0, height: 0});
    const numPages = pdf?.numPages ?? 0;

    useEffect(() => {
        setPdf(null);
        setPage(1);
        setFailed(false);
        setReady(false);
        const controller = new AbortController();
        (async () => {
            try {
                const data = await fetchMediaBytes(src, controller.signal);
                const opened = await openPdfDocument(data, controller.signal);
                setPdf(opened);
            } catch (err) {
                if (!isAbortError(err, controller.signal)) setFailed(true);
            }
        })();
        return () => controller.abort();
    }, [src]);

    /*
     * Destroy with the state that holds the document, not in the fetch cleanup: the render
     * effect below is aborted in the same commit, so an in-flight render never sees a
     * destroyed document as a real failure.
     */
    useEffect(() => {
        if (!pdf) return;
        return () => void pdf.destroy();
    }, [pdf]);

    /*
     * Measure a box that does not include the canvas in its layout. Sizing the
     * wrap from the canvas (or toggling min-height while rendering) feeds
     * ResizeObserver and re-renders forever.
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
    }, [failed]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!pdf || !canvas) return;
        if (box.width < MIN_RENDER_SIZE || box.height < MIN_RENDER_SIZE) return;
        const controller = new AbortController();
        setRendering(true);
        (async () => {
            try {
                const result = await renderPdfPageToCanvas(pdf, {
                    pageNumber: page,
                    cssWidth: box.width,
                    cssMaxHeight: box.height,
                    fit: "contain",
                    canvas,
                    signal: controller.signal,
                });
                if (controller.signal.aborted) return;
                canvas.style.width = `${result.cssWidth}px`;
                canvas.style.height = `${result.cssHeight}px`;
                setReady(true);
                setRendering(false);
            } catch (err) {
                if (!isAbortError(err, controller.signal)) setFailed(true);
            }
        })();
        return () => controller.abort();
    }, [pdf, page, box.width, box.height]);

    if (failed) {
        return (
            <p className="text-sm text-muted-foreground p-4">Unable to preview this PDF.</p>
        );
    }

    const goTo = (next: number) => setPage(Math.min(Math.max(next, 1), numPages));

    return (
        <div
            className={cn(
                "flex h-[min(85vh,52rem)] w-[min(96vw,56rem)] max-w-full min-h-0 flex-col items-center gap-2",
                className,
            )}
        >
            <div ref={wrapRef} className="relative min-h-0 w-full flex-1">
                <canvas
                    ref={canvasRef}
                    role="img"
                    aria-label={numPages > 0 ? `PDF page ${page} of ${numPages}` : "PDF preview"}
                    className={cn(
                        "absolute inset-0 m-auto max-h-full max-w-full bg-white shadow-sm transition-opacity",
                        !ready && "opacity-0",
                    )}
                />
                {!ready && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader inline className="size-6 text-muted-foreground" />
                    </div>
                )}
            </div>
            {numPages > 1 && (
                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Previous page"
                        disabled={page <= 1}
                        onClick={() => goTo(page - 1)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span
                        className={cn(
                            "min-w-16 text-center text-sm text-muted-foreground tabular-nums",
                            rendering && ready && "opacity-60",
                        )}
                        aria-live="polite"
                    >
                        {page} / {numPages}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Next page"
                        disabled={page >= numPages}
                        onClick={() => goTo(page + 1)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
