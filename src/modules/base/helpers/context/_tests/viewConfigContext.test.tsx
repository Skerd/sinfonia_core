import {act, render, renderHook, screen, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";

const {getMock, handleErrorMock} = vi.hoisted(() => ({getMock: vi.fn(), handleErrorMock: vi.fn()}));

vi.mock("@baseModule/helpers/apiClient/apiClient.ts", () => ({default: {get: getMock}}));
vi.mock("@baseModule/helpers/hooks/useErrorHandler.ts", () => ({default: () => handleErrorMock}));
vi.mock("@coreModule/components/ui/sessionSetupScreen.tsx", () => ({
    SESSION_SETUP_TOTAL_STEPS: 3,
    SessionSetupScreen: ({error, onRetry, phase, step}: {error: boolean; onRetry: () => void; phase: string; step: number}) => (
        <div data-testid="setup" data-phase={phase} data-step={step}>
            {error ? <button onClick={onRetry}>retry</button> : "loading"}
        </div>
    ),
}));

import {
    configsFromResponse,
    VIEW_CONFIGS_URL,
    ViewConfigProvider,
} from "@baseModule/helpers/context/viewConfigContext.tsx";
import {useViewConfigContext} from "@baseModule/helpers/hooks/useViewConfigContext.ts";
import {useViewConfig, useViewConfigState} from "@baseModule/helpers/hooks/useViewConfig.ts";

const view = (viewType: string) => ({viewType}) as unknown as ViewConfig;
const sheet = view("sheet");
const createForm = view("form");
const tagSheet = view("sheet");

const RESPONSE = {
    Countries: {sheet, "form:create": createForm},
    Tags: {sheet: tagSheet},
};

beforeEach(() => {
    getMock.mockReset();
    handleErrorMock.mockReset();
    getMock.mockResolvedValue({data: RESPONSE});
});

describe("configsFromResponse", () => {
    it("lower-cases collection names and keeps view objects as is", () => {
        const configs = configsFromResponse(RESPONSE);
        expect(configs).toEqual({countries: RESPONSE.Countries, tags: RESPONSE.Tags});
        expect(configs.countries).toBe(RESPONSE.Countries);
    });

    it("merges collections whose names differ only in case", () => {
        const editForm = view("form");
        const configs = configsFromResponse({Countries: {sheet}, countries: {"form:edit": editForm}});
        expect(configs.countries).toEqual({sheet, "form:edit": editForm});
    });

    it("skips malformed entries and tolerates empty data", () => {
        const data = {broken: null, list: [sheet], text: "x", Tags: RESPONSE.Tags} as never;
        expect(Object.keys(configsFromResponse(data))).toEqual(["tags"]);
        expect(configsFromResponse(null)).toEqual({});
        expect(configsFromResponse(undefined)).toEqual({});
        expect(configsFromResponse({})).toEqual({});
    });
});

describe("useViewConfigContext outside a provider", () => {
    it("returns null", () => {
        expect(renderHook(() => useViewConfigContext()).result.current).toBeNull();
    });
});

const wrapper = ({children}: {children: ReactNode}) => <ViewConfigProvider>{children}</ViewConfigProvider>;

describe("ViewConfigProvider", () => {
    it("shows the setup screen until the fetch resolves, then the children", async () => {
        render(
            <ViewConfigProvider>
                <span>child</span>
            </ViewConfigProvider>,
        );
        const setup = screen.getByTestId("setup");
        expect(setup).toHaveTextContent("loading");
        expect(setup).toHaveAttribute("data-phase", "view");
        expect(setup).toHaveAttribute("data-step", "3");
        expect(screen.queryByText("child")).toBeNull();

        expect(await screen.findByText("child")).toBeInTheDocument();
        expect(getMock).toHaveBeenCalledTimes(1);
        expect(getMock).toHaveBeenCalledWith(VIEW_CONFIGS_URL, {signal: expect.any(AbortSignal)});
    });

    it("passes a custom setup step through", async () => {
        render(<ViewConfigProvider setupStep={1}>child</ViewConfigProvider>);
        expect(screen.getByTestId("setup")).toHaveAttribute("data-step", "1");
        expect(await screen.findByText("child")).toBeInTheDocument();
    });

    it("exposes the hydrated cache with a stable value", async () => {
        const {result, rerender} = renderHook(() => useViewConfigContext(), {wrapper});
        await waitFor(() => expect(result.current).not.toBeNull());

        const first = result.current!;
        expect(first.isHydrated).toBe(true);
        expect(Object.keys(first.configs)).toEqual(["countries", "tags"]);

        rerender();
        expect(result.current).toBe(first);
    });

    it("serves configs to useViewConfig case-insensitively by collection", async () => {
        const {result} = renderHook(
            () => ({
                sheet: useViewConfig("COUNTRIES", "sheet"),
                create: useViewConfig("countries", "form:create"),
                missing: useViewConfigState("countries", "form:edit"),
            }),
            {wrapper},
        );
        await waitFor(() => expect(result.current).not.toBeNull());

        expect(result.current.sheet).toBe(sheet);
        expect(result.current.create).toBe(createForm);
        expect(result.current.missing).toEqual({config: undefined, loading: false, missing: true});
    });

    it("hydrates with an empty cache when the response has no body", async () => {
        getMock.mockResolvedValueOnce({data: undefined});
        const {result} = renderHook(() => useViewConfigContext(), {wrapper});
        await waitFor(() => expect(result.current).not.toBeNull());
        expect(result.current).toEqual({configs: {}, isHydrated: true});
    });

    it("shows a retry on failure and loads on retry", async () => {
        const error = new Error("boom");
        getMock.mockRejectedValueOnce(error);
        render(
            <ViewConfigProvider>
                <span>child</span>
            </ViewConfigProvider>,
        );

        const retry = await screen.findByRole("button", {name: "retry"});
        expect(handleErrorMock).toHaveBeenCalledTimes(1);
        expect(handleErrorMock).toHaveBeenCalledWith(error);
        expect(screen.queryByText("child")).toBeNull();

        act(() => retry.click());
        expect(screen.getByTestId("setup")).toHaveTextContent("loading");
        expect(await screen.findByText("child")).toBeInTheDocument();
        expect(getMock).toHaveBeenCalledTimes(2);
    });

    it("keeps offering retry while the fetch keeps failing", async () => {
        getMock.mockRejectedValue(new Error("down"));
        render(<ViewConfigProvider>child</ViewConfigProvider>);

        const first = await screen.findByRole("button", {name: "retry"});
        act(() => first.click());
        expect(screen.getByTestId("setup")).toHaveTextContent("loading");
        expect(await screen.findByRole("button", {name: "retry"})).toBeInTheDocument();
        expect(getMock).toHaveBeenCalledTimes(2);
        expect(handleErrorMock).toHaveBeenCalledTimes(2);
    });

    it("aborts the request on unmount without reporting an error", async () => {
        getMock.mockImplementationOnce((_url, {signal}: {signal: AbortSignal}) =>
            new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("aborted")))),
        );
        const {unmount} = render(<ViewConfigProvider>child</ViewConfigProvider>);
        const signal: AbortSignal = getMock.mock.calls[0][1].signal;

        unmount();
        expect(signal.aborted).toBe(true);
        await Promise.resolve();
        expect(handleErrorMock).not.toHaveBeenCalled();
    });

    it("ignores a response that arrives after unmount", async () => {
        let resolve!: (value: unknown) => void;
        getMock.mockImplementationOnce(() => new Promise((r) => (resolve = r)));
        const {unmount} = render(<ViewConfigProvider>child</ViewConfigProvider>);

        unmount();
        await act(async () => resolve({data: RESPONSE}));
        expect(handleErrorMock).not.toHaveBeenCalled();
    });
});
