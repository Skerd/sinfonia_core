import apiClient from "@baseModule/helpers/apiClient/apiClient.ts";

const UPLOAD_BATCH_URL = "/api/auxiliary/media/upload-batch";

/** `upload-batch` accepts at most this many files per request (maestro `media.ts`). */
export const MAX_FILES_PER_UPLOAD = 50;

export type UploadOptions = {signal?: AbortSignal};

/**
 * Uploads `files` and returns their media ids in the same order. More files than one request
 * allows are sent in consecutive batches. Throws if the server does not return one id per file.
 */
export async function uploadFilesForSubmit(files: File[], {signal}: UploadOptions = {}): Promise<string[]> {
    const ids: string[] = [];
    for (let start = 0; start < files.length; start += MAX_FILES_PER_UPLOAD) {
        const batch = files.slice(start, start + MAX_FILES_PER_UPLOAD);
        const formData = new FormData();
        batch.forEach((file) => formData.append("files", file));

        const response = await apiClient.post<{ids?: unknown}>(UPLOAD_BATCH_URL, formData, {signal});
        const batchIds = response.data?.ids;
        const valid = Array.isArray(batchIds)
            && batchIds.length === batch.length
            && batchIds.every((id) => typeof id === "string" && id !== "");
        if (!valid) {
            throw new Error(`upload_batch_mismatch: sent ${batch.length} file(s), got ${JSON.stringify(batchIds)}`);
        }
        ids.push(...(batchIds as string[]));
    }
    return ids;
}

/**
 * Only arrays and plain objects are walked. Everything else (`Date`, `Blob`, `Map`, class
 * instances such as dayjs) is passed through untouched so its own serialization still applies.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== "object" || value === null) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

function collectFiles(value: unknown, found: Set<File>): void {
    if (value instanceof File) found.add(value);
    else if (Array.isArray(value)) value.forEach((item) => collectFiles(item, found));
    else if (isPlainObject(value)) Object.values(value).forEach((item) => collectFiles(item, found));
}

/** Whether `value` holds a `File` anywhere `replaceFilesWithIds` would replace one. */
export function containsFile(value: unknown): boolean {
    if (value instanceof File) return true;
    if (Array.isArray(value)) return value.some(containsFile);
    if (isPlainObject(value)) return Object.values(value).some(containsFile);
    return false;
}

function replaceFiles(value: unknown, idOf: Map<File, string>): unknown {
    if (value instanceof File) return idOf.get(value);
    if (Array.isArray(value)) return value.map((item) => replaceFiles(item, idOf));
    if (isPlainObject(value)) {
        // `fromEntries` defines own properties, so a `__proto__` key stays data.
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceFiles(item, idOf)]));
    }
    return value;
}

/**
 * Returns a copy of `data` with every `File` replaced by its uploaded media id.
 * Each distinct file is uploaded once, even if it appears in several places.
 */
export async function replaceFilesWithIds<T>(data: T, options: UploadOptions = {}): Promise<T> {
    const found = new Set<File>();
    collectFiles(data, found);
    if (found.size === 0) return data;

    const files = [...found];
    const ids = await uploadFilesForSubmit(files, options);
    const idOf = new Map(files.map((file, index) => [file, ids[index]]));
    return replaceFiles(data, idOf) as T;
}
