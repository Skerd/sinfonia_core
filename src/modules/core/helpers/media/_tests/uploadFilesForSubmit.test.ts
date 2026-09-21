import {beforeEach, describe, expect, it, vi} from "vitest";

const {postMock} = vi.hoisted(() => ({postMock: vi.fn()}));
vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: {post: postMock}}));

import {
    containsFile,
    MAX_FILES_PER_UPLOAD,
    replaceFilesWithIds,
    uploadFilesForSubmit,
} from "@coreModule/helpers/media/uploadFilesForSubmit.ts";

const file = (name: string) => new File([name], name);
const sentNames = (call: number) => (postMock.mock.calls[call][1] as FormData).getAll("files").map((f) => (f as File).name);

/** Server stub: one id per received file, named after it. */
function echoIds() {
    postMock.mockImplementation(async (_url: string, formData: FormData) => ({
        data: {ids: formData.getAll("files").map((f) => `id-${(f as File).name}`)},
    }));
}

beforeEach(() => {
    postMock.mockReset();
    echoIds();
});

describe("uploadFilesForSubmit", () => {
    it("sends nothing for no files", async () => {
        expect(await uploadFilesForSubmit([])).toEqual([]);
        expect(postMock).not.toHaveBeenCalled();
    });

    it("uploads in one request and passes the abort signal", async () => {
        const signal = new AbortController().signal;
        expect(await uploadFilesForSubmit([file("a"), file("b")], {signal})).toEqual(["id-a", "id-b"]);
        expect(postMock).toHaveBeenCalledExactlyOnceWith("/api/auxiliary/media/upload-batch", expect.any(FormData), {signal});
        expect(sentNames(0)).toEqual(["a", "b"]);
    });

    it("splits files past the per-request limit, keeping order", async () => {
        const files = Array.from({length: MAX_FILES_PER_UPLOAD + 2}, (_, i) => file(`f${i}`));
        const ids = await uploadFilesForSubmit(files);

        expect(postMock).toHaveBeenCalledTimes(2);
        expect(sentNames(0)).toHaveLength(MAX_FILES_PER_UPLOAD);
        expect(sentNames(1)).toEqual([`f${MAX_FILES_PER_UPLOAD}`, `f${MAX_FILES_PER_UPLOAD + 1}`]);
        expect(ids).toEqual(files.map((f) => `id-${f.name}`));
    });

    it.each([
        ["too few ids", {ids: ["x"]}],
        ["no ids", {}],
        ["a non-string id", {ids: ["x", 2]}],
        ["an empty id", {ids: ["x", ""]}],
    ])("throws on %s", async (_label, data) => {
        postMock.mockResolvedValueOnce({data});
        await expect(uploadFilesForSubmit([file("a"), file("b")])).rejects.toThrow(/upload_batch_mismatch/);
    });
});

describe("containsFile", () => {
    it("finds files in arrays and plain objects only", () => {
        expect(containsFile({a: [{b: file("x")}]})).toBe(true);
        expect(containsFile({a: [1, "s", null, undefined]})).toBe(false);
        expect(containsFile(new Map([["k", file("x")]]))).toBe(false);
        expect(containsFile(Object.assign(Object.create(null), {f: file("x")}))).toBe(true);
    });
});

describe("replaceFilesWithIds", () => {
    it("returns the same data when there are no files", async () => {
        const data = {a: 1, b: [2]};
        expect(await replaceFilesWithIds(data)).toBe(data);
        expect(postMock).not.toHaveBeenCalled();
    });

    it("replaces nested files with their ids without touching the original", async () => {
        const a = file("a");
        const b = file("b");
        const data = {title: "x", cover: a, gallery: [{image: b, caption: "c"}], empty: null};

        expect(await replaceFilesWithIds(data)).toEqual({
            title: "x",
            cover: "id-a",
            gallery: [{image: "id-b", caption: "c"}],
            empty: null,
        });
        expect(data.cover).toBe(a);
    });

    it("uploads a file used twice once", async () => {
        const a = file("a");
        expect(await replaceFilesWithIds({first: a, again: [a], other: file("b")})).toEqual({
            first: "id-a",
            again: ["id-a"],
            other: "id-b",
        });
        expect(sentNames(0)).toEqual(["a", "b"]);
    });

    it("passes non-plain objects through unchanged", async () => {
        class Money {
            constructor(public amount: number) {}
            toJSON() { return `${this.amount} CHF`; }
        }
        const date = new Date("2026-01-02T00:00:00Z");
        const blob = new Blob(["x"]);
        const money = new Money(5);
        const result = await replaceFilesWithIds({date, blob, money, file: file("a")});

        expect(result.date).toBe(date);
        expect(result.blob).toBe(blob);
        expect(result.money).toBe(money);
        expect(JSON.parse(JSON.stringify(result))).toEqual({date: "2026-01-02T00:00:00.000Z", blob: {}, money: "5 CHF", file: "id-a"});
    });

    it("keeps a `__proto__` key as data", async () => {
        const data = JSON.parse('{"__proto__": {"polluted": true}, "f": null}');
        data.f = file("a");
        const result = await replaceFilesWithIds(data);

        expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
        expect(Object.hasOwn(result, "__proto__")).toBe(true);
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    it("rejects when the upload fails", async () => {
        postMock.mockRejectedValueOnce(new Error("network"));
        await expect(replaceFilesWithIds({f: file("a")})).rejects.toThrow("network");
    });
});
