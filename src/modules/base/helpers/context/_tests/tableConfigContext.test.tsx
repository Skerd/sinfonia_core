import {act, render, renderHook, screen, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {TableColumnConfig} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type.ts";

const {getMock, handleErrorMock, getUserMock} = vi.hoisted(() => ({
    getMock: vi.fn(),
    handleErrorMock: vi.fn(),
    getUserMock: vi.fn(),
}));

vi.mock("@baseModule/helpers/apiClient/apiClient.ts", () => ({default: {get: getMock}}));
vi.mock("@baseModule/helpers/hooks/useErrorHandler.ts", () => ({default: () => handleErrorMock}));
vi.mock("@coreModule/helpers/context/localStorage/authenticationStorage.ts", () => ({getUser: getUserMock}));
vi.mock("armonia/src/modules/core/database/filter/pathUtils.ts", () => ({
    tableConfigToFilterConfig: (columns: TableColumnConfig[]) => columns.map((column) => ({name: column.id})),
}));
vi.mock("@coreModule/components/ui/sessionSetupScreen.tsx", () => ({
    SESSION_SETUP_TOTAL_STEPS: 3,
    SessionSetupScreen: ({error, onRetry, phase}: {error: boolean; onRetry: () => void; phase: string}) => (
        <div data-testid="setup" data-phase={phase}>
            {error ? <button onClick={onRetry}>retry</button> : "loading"}
        </div>
    ),
}));

import {
    columnVisibilityStorageKey,
    configsFromResponse,
    mergeWithStoredVisibility,
    TABLE_CONFIGS_URL,
    TableConfigProvider,
    type CachedTableConfig,
} from "@baseModule/helpers/context/tableConfigContext.tsx";
import {useTableConfigContext} from "@baseModule/helpers/hooks/useTableConfigContext.ts";

const column = (id: string, visible: boolean) => ({id, visible}) as TableColumnConfig;

const RESPONSE = {
    Cities: [column("name", true), column("code", false)],
    Tags: [column("label", true)],
};

const USER_ID = "u1";

function storeVisibility(key: string, value: unknown, userId = USER_ID) {
    localStorage.setItem(columnVisibilityStorageKey(userId, key), typeof value === "string" ? value : JSON.stringify(value));
}

function readVisibility(key: string, userId = USER_ID) {
    const raw = localStorage.getItem(columnVisibilityStorageKey(userId, key));
    return raw ? JSON.parse(raw) : null;
}

beforeEach(() => {
    localStorage.clear();
    getMock.mockReset();
    handleErrorMock.mockReset();
    getUserMock.mockReset();
    getUserMock.mockReturnValue({id: USER_ID});
    getMock.mockResolvedValue({data: RESPONSE});
});

describe("mergeWithStoredVisibility", () => {
    const defaults = {name: true, code: false};

    it("returns the defaults without a user or stored value", () => {
        storeVisibility("cities", {name: false});
        expect(mergeWithStoredVisibility(defaults, undefined, "cities")).toBe(defaults);
        expect(mergeWithStoredVisibility(defaults, USER_ID, "tags")).toBe(defaults);
    });

    it("overlays stored choices for known columns only", () => {
        storeVisibility("cities", {name: false, removed: true, constructor: true});
        expect(mergeWithStoredVisibility(defaults, USER_ID, "cities")).toEqual({name: false, code: false});
        expect(defaults).toEqual({name: true, code: false});
    });

    it("ignores stored values from another user", () => {
        storeVisibility("cities", {name: false}, "someone-else");
        expect(mergeWithStoredVisibility(defaults, USER_ID, "cities")).toBe(defaults);
    });

    it.each([
        ["invalid JSON", "{nope"],
        ["an array", "[false]"],
        ["a primitive", "false"],
        ["null", "null"],
    ])("ignores %s", (_label, raw) => {
        storeVisibility("cities", raw);
        expect(mergeWithStoredVisibility(defaults, USER_ID, "cities")).toBe(defaults);
    });

    it("skips non-boolean entries", () => {
        storeVisibility("cities", {name: "false", code: true});
        expect(mergeWithStoredVisibility(defaults, USER_ID, "cities")).toEqual({name: true, code: true});
    });
});

describe("configsFromResponse", () => {
    it("lower-cases keys and derives filters and visibility", () => {
        expect(configsFromResponse(RESPONSE, undefined)).toEqual({
            cities: {
                filters: [{name: "name"}, {name: "code"}],
                columns: RESPONSE.Cities,
                columnVisibility: {name: true, code: false},
            },
            tags: {
                filters: [{name: "label"}],
                columns: RESPONSE.Tags,
                columnVisibility: {label: true},
            },
        });
    });

    it("applies the user's stored visibility by lower-cased key", () => {
        storeVisibility("cities", {code: true});
        expect(configsFromResponse(RESPONSE, USER_ID).cities.columnVisibility).toEqual({name: true, code: true});
    });

    it("defaults the user from auth storage", () => {
        storeVisibility("tags", {label: false});
        expect(configsFromResponse(RESPONSE).tags.columnVisibility).toEqual({label: false});
    });

    it("skips non-array entries and tolerates empty data", () => {
        expect(configsFromResponse({broken: null, Tags: RESPONSE.Tags} as never, undefined)).toHaveProperty("tags");
        expect(Object.keys(configsFromResponse({broken: null} as never, undefined))).toEqual([]);
        expect(configsFromResponse(null)).toEqual({});
        expect(configsFromResponse(undefined)).toEqual({});
    });
});

describe("useTableConfigContext outside a provider", () => {
    it("returns null", () => {
        expect(renderHook(() => useTableConfigContext()).result.current).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// TableConfigProvider
// ---------------------------------------------------------------------------

const wrapper = ({children}: {children: ReactNode}) => <TableConfigProvider>{children}</TableConfigProvider>;

async function renderReady() {
    const utils = renderHook(() => useTableConfigContext()!, {wrapper});
    await waitFor(() => expect(utils.result.current).not.toBeNull());
    return utils;
}

const preview: CachedTableConfig = {
    filters: [],
    columns: [column("a", true), column("b", true)],
    columnVisibility: {a: true, b: true},
};

describe("TableConfigProvider", () => {
    it("shows the setup screen until the fetch resolves, then the children", async () => {
        render(
            <TableConfigProvider>
                <span>child</span>
            </TableConfigProvider>,
        );
        expect(screen.getByTestId("setup")).toHaveTextContent("loading");
        expect(screen.getByTestId("setup")).toHaveAttribute("data-phase", "table");
        expect(screen.queryByText("child")).toBeNull();

        expect(await screen.findByText("child")).toBeInTheDocument();
        expect(getMock).toHaveBeenCalledTimes(1);
        expect(getMock).toHaveBeenCalledWith(TABLE_CONFIGS_URL, {signal: expect.any(AbortSignal)});
    });

    it("exposes the hydrated cache", async () => {
        storeVisibility("cities", {name: false});
        const {result} = await renderReady();

        expect(result.current.isHydrated).toBe(true);
        expect(Object.keys(result.current.configs)).toEqual(["cities", "tags"]);
        expect(result.current.configs.cities.columnVisibility).toEqual({name: false, code: false});
    });

    it("keeps the context value stable across re-renders", async () => {
        const {result, rerender} = await renderReady();
        const first = result.current;
        rerender();
        expect(result.current).toBe(first);
    });

    it("shows a retry on failure and loads on retry", async () => {
        const error = new Error("boom");
        getMock.mockRejectedValueOnce(error);
        render(
            <TableConfigProvider>
                <span>child</span>
            </TableConfigProvider>,
        );

        const retry = await screen.findByRole("button", {name: "retry"});
        expect(handleErrorMock).toHaveBeenCalledWith(error);
        expect(screen.queryByText("child")).toBeNull();

        act(() => retry.click());
        expect(screen.getByTestId("setup")).toHaveTextContent("loading");
        expect(await screen.findByText("child")).toBeInTheDocument();
        expect(getMock).toHaveBeenCalledTimes(2);
    });

    it("aborts the request on unmount without reporting an error", async () => {
        getMock.mockImplementationOnce((_url, {signal}: {signal: AbortSignal}) =>
            new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("aborted")))),
        );
        const {unmount} = render(<TableConfigProvider>child</TableConfigProvider>);
        const signal: AbortSignal = getMock.mock.calls[0][1].signal;

        unmount();
        expect(signal.aborted).toBe(true);
        await Promise.resolve();
        expect(handleErrorMock).not.toHaveBeenCalled();
    });

    describe("setConfig / clearConfig", () => {
        it("adds a config under a lower-cased key, merging stored visibility", async () => {
            storeVisibility("studio:preview", {b: false, gone: false});
            const {result} = await renderReady();

            act(() => result.current.setConfig("Studio:Preview", preview));
            expect(result.current.configs["studio:preview"]).toEqual({...preview, columnVisibility: {a: true, b: false}});
            expect(preview.columnVisibility).toEqual({a: true, b: true});
        });

        it("keeps a config without visibility as is", async () => {
            const {result} = await renderReady();
            act(() => result.current.setConfig("x", {filters: [], columns: []}));
            expect(result.current.configs.x).toEqual({filters: [], columns: [], columnVisibility: undefined});
        });

        it("removes a config, and is a no-op for unknown keys", async () => {
            const {result} = await renderReady();

            act(() => result.current.clearConfig("CITIES"));
            expect(Object.keys(result.current.configs)).toEqual(["tags"]);

            const before = result.current.configs;
            act(() => result.current.clearConfig("missing"));
            expect(result.current.configs).toBe(before);
        });
    });

    describe("updateColumnVisibility", () => {
        it("updates the cache and persists per user", async () => {
            const {result} = await renderReady();
            const tags = result.current.configs.tags;

            act(() => result.current.updateColumnVisibility("Cities", {name: false, code: true}));
            expect(result.current.configs.cities.columnVisibility).toEqual({name: false, code: true});
            expect(result.current.configs.tags).toBe(tags);
            expect(readVisibility("cities")).toEqual({name: false, code: true});
        });

        it("survives a remount via storage", async () => {
            const first = await renderReady();
            act(() => first.result.current.updateColumnVisibility("cities", {name: false, code: false}));
            first.unmount();

            const {result} = await renderReady();
            expect(result.current.configs.cities.columnVisibility).toEqual({name: false, code: false});
        });

        it("persists for unknown tables but leaves the cache untouched", async () => {
            const {result} = await renderReady();
            const before = result.current.configs;

            act(() => result.current.updateColumnVisibility("unknown", {x: false}));
            expect(result.current.configs).toBe(before);
            expect(readVisibility("unknown")).toEqual({x: false});
        });

        it("does not persist without a user", async () => {
            const {result} = await renderReady();
            getUserMock.mockReturnValue(null);

            act(() => result.current.updateColumnVisibility("cities", {name: false, code: false}));
            expect(result.current.configs.cities.columnVisibility).toEqual({name: false, code: false});
            expect(localStorage.length).toBe(0);
        });

        it("still updates the cache when storage throws", async () => {
            const {result} = await renderReady();
            const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
                throw new Error("QuotaExceededError");
            });
            try {
                act(() => result.current.updateColumnVisibility("cities", {name: false, code: false}));
                expect(result.current.configs.cities.columnVisibility).toEqual({name: false, code: false});
            } finally {
                setItem.mockRestore();
            }
        });
    });
});
