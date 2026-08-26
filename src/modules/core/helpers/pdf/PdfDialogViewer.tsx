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
    const [page, setPage] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [failed, setFailed] = useState(false);
    const [ready, setReady] = useState(false);
    const dataRef = useRef<Uint8Array | null>(null);

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
        const data = dataRef.current;
        const canvas = canvasRef.current;
        if (!data || !canvas || numPages < 1 || failed) return;
        setReady(false);
        const controller = new AbortController();
        const cssWidth = Math.min(Math.max(window.innerWidth * 0.7, 320), 900);
        (async () => {
            try {
                await renderPdfPageToCanvas({
                    data,
                    pageNumber: page,
                    cssWidth,
                    canvas,
                    signal: controller.signal,
                });
                if (!controller.signal.aborted) setReady(true);
            } catch {
                if (!controller.signal.aborted) setFailed(true);
            }
        })();
        return () => controller.abort();
    }, [page, numPages, failed, src]);

    if (failed) {
        return (
            <p className="text-sm text-muted-foreground p-4">Unable to preview this PDF.</p>
        );
    }

    return (
        <div className={cn("flex flex-col items-center gap-2", className)}>
            <canvas
                ref={canvasRef}
                className={cn("max-h-[75vh] max-w-full rounded-lg", !ready && "min-h-40")}
            />
            {numPages > 1 && (
                <div className="flex items-center gap-2">
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
