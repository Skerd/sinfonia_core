import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

const {getMock} = vi.hoisted(() => ({getMock: vi.fn()}));
vi.mock("@baseModule/helpers/apiClient/apiClient.ts", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@baseModule/helpers/apiClient/apiClient.ts")>();
    return {isSameOrigin: actual.isSameOrigin, default: {get: getMock}};
});

import {fetchMediaBytes, fetchMediaText} from "@baseModule/helpers/media/fetchMediaBytes.ts";

const encode = (text: string) => new TextEncoder().encode(text);

/** A body that yields `chunks` and records how far it was read. */
function trackedStream(chunks: Uint8Array[]) {
    const state = {pulled: 0, cancelled: false};
    const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
            if (state.pulled >= chunks.length) return controller.close();
            controller.enqueue(chunks[state.pulled++]);
        },
        cancel() {
            state.cancelled = true;
        },
    });
    return {stream, state};
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
    getMock.mockReset();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("fetchMediaBytes", () => {
    it.each(["/api/auxiliary/media/1", `${window.location.origin}/api/auxiliary/media/1`])(
        "loads same-origin %s through apiClient",
        async (src) => {
            const signal = new AbortController().signal;
            getMock.mockResolvedValueOnce({data: encode("pdf").buffer});

            expect([...await fetchMediaBytes(src, signal)]).toEqual([...encode("pdf")]);
            expect(getMock).toHaveBeenCalledExactlyOnceWith(src, {responseType: "arraybuffer", signal});
            expect(fetchMock).not.toHaveBeenCalled();
        },
    );

    it.each(["https://cdn.example.com/booklet.pdf", "blob:http://localhost/abc", "data:application/pdf;base64,AA=="])(
        "loads %s with a credential-free fetch",
        async (src) => {
            fetchMock.mockResolvedValueOnce(new Response(encode("pdf")));

            expect([...await fetchMediaBytes(src)]).toEqual([...encode("pdf")]);
            expect(fetchMock).toHaveBeenCalledExactlyOnceWith(src, {signal: undefined, credentials: "omit"});
            expect(getMock).not.toHaveBeenCalled();
        },
    );

    it("throws on a failed external response", async () => {
        fetchMock.mockResolvedValueOnce(new Response("nope", {status: 404}));
        await expect(fetchMediaBytes("https://cdn.example.com/x.pdf")).rejects.toThrow("media_bytes_404");
    });
});

describe("fetchMediaText", () => {
    it("streams same-origin media through apiClient's fetch adapter", async () => {
        const {stream} = trackedStream([encode("hello "), encode("world")]);
        getMock.mockResolvedValueOnce({data: stream});
        const signal = new AbortController().signal;

        expect(await fetchMediaText("/api/auxiliary/media/1", signal)).toBe("hello world");
        expect(getMock).toHaveBeenCalledExactlyOnceWith("/api/auxiliary/media/1", {adapter: "fetch", responseType: "stream", signal});
    });

    it("stops downloading at the byte limit", async () => {
        const {stream, state} = trackedStream([encode("abcd"), encode("efgh"), encode("ijkl"), encode("mnop")]);
        getMock.mockResolvedValueOnce({data: stream});

        expect(await fetchMediaText("/api/m", undefined, 6)).toBe("abcdef");
        expect(state.pulled).toBeLessThan(4);
        expect(state.cancelled).toBe(true);
    });

    it("drops a multi-byte character cut by the limit instead of printing �", async () => {
        const {stream} = trackedStream([encode("ab€")]); // € is 3 bytes
        getMock.mockResolvedValueOnce({data: stream});
        expect(await fetchMediaText("/api/m", undefined, 4)).toBe("ab");
    });

    it("keeps a complete file that ends exactly at the limit", async () => {
        const {stream} = trackedStream([encode("ab€")]);
        getMock.mockResolvedValueOnce({data: stream});
        expect(await fetchMediaText("/api/m", undefined, 5)).toBe("ab€");
    });

    it("reads external text without credentials", async () => {
        fetchMock.mockResolvedValueOnce(new Response("remote"));
        expect(await fetchMediaText("https://cdn.example.com/a.txt")).toBe("remote");
        expect(fetchMock).toHaveBeenCalledWith("https://cdn.example.com/a.txt", {signal: undefined, credentials: "omit"});
    });

    it("returns an empty string for an empty body", async () => {
        fetchMock.mockResolvedValueOnce(new Response(null));
        expect(await fetchMediaText("blob:http://localhost/x")).toBe("");
    });
});
