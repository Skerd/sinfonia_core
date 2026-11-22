import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {type ComponentType, useEffect} from "react";
import {toast} from "sonner";

const {apiClientMock, replaceFilesWithIdsMock} = vi.hoisted(() => ({
    apiClientMock: vi.fn(),
    replaceFilesWithIdsMock: vi.fn(),
}));

vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: apiClientMock}));
vi.mock("sonner", () => ({toast: Object.assign(vi.fn(), {loading: vi.fn(), success: vi.fn(), error: vi.fn(), dismiss: vi.fn()})}));
vi.mock("@coreModule/helpers/general/config.ts", () => ({
    getClientConfig: () => ({debugging: {enableFormPostInfo: false, enableFormResponseSuccessInfo: false, enableFormResponseErrorInfo: false}}),
}));
vi.mock("@coreModule/helpers/media/uploadFilesForSubmit.ts", async (importOriginal) => ({
    ...await importOriginal<typeof import("@coreModule/helpers/media/uploadFilesForSubmit.ts")>(),
    replaceFilesWithIds: replaceFilesWithIdsMock,
}));
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key}/>,
}));
vi.mock("@coreModule/components/custom/errors/errorViewWrapper.tsx", () => ({
    default: ({title, onClick}: { title: string; onClick: () => void }) => <button onClick={onClick}>{title}</button>,
}));

