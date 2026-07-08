import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";

export async function uploadFilesForSubmit(files: File[]): Promise<string[]> {
    if (!files.length) return [];
    const formData = new FormData();
    files.forEach(f => formData.append("files", f));
    const response = await apiClient.post<{ids: string[]}>("/api/auxiliary/media/upload-batch", formData);
    return response.data.ids;
}

/**
 * Recursively replaces every File in `data` with its uploaded media ID (string).
 * Traversal is depth-first; Files are collected and uploaded in a single batch,
 * then substituted back into a structurally identical copy of the original data.
 */
export async function replaceFilesWithIds<T>(data: T): Promise<T> {
    const files: File[] = [];

    function collectFiles(value: unknown): void {
        if (value instanceof File) { files.push(value); return; }
        if (Array.isArray(value)) { value.forEach(collectFiles); return; }
        if (typeof value === "object" && value !== null) {
            Object.values(value as Record<string, unknown>).forEach(collectFiles);
        }
    }
    collectFiles(data);

    if (!files.length) return data;

    const ids = await uploadFilesForSubmit(files);
    let idIndex = 0;

    function replaceFiles(value: unknown): unknown {
        if (value instanceof File) return ids[idIndex++];
        if (Array.isArray(value)) return value.map(replaceFiles);
        if (typeof value === "object" && value !== null) {
            const result: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
                result[k] = replaceFiles(v);
            }
            return result;
        }
        return value;
    }

    return replaceFiles(data) as T;
}
