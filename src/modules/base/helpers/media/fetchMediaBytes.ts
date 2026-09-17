import apiClient, {isSameOrigin} from "@baseModule/helpers/apiClient/apiClient.ts";

/** Default cap for `fetchMediaText`, matching the text preview. */
export const DEFAULT_TEXT_MAX_BYTES = 512 * 1024;

/**
 * Only this app's API gets `apiClient` (and with it the auth headers). Blob/data URLs and other
 * origins use a plain `fetch` without credentials.
 */
function isApiSource(src: string): boolean {
    return !src.startsWith("blob:") && !src.startsWith("data:") && isSameOrigin(src);
}

async function fetchWithoutCredentials(src: string, signal?: AbortSignal): Promise<Response> {
    const res = await fetch(src, {signal, credentials: "omit"});
    if (!res.ok) throw new Error(`media_bytes_${res.status}`);
    return res;
}

/** Load a media URL as bytes. */
export async function fetchMediaBytes(src: string, signal?: AbortSignal): Promise<Uint8Array> {
    if (isApiSource(src)) {
        const res = await apiClient.get<ArrayBuffer>(src, {responseType: "arraybuffer", signal});
        return new Uint8Array(res.data);
    }
    const res = await fetchWithoutCredentials(src, signal);
    return new Uint8Array(await res.arrayBuffer());
}

async function openMediaStream(src: string, signal?: AbortSignal): Promise<ReadableStream<Uint8Array> | null> {
    if (isApiSource(src)) {
        const res = await apiClient.get<ReadableStream<Uint8Array>>(src, {adapter: "fetch", responseType: "stream", signal});
        return res.data;
    }
    return (await fetchWithoutCredentials(src, signal)).body;
}

/** Reads up to `maxBytes`, then cancels the stream so the rest is never downloaded. */
async function readAtMost(stream: ReadableStream<Uint8Array>, maxBytes: number): Promise<{bytes: Uint8Array; truncated: boolean}> {
    const reader = stream.getReader();
    const bytes = new Uint8Array(maxBytes);
    let size = 0;
    try {
        while (size < maxBytes) {
            const {done, value} = await reader.read();
            if (done) return {bytes: bytes.subarray(0, size), truncated: false};
            const take = Math.min(value.byteLength, maxBytes - size);
            bytes.set(value.subarray(0, take), size);
            size += take;
        }
        return {bytes, truncated: true};
    } finally {
        await reader.cancel().catch(() => undefined);
    }
}

/** Load the first `maxBytes` of a media URL as UTF-8 text, without downloading the rest. */
export async function fetchMediaText(src: string, signal?: AbortSignal, maxBytes = DEFAULT_TEXT_MAX_BYTES): Promise<string> {
    const stream = await openMediaStream(src, signal);
    if (!stream) return "";
    const {bytes, truncated} = await readAtMost(stream, maxBytes);
    // `stream: true` holds back a multi-byte character cut in half by the limit instead of printing `�`.
    return new TextDecoder("utf-8").decode(bytes, {stream: truncated});
}