import withAxiosHoc, {type WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import type {HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";

/** Test views take only injected props, so the wrapped result needs no props of its own. */
const withAxios = <R,>(httpRequest: HttpRequest, childPost?: boolean) =>
    (component: ComponentType<WithAxiosType<R>>) =>
        withAxiosHoc<R>(httpRequest, childPost)(component as never) as unknown as ComponentType;

type Response = { value: string };

function View({data, loading, onPost}: WithAxiosType<Response>) {
    return (
        <div>
            <p data-testid="data">{data?.value ?? "none"}</p>
            <p data-testid="loading">{String(loading)}</p>
            <button onClick={() => void onPost({file: new File(["x"], "a.txt")}).catch(() => undefined)}>post-file</button>
            <button onClick={() => void onPost({plain: true})}>post-plain</button>
        </div>
    );
}

const sentBodies = () => apiClientMock.mock.calls.map(([config]) => config.data);

describe("withAxios", () => {
    beforeEach(() => {
        apiClientMock.mockReset();
        replaceFilesWithIdsMock.mockReset();
    });

    it("shows a retryable error when the first load fails, then renders the component", async () => {
        apiClientMock
            .mockRejectedValueOnce({response: {status: 500, data: {message: "boom"}}})
            .mockResolvedValueOnce({data: {value: "loaded"}});
        const Wrapped = withAxios<Response>({method: "get", url: "/api/x"})(View);

        render(<Wrapped/>);

        fireEvent.click(await screen.findByText("loadFailedTitle"));
        expect(await screen.findByTestId("data")).toHaveTextContent("loaded");
        expect(apiClientMock).toHaveBeenCalledTimes(2);
    });

    it("drops an upload that finishes after a newer submission, and stays loading while uploading", async () => {
        let finishUpload: (value: unknown) => void = () => undefined;
        replaceFilesWithIdsMock.mockReturnValueOnce(new Promise((resolve) => { finishUpload = resolve; }));
        apiClientMock.mockResolvedValue({data: {value: "ok"}});
        const Wrapped = withAxios<Response>({method: "post", url: "/api/x"}, true)(View);

        render(<Wrapped/>);
        expect(apiClientMock).not.toHaveBeenCalled();

        fireEvent.click(screen.getByText("post-file"));
        expect(screen.getByTestId("loading")).toHaveTextContent("true");

        fireEvent.click(screen.getByText("post-plain"));
        await waitFor(() => expect(sentBodies()).toEqual([{plain: true}]));

        await act(async () => { finishUpload({file: "id-1"}); });
        await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
        expect(sentBodies()).toEqual([{plain: true}]);
    });

    it("cancels the upload a newer submission replaces, without reporting it", async () => {
        const signals: AbortSignal[] = [];
        replaceFilesWithIdsMock.mockImplementation((_data, {signal}: {signal: AbortSignal}) => {
            signals.push(signal);
            return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("canceled"))));
        });
        apiClientMock.mockResolvedValue({data: {value: "ok"}});
        const Wrapped = withAxios<Response>({method: "post", url: "/api/x"}, true)(View);
        render(<Wrapped/>);

        fireEvent.click(screen.getByText("post-file"));
        fireEvent.click(screen.getByText("post-plain"));

        await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
        expect(signals).toHaveLength(1);
        expect(signals[0].aborted).toBe(true);
        expect(sentBodies()).toEqual([{plain: true}]);
    });

    it("cancels a running upload on unmount", async () => {
        let signal: AbortSignal | undefined;
        replaceFilesWithIdsMock.mockImplementation((_data, options: {signal: AbortSignal}) => {
            signal = options.signal;
            return new Promise(() => undefined);
        });
        const Wrapped = withAxios<Response>({method: "post", url: "/api/x"}, true)(View);
        const {unmount} = render(<Wrapped/>);

        fireEvent.click(screen.getByText("post-file"));
        expect(signal?.aborted).toBe(false);
        unmount();
        expect(signal?.aborted).toBe(true);
    });

    describe("a failed upload", () => {
        const lifecycleError = vi.fn();
        let posted: Promise<void> | undefined;
        function Poster({onPost, onFilterChange, error, innerRef}: WithAxiosType<Response>) {
            useEffect(() => {
                innerRef.current = {error: lifecycleError};
            });
            return (
                <div>
                    <p data-testid="error">{error?.message ?? "none"}</p>
                    <button onClick={() => { posted = onPost({file: new File(["x"], "a.exe")}); }}>post</button>
                    <button onClick={() => onFilterChange({plain: true})}>post-plain</button>
                </div>
            );
        }

        beforeEach(() => {
            lifecycleError.mockReset();
            vi.mocked(toast.error).mockReset();
            posted = undefined;
        });

        it("is reported like a failed request, and the request is not sent", async () => {
            const refused = {response: {status: 400, data: {error_code: "file_type_blocked", message: "Program files can't be uploaded."}}};
            replaceFilesWithIdsMock.mockRejectedValueOnce(refused);
            apiClientMock.mockResolvedValue({data: {value: "ok"}});
            const Wrapped = withAxios<Response>({method: "post", url: "/api/x"}, true)(Poster);
            render(<Wrapped/>);

            fireEvent.click(screen.getByText("post"));

            await expect(posted).resolves.toBeUndefined();
            expect(toast.error).toHaveBeenCalledWith("Program files can't be uploaded.");
            await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent("Program files can't be uploaded."));
            expect(lifecycleError).toHaveBeenCalledWith(refused);
            expect(apiClientMock).not.toHaveBeenCalled();

            // The next submission starts clean.
            fireEvent.click(screen.getByText("post-plain"));
            await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent("none"));
        });

        it("still says something when no answer came back", async () => {
            replaceFilesWithIdsMock.mockRejectedValueOnce({isAxiosError: true, message: "Network Error"});
            const Wrapped = withAxios<Response>({method: "post", url: "/api/x"}, true)(Poster);
            render(<Wrapped/>);

            fireEvent.click(screen.getByText("post"));

            await expect(posted).resolves.toBeUndefined();
            expect(toast.error).toHaveBeenCalledWith("Network Error");
        });

        it("is not reported when a newer submission cancelled it", async () => {
            replaceFilesWithIdsMock.mockImplementation((_data, {signal}: {signal: AbortSignal}) =>
                new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("canceled")))));
            apiClientMock.mockResolvedValue({data: {value: "ok"}});
            const Wrapped = withAxios<Response>({method: "post", url: "/api/x"}, true)(Poster);
            render(<Wrapped/>);

            fireEvent.click(screen.getByText("post"));
            fireEvent.click(screen.getByText("post-plain"));

            await expect(posted).resolves.toBeUndefined();
            expect(toast.error).not.toHaveBeenCalled();
            expect(lifecycleError).not.toHaveBeenCalled();
        });
    });
});
