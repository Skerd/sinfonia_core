type PdfjsModule = typeof import("pdfjs-dist");
type PdfWorker = InstanceType<PdfjsModule["PDFWorker"]>;

let configuredFor: PdfjsModule | null = null;
let pdfjsPromise: Promise<PdfjsModule> | null = null;
let sharedWorker: PdfWorker | null = null;

/**
 * Point pdf.js at the worker copied into `/public/pdf.worker.min.mjs`.
 * Safe to call more than once; no-ops after the first configuration per module instance.
 */
export function ensurePdfjsWorker(pdfjs: PdfjsModule): void {
    if (configuredFor === pdfjs) return;
    pdfjs.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.mjs`;
    configuredFor = pdfjs;
}

/** Lazy-loads pdf.js once and configures its worker. A failed chunk load is retried on the next call. */
export function loadPdfjs(): Promise<PdfjsModule> {
    pdfjsPromise ??= import("pdfjs-dist").then(
        (pdfjs) => {
            ensurePdfjsWorker(pdfjs);
            return pdfjs;
        },
        (err: unknown) => {
            pdfjsPromise = null;
            throw err;
        },
    );
    return pdfjsPromise;
}

/**
 * One worker for every document. Without it pdf.js spins up a new Worker per `getDocument`,
 * so a grid of thumbnails would start one thread per tile.
 */
export function getSharedPdfWorker(pdfjs: PdfjsModule): PdfWorker {
    if (!sharedWorker || sharedWorker.destroyed) {
        sharedWorker = new pdfjs.PDFWorker();
    }
    return sharedWorker;
}

/**
 * CMaps, standard fonts and wasm decoders copied to the site root by `vite.config.ts`.
 * Without them PDFs with CJK text, non-embedded base fonts or JPEG 2000 images render wrong.
 */
export function pdfjsAssetParams() {
    const base = import.meta.env.BASE_URL;
    return {
        cMapUrl: `${base}cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `${base}standard_fonts/`,
        wasmUrl: `${base}wasm/`,
    };
}
