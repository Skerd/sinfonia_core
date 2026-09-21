import type {PDFDocumentProxy} from "pdfjs-dist";
import {getSharedPdfWorker, loadPdfjs, pdfjsAssetParams} from "@coreModule/helpers/general/pdfjsWorker.ts";

const MAX_CONCURRENT = 2;
const DPR_CAP = 2;

export type PdfDocument = PDFDocumentProxy;

function abortError(): DOMException {
    return new DOMException("Aborted", "AbortError");
}

function throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) throw abortError();
}

export function isAbortError(err: unknown, signal?: AbortSignal): boolean {
    return !!signal?.aborted || (err instanceof DOMException && err.name === "AbortError");
}

/* ---------- render slots ---------- */

let active = 0;
const waiters: Array<() => void> = [];

/** Waits for a free slot. An aborted waiter leaves the queue instead of holding its place. */
function acquireSlot(signal?: AbortSignal): Promise<void> {
    throwIfAborted(signal);
    if (active < MAX_CONCURRENT) {
        active += 1;
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        const onAbort = () => {
            const index = waiters.indexOf(grant);
            if (index >= 0) waiters.splice(index, 1);
            reject(abortError());
        };
        const grant = () => {
            signal?.removeEventListener("abort", onAbort);
            resolve();
        };
        waiters.push(grant);
        signal?.addEventListener("abort", onAbort, {once: true});
    });
}

/** Hands the slot straight to the next waiter so a new caller cannot slip in and exceed the cap. */
function releaseSlot(): void {
    const next = waiters.shift();
    if (next) next();
    else active -= 1;
}

async function withRenderSlot<T>(signal: AbortSignal | undefined, fn: () => Promise<T>): Promise<T> {
    await acquireSlot(signal);
    try {
        throwIfAborted(signal);
        return await fn();
    } finally {
        releaseSlot();
    }
}

/* ---------- documents ---------- */

/** Parses PDF bytes. The caller owns the result and must `destroy()` it. */
export async function openPdfDocument(data: Uint8Array, signal?: AbortSignal): Promise<PdfDocument> {
    throwIfAborted(signal);
    const pdfjs = await loadPdfjs();
    throwIfAborted(signal);

    // pdf.js transfers the buffer to the worker, which would detach the caller's copy.
    const task = pdfjs.getDocument({
        data: data.slice(),
        worker: getSharedPdfWorker(pdfjs),
        ...pdfjsAssetParams(),
    });
    const onAbort = () => void task.destroy();
    signal?.addEventListener("abort", onAbort, {once: true});
    try {
        const pdf = await task.promise;
        if (signal?.aborted) {
            await pdf.destroy();
            throw abortError();
        }
        return pdf;
    } catch (err) {
        throw signal?.aborted ? abortError() : err;
    } finally {
        signal?.removeEventListener("abort", onAbort);
    }
}

/* ---------- rendering ---------- */

export type RenderPdfPageOptions = {
    pageNumber: number;
    cssWidth: number;
    /** When set, scale also fits this height (`contain`) or fills it (`cover`). */
    cssMaxHeight?: number;
    /** `cover` fills the box (crops); default `contain` keeps the full page visible. */
    fit?: "contain" | "cover";
    canvas: HTMLCanvasElement;
    signal?: AbortSignal;
};

export type RenderPdfPageResult = {
    numPages: number;
    /** CSS size of the rendered page; the canvas bitmap is this times the device pixel ratio. */
    cssWidth: number;
    cssHeight: number;
};

/**
 * Draws into an offscreen canvas and copies it over when finished. The visible canvas keeps
 * its previous page until then (no blank flash), and overlapping renders never share a canvas,
 * which pdf.js rejects.
 */
async function renderPage(pdf: PdfDocument, options: RenderPdfPageOptions): Promise<RenderPdfPageResult> {
    const {pageNumber, cssWidth, cssMaxHeight, fit = "contain", canvas, signal} = options;
    if (!(cssWidth > 0)) throw new Error("pdf_css_width_invalid");

    const numPages = pdf.numPages;
    const page = await pdf.getPage(Math.min(Math.max(Math.round(pageNumber), 1), numPages));
    try {
        throwIfAborted(signal);

        const unscaled = page.getViewport({scale: 1});
        const scaleByWidth = cssWidth / unscaled.width;
        const scaleByHeight = cssMaxHeight != null && cssMaxHeight > 0 ? cssMaxHeight / unscaled.height : scaleByWidth;
        const scale = fit === "cover" ? Math.max(scaleByWidth, scaleByHeight) : Math.min(scaleByWidth, scaleByHeight);
        const viewport = page.getViewport({scale});
        const outputScale = Math.min(window.devicePixelRatio || 1, DPR_CAP);

        const offscreen = document.createElement("canvas");
        offscreen.width = Math.max(1, Math.floor(viewport.width * outputScale));
        offscreen.height = Math.max(1, Math.floor(viewport.height * outputScale));

        const renderTask = page.render({
            canvas: offscreen,
            viewport,
            transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
        });
        const onAbort = () => renderTask.cancel();
        signal?.addEventListener("abort", onAbort, {once: true});
        try {
            await renderTask.promise;
        } catch (err) {
            // A cancelled render rejects with RenderingCancelledException; report it as an abort.
            throw signal?.aborted ? abortError() : err;
        } finally {
            signal?.removeEventListener("abort", onAbort);
        }
        throwIfAborted(signal);

        const context = canvas.getContext("2d");
        if (!context) throw new Error("canvas_context_unavailable");
        canvas.width = offscreen.width;
        canvas.height = offscreen.height;
        context.drawImage(offscreen, 0, 0);
        offscreen.width = 0;
        offscreen.height = 0;

        return {numPages, cssWidth: Math.floor(viewport.width), cssHeight: Math.floor(viewport.height)};
    } finally {
        page.cleanup();
    }
}

/** Renders one page of an already opened document. */
export function renderPdfPageToCanvas(
    pdf: PdfDocument,
    options: RenderPdfPageOptions,
): Promise<RenderPdfPageResult> {
    return withRenderSlot(options.signal, () => renderPage(pdf, options));
}

/** Opens `data`, renders one page and closes the document again. Suits one-off thumbnails. */
export function renderPdfBytesToCanvas(
    data: Uint8Array,
    options: RenderPdfPageOptions,
): Promise<RenderPdfPageResult> {
    return withRenderSlot(options.signal, async () => {
        const pdf = await openPdfDocument(data, options.signal);
        try {
            return await renderPage(pdf, options);
        } finally {
            void pdf.destroy();
        }
    });
}
