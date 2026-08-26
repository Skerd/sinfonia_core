import {ensurePdfjsWorker} from "@coreModule/helpers/pdf/pdfjsWorker.ts";

const MAX_CONCURRENT = 2;
const DPR_CAP = 2;

let active = 0;
const waiters: Array<() => void> = [];

async function withPdfRenderSlot<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= MAX_CONCURRENT) {
        await new Promise<void>((resolve) => {
            waiters.push(resolve);
        });
    }
    active += 1;
    try {
        return await fn();
    } finally {
        active -= 1;
        waiters.shift()?.();
    }
}

export type RenderPdfPageOptions = {
    data: Uint8Array;
    pageNumber: number;
    cssWidth: number;
    canvas: HTMLCanvasElement;
    signal?: AbortSignal;
};

export type RenderPdfPageResult = {
    numPages: number;
};

export async function renderPdfPageToCanvas(options: RenderPdfPageOptions): Promise<RenderPdfPageResult> {
    const {data, pageNumber, cssWidth, canvas, signal} = options;
    if (cssWidth <= 0) {
        throw new Error("pdf_css_width_invalid");
    }
    if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
    }

    return withPdfRenderSlot(async () => {
        if (signal?.aborted) {
            throw new DOMException("Aborted", "AbortError");
        }
        const pdfjs = await import("pdfjs-dist");
        ensurePdfjsWorker(pdfjs);

        const copy = new Uint8Array(data);
        const task = pdfjs.getDocument({data: copy});
        const onAbort = () => {
            void task.destroy();
        };
        signal?.addEventListener("abort", onAbort, {once: true});

        try {
            const pdf = await task.promise;
            if (signal?.aborted) {
                await pdf.destroy();
                throw new DOMException("Aborted", "AbortError");
            }

            const numPages = pdf.numPages;
            const page = await pdf.getPage(Math.min(Math.max(pageNumber, 1), numPages));
            if (signal?.aborted) {
                await pdf.destroy();
                throw new DOMException("Aborted", "AbortError");
            }

            const unscaled = page.getViewport({scale: 1});
            const scale = cssWidth / unscaled.width;
            const viewport = page.getViewport({scale});
            const outputScale = Math.min(window.devicePixelRatio || 1, DPR_CAP);

            canvas.width = Math.floor(viewport.width * outputScale);
            canvas.height = Math.floor(viewport.height * outputScale);
            canvas.style.width = `${Math.floor(viewport.width)}px`;
            canvas.style.height = `${Math.floor(viewport.height)}px`;

            const context = canvas.getContext("2d");
            if (!context) {
                await pdf.destroy();
                throw new Error("canvas_context_unavailable");
            }

            await page.render({
                canvasContext: context,
                canvas,
                viewport,
                transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
            }).promise;

            await pdf.destroy();
            return {numPages};
        } finally {
            signal?.removeEventListener("abort", onAbort);
        }
    });
}

export async function getPdfPageCount(data: Uint8Array, signal?: AbortSignal): Promise<number> {
    const pdfjs = await import("pdfjs-dist");
    ensurePdfjsWorker(pdfjs);
    const copy = new Uint8Array(data);
    const task = pdfjs.getDocument({data: copy});
    const onAbort = () => {
        void task.destroy();
    };
    signal?.addEventListener("abort", onAbort, {once: true});
    try {
        const pdf = await task.promise;
        const numPages = pdf.numPages;
        await pdf.destroy();
        return numPages;
    } finally {
        signal?.removeEventListener("abort", onAbort);
    }
}
