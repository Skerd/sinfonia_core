import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";

const {apiClientMock, replaceFilesWithIdsMock} = vi.hoisted(() => ({
    apiClientMock: vi.fn(),
    replaceFilesWithIdsMock: vi.fn(),
}));

vi.mock("@baseModule/helpers/apiClient/apiClient.ts", () => ({default: apiClientMock}));
vi.mock("sonner", () => ({toast: Object.assign(vi.fn(), {loading: vi.fn(), success: vi.fn(), error: vi.fn(), dismiss: vi.fn()})}));
vi.mock("@coreModule/helpers/general", () => ({
    getClientConfig: () => ({debugging: {enableFormPostInfo: false, enableFormResponseSuccessInfo: false, enableFormResponseErrorInfo: false}}),
}));
vi.mock("@coreModule/helpers/media/uploadFilesForSubmit.ts", async (importOriginal) => ({
    ...await importOriginal<typeof import("@baseModule/helpers/media/uploadFilesForSubmit.ts")>(),
    replaceFilesWithIds: replaceFilesWithIdsMock,
}));
vi.mock("@baseModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key}/>,
}));
vi.mock("@coreModule/components/custom/errorViewWrapper.tsx", () => ({
    default: ({title, onClick}: { title: string; onClick: () => void }) => <button onClick={onClick}>{title}</button>,
}));

import withAxiosHoc, {type WithAxiosType} from "@baseModule/helpers/hocs/withAxios.tsx";
import type {HttpRequest} from "@baseModule/helpers/hooks/useHttpRequest.ts";

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

    it("reports a failed upload for the current submission", async () => {
        replaceFilesWithIdsMock.mockRejectedValueOnce(new Error("upload failed"));
        let posted: Promise<void> | undefined;
        function Poster({onPost}: WithAxiosType<Response>) {
            return <button onClick={() => { posted = onPost({file: new File(["x"], "a.txt")}) as Promise<void>; }}>post</button>;
        }
        const Wrapped = withAxios<Response>({method: "post", url: "/api/x"}, true)(Poster);
        render(<Wrapped/>);

        fireEvent.click(screen.getByText("post"));
        await expect(posted).rejects.toThrow("upload failed");
        expect(apiClientMock).not.toHaveBeenCalled();
    });
});
