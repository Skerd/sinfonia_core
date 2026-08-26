import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";

function isLocalBlobOrData(src: string): boolean {
    return src.startsWith("blob:") || src.startsWith("data:");
}

/**
 * Load a media URL as bytes. Blob/data URLs use `fetch`; API paths go through `apiClient`
 * so auth headers are attached.
 */
export async function fetchMediaBytes(src: string, signal?: AbortSignal): Promise<Uint8Array> {
    if (isLocalBlobOrData(src)) {
        const res = await fetch(src, {signal});
        if (!res.ok) throw new Error(`media_bytes_${res.status}`);
        return new Uint8Array(await res.arrayBuffer());
    }
    const res = await apiClient.get<ArrayBuffer>(src, {
        responseType: "arraybuffer",
        signal,
    });
    return new Uint8Array(res.data);
}

export async function fetchMediaText(src: string, signal?: AbortSignal, maxBytes = 512 * 1024): Promise<string> {
    const bytes = await fetchMediaBytes(src, signal);
    const sliced = bytes.byteLength > maxBytes ? bytes.subarray(0, maxBytes) : bytes;
    return new TextDecoder("utf-8", {fatal: false}).decode(sliced);
}
