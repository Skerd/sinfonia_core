import {beforeEach, describe, expect, it, vi} from "vitest";

const {requestMock, toastError} = vi.hoisted(() => ({requestMock: vi.fn(), toastError: vi.fn()}));
vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: {request: requestMock}}));
vi.mock("sonner", () => ({toast: {error: toastError}}));

const {downloadFromApi} = await import("../downloadFromApi.ts");

beforeEach(() => {
    requestMock.mockReset();
    toastError.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
    URL.createObjectURL = vi.fn(() => "blob:file");
    URL.revokeObjectURL = vi.fn();
});

describe("downloadFromApi", () => {
    it("asks for a blob and saves it under the given name", async () => {
        const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
        requestMock.mockResolvedValueOnce({data: new Blob(["pdf"])});
        await expect(downloadFromApi({url: "/api/x/pdf/1", fileName: "R-1.pdf"})).resolves.toBe(true);
        expect(requestMock.mock.calls[0][0]).toMatchObject({method: "get", url: "/api/x/pdf/1", responseType: "blob"});
        const link = click.mock.contexts[0] as HTMLAnchorElement;
        expect(link.download).toBe("R-1.pdf");
        expect(link.href).toBe("blob:file");
        expect(toastError).not.toHaveBeenCalled();
    });

    it("toasts the server's message read from a blob error body", async () => {
        requestMock.mockRejectedValueOnce({response: {status: 404, data: new Blob([JSON.stringify({message: "Not found"})])}});
        const t = (key: string) => (key === "axios.error.title" ? "Failed" : key);
        await expect(downloadFromApi({url: "/api/x", fileName: "x.pdf", resolveLanguageKey: t})).resolves.toBe(false);
        expect(toastError).toHaveBeenCalledWith("Failed: Not found");
    });

    it("stays quiet on an expired session", async () => {
        requestMock.mockRejectedValueOnce({response: {status: 401, data: {}}});
        await expect(downloadFromApi({url: "/api/x", fileName: "x.pdf"})).resolves.toBe(false);
        expect(toastError).not.toHaveBeenCalled();
    });
});
