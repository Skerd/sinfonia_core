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
            } catch {
                if (!controller.signal.aborted) setFailed(true);
            }
        })();
        return () => controller.abort();
    }, [src]);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
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
        window.addEventListener("resize", measure);
        return () => {
            window.clearTimeout(timeout);
            resizeObserver.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, [src, numPages]);

    useEffect(() => {
        const data = dataRef.current;
        const canvas = canvasRef.current;
        if (!data || !canvas || numPages < 1 || failed) return;
        setReady(false);
        const controller = new AbortController();
        const cssWidth = Math.max(box.width || window.innerWidth - 32, 280);
        const cssMaxHeight = Math.max(box.height || Math.floor(window.innerHeight * 0.92), 200);
        (async () => {
            try {
                await renderPdfPageToCanvas({
                    data,
                    pageNumber: page,
                    cssWidth,
                    cssMaxHeight,
                    fit: "contain",
                    canvas,
                    signal: controller.signal,
                });
                if (!controller.signal.aborted) setReady(true);
            } catch {
                if (!controller.signal.aborted) setFailed(true);
            }
        })();
        return () => controller.abort();
    }, [page, numPages, failed, src, box.width, box.height]);

    if (failed) {
        return (
            <p className="text-sm text-muted-foreground p-4">Unable to preview this PDF.</p>
        );
    }

    return (
        <div className={cn("flex min-h-0 w-full flex-col items-center gap-2", className)}>
            <div
                ref={wrapRef}
                className="flex min-h-0 w-full flex-1 items-center justify-center"
            >
                <canvas
                    ref={canvasRef}
                    className={cn(
                        "max-h-full max-w-full",
                        !ready && "min-h-40",
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
