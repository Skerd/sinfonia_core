type PdfjsModule = typeof import("pdfjs-dist");

let configuredFor: PdfjsModule | null = null;

/**
 * Point pdf.js at the worker copied into `/public/pdf.worker.min.mjs`.
 * Safe to call more than once; no-ops after the first configuration per module instance.
 */
export function ensurePdfjsWorker(pdfjs: PdfjsModule): void {
    if (configuredFor === pdfjs) return;
    pdfjs.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.mjs`;
    configuredFor = pdfjs;
}
