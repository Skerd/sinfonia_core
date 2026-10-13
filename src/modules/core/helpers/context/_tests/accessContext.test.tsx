import {act, render, renderHook, screen, waitFor} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {Provider} from "react-redux";
import {configureStore, createSlice, type PayloadAction} from "@reduxjs/toolkit";
import type {ReactNode} from "react";

const {postMock, handleErrorMock} = vi.hoisted(() => ({postMock: vi.fn(), handleErrorMock: vi.fn()}));

vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: {post: postMock}}));
vi.mock("@coreModule/helpers/hooks/useErrorHandler.ts", () => ({default: () => handleErrorMock}));
vi.mock("@coreModule/components/custom/sessionSetupScreen.tsx", () => ({
    SessionSetupScreen: () => null,
    SESSION_SETUP_TOTAL_STEPS: 3,
}));

import {
    AccessAllowAllProvider,
    AccessProvider,
    accessAllResponseToContext,
    accessFieldPathExists,
    applyFieldMapOverride,
    flattenAccessFieldPaths,
    mergeAccessOverride,
    useAccessDebugOverrides,
    useAccessHydrated,
    useAccessMap,
    type AccessObject,
} from "@coreModule/helpers/context/accessContext.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";

const tree = {
    name: {},
    country: {keys: {name: {}, code: {}}},
    address: {keys: {geo: {keys: {lat: {}}}}},
};

describe("flattenAccessFieldPaths", () => {
    it("lists every path with depth and child flags", () => {
        expect(flattenAccessFieldPaths(tree)).toEqual([
            {path: "name", depth: 0, hasChildren: false},
            {path: "country", depth: 0, hasChildren: true},
            {path: "country.name", depth: 1, hasChildren: false},
            {path: "country.code", depth: 1, hasChildren: false},
            {path: "address", depth: 0, hasChildren: true},
            {path: "address.geo", depth: 1, hasChildren: true},
            {path: "address.geo.lat", depth: 2, hasChildren: false},
        ]);
    });

    it("treats empty `keys` as a leaf and ignores non-maps", () => {
        expect(flattenAccessFieldPaths({a: {keys: {}}})).toEqual([{path: "a", depth: 0, hasChildren: false}]);
        expect(flattenAccessFieldPaths(true)).toEqual([]);
        expect(flattenAccessFieldPaths(["a"])).toEqual([]);
        expect(flattenAccessFieldPaths(null)).toEqual([]);
    });
});

describe("accessFieldPathExists", () => {
    it.each([
        ["name", true],
        ["country", true],
        ["country.code", true],
        ["address.geo.lat", true],
        ["address.geo.lng", false],
        ["missing", false],
        ["name.deeper", false],
        ["", false],
    ])("%s → %s", (path, expected) => {
        expect(accessFieldPathExists(tree, path)).toBe(expected);
    });

    it("grants everything for `true` and nothing for falsy maps", () => {
        expect(accessFieldPathExists(true, "anything.at.all")).toBe(true);
        expect(accessFieldPathExists(false, "name")).toBe(false);
        expect(accessFieldPathExists(undefined, "name")).toBe(false);
    });

    it("prefers a flat dotted key over the nested walk", () => {
        expect(accessFieldPathExists({"country.name": {}}, "country.name")).toBe(true);
        expect(accessFieldPathExists({"country.name": false, country: {keys: {name: {}}}}, "country.name")).toBe(false);
    });

    it("walks nodes without `keys` directly", () => {
        expect(accessFieldPathExists({country: {name: {}}}, "country.name")).toBe(true);
    });
});

describe("applyFieldMapOverride", () => {
    it("master switch denies or restores", () => {
        expect(applyFieldMapOverride(tree, false)).toBe(false);
        expect(applyFieldMapOverride(tree, true)).toBe(tree);
        expect(applyFieldMapOverride(false, true)).toBe(true);
        expect(applyFieldMapOverride(false, true, {name: false})).toBe(true);
    });

    it("returns base untouched without field overrides", () => {
        expect(applyFieldMapOverride(tree, undefined)).toBe(tree);
        expect(applyFieldMapOverride(tree, undefined, {})).toBe(tree);
    });

    it("keeps full access when field overrides target a `true` map", () => {
        expect(applyFieldMapOverride(true, undefined, {name: false})).toBe(true);
        expect(applyFieldMapOverride(true, undefined, {name: true})).toBe(true);
    });

    it("removes denied fields and prunes empty parents without mutating base", () => {
        const snapshot = structuredClone(tree);
        expect(applyFieldMapOverride(tree, undefined, {"country.code": false, "address.geo.lat": false})).toEqual({
            name: {},
            country: {keys: {name: {}}},
        });
        expect(tree).toEqual(snapshot);
    });

    it("returns false when every field is denied", () => {
        expect(applyFieldMapOverride({name: {}}, undefined, {name: false})).toBe(false);
    });

    it("copies the original sub-map when granting under a denied parent", () => {
        expect(applyFieldMapOverride(tree, undefined, {address: false, "address.geo": true})).toEqual({
            name: {},
            country: tree.country,
            address: {keys: {geo: {keys: {lat: {}}}}},
        });
        expect(applyFieldMapOverride({name: {}}, undefined, {"country.code": true})).toEqual({
            name: {},
            country: {keys: {code: {}}},
        });
    });

    it("applies a child grant after a parent deny", () => {
        expect(applyFieldMapOverride(tree, undefined, {country: false, "country.name": true})).toEqual({
            name: {},
            address: tree.address,
            country: {keys: {name: {}}},
        });
    });

    it("grants onto a denied map", () => {
        expect(applyFieldMapOverride(false, undefined, {name: true})).toEqual({name: {}});
    });
});

describe("mergeAccessOverride", () => {
    const base: AccessObject = {
        read: tree,
        write: {name: {}},
        create: true,
        delete: false,
        restore: false,
        resourceId: "cities",
        ifProp: "specificUserId",
        ifPropValue: false,
        renderComponentOnError: false,
    };

    it("returns the same object without an override", () => {
        expect(mergeAccessOverride(base)).toBe(base);
    });

    it("overrides only the given flags and maps", () => {
        const merged = mergeAccessOverride(base, {create: false, restore: true, writeFields: {name: false}});
        expect(merged).toMatchObject({create: false, delete: false, restore: true, read: tree, write: false});
        expect(base.create).toBe(true);
    });
});

describe("accessAllResponseToContext", () => {
    it("lower-cases keys and defaults missing flags to false", () => {
        const ctx = accessAllResponseToContext({
            CompanyUsers: {self: {read: {name: {}}}, others: {create: true}},
        } as never);
        expect(ctx.companyusers.self).toMatchObject({
            resourceId: "companyusers",
            read: {name: {}},
            write: false,
            create: false,
        });
        expect(ctx.companyusers.others).toMatchObject({read: false, create: true});
    });
});

describe("useAccess outside a provider", () => {
    it("returns an empty, denied object", () => {
        const {result} = renderHook(() => useAccess("Cities"));
        expect(result.current).toMatchObject({read: false, write: {}, create: false, resourceId: "cities"});
        expect(renderHook(() => useAccess("")).result.current.resourceId).toBe("");
        expect(renderHook(() => useAccessHydrated()).result.current).toBeNull();
        expect(renderHook(() => useAccessDebugOverrides()).result.current).toBeNull();
    });
});

describe("AccessAllowAllProvider", () => {
    const wrapper = ({children}: {children: ReactNode}) => <AccessAllowAllProvider>{children}</AccessAllowAllProvider>;

    it("grants everything with a stable object", () => {
        const {result, rerender} = renderHook(() => useAccess("Anything"), {wrapper});
        const first = result.current;
        expect(first).toMatchObject({read: true, write: true, create: true, delete: true, restore: true, resourceId: "anything"});
        rerender();
        expect(result.current).toBe(first);
    });
});

// ---------------------------------------------------------------------------
// AccessProvider
// ---------------------------------------------------------------------------

const RESPONSE = {
    Cities: {
        self: {read: {name: {}}, write: {}, create: true, delete: false, restore: false},
        others: {read: {name: {}, secret: {}}, write: {}, create: false, delete: true, restore: false},
    },
    Tags: {
        self: {read: {label: {}}, write: {}, create: false, delete: false, restore: false},
    },
};

const authSlice = createSlice({
    name: "authentication",
    initialState: {token: "token-a" as string | null},
    reducers: {setToken: (state, action: PayloadAction<string | null>) => void (state.token = action.payload)},
});

function renderWithProvider<T>(hook: () => T) {
    const store = configureStore({reducer: {authentication: authSlice.reducer}});
    const wrapper = ({children}: {children: ReactNode}) => (
        <Provider store={store}>
            <AccessProvider>{children}</AccessProvider>
        </Provider>
    );
    const utils = renderHook(hook, {wrapper});
    const setToken = (token: string | null) => act(() => void store.dispatch(authSlice.actions.setToken(token)));
    return {...utils, setToken};
}

describe("AccessProvider", () => {
    beforeEach(() => {
        postMock.mockReset();
        handleErrorMock.mockReset();
        postMock.mockResolvedValue({data: RESPONSE});
    });

    it("fetches once, then exposes the map and hydration flag", async () => {
        const {result} = renderWithProvider(() => ({
            hydrated: useAccessHydrated(),
            map: useAccessMap(),
            cities: useAccess("cities"),
        }));

        await waitFor(() => expect(result.current.hydrated).toBe(true));
        expect(postMock).toHaveBeenCalledTimes(1);
        expect(postMock).toHaveBeenCalledWith(
            "/api/user/permissions/access/all",
            {},
            expect.objectContaining({signal: expect.any(AbortSignal)}),
        );
        expect(Object.keys(result.current.map)).toEqual(["cities", "tags"]);
        expect(result.current.cities).toMatchObject({create: true, read: {name: {}}});
    });

    it("serves `others`, falling back to `self` when the server sent none", async () => {
        const {result} = renderWithProvider(() => ({
            hydrated: useAccessHydrated(),
            cities: useAccess("Cities", "others"),
            tags: useAccess("tags", "others"),
        }));
        await waitFor(() => expect(result.current.hydrated).toBe(true));

        expect(result.current.cities).toMatchObject({delete: true, read: {name: {}, secret: {}}});
        expect(result.current.tags).toMatchObject({read: {label: {}}});
    });

    it("keeps useAccess referentially stable until its inputs change", async () => {
        const {result, rerender} = renderWithProvider(() => ({
            hydrated: useAccessHydrated(),
            cities: useAccess("cities"),
            tags: useAccess("tags"),
            debug: useAccessDebugOverrides(),
        }));
        await waitFor(() => expect(result.current.hydrated).toBe(true));

        const {cities, tags} = result.current;
        rerender();
        expect(result.current.cities).toBe(cities);

        // An override on one resource leaves the other untouched.
        act(() => result.current.debug?.setOverrides({cities: {self: {create: false}}}));
        expect(result.current.cities).not.toBe(cities);
        expect(result.current.cities.create).toBe(false);
        expect(result.current.tags).toBe(tags);
    });

    it("applies an override to the perspective actually served", async () => {
        const {result} = renderWithProvider(() => ({
            hydrated: useAccessHydrated(),
            tags: useAccess("tags", "others"),
            debug: useAccessDebugOverrides(),
        }));
        await waitFor(() => expect(result.current.hydrated).toBe(true));

        // `tags` has no `others`, so the `self` override applies.
        act(() => result.current.debug?.setOverrides({tags: {others: {create: true}}}));
        expect(result.current.tags.create).toBe(false);
        act(() => result.current.debug?.setOverrides({tags: {self: {create: true}}}));
        expect(result.current.tags.create).toBe(true);
    });

    it("does not fetch without a token and clears the map on logout", async () => {
        const {result, setToken} = renderWithProvider(() => ({hydrated: useAccessHydrated(), map: useAccessMap()}));
        await waitFor(() => expect(result.current.hydrated).toBe(true));

        setToken(null);
        expect(result.current.hydrated).toBe(false);
        expect(result.current.map).toEqual({});
        expect(postMock).toHaveBeenCalledTimes(1);
    });

    it("refetches on token change and ignores the superseded response", async () => {
        let resolveFirst!: (value: unknown) => void;
        postMock
            .mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
            .mockResolvedValueOnce({data: {Tags: RESPONSE.Tags}});

        const {result, setToken} = renderWithProvider(() => ({hydrated: useAccessHydrated(), map: useAccessMap()}));
        const firstSignal: AbortSignal = postMock.mock.calls[0][2].signal;

        setToken("token-b");
        expect(firstSignal.aborted).toBe(true);
        await waitFor(() => expect(result.current.hydrated).toBe(true));
        expect(Object.keys(result.current.map)).toEqual(["tags"]);

        await act(async () => resolveFirst({data: RESPONSE}));
        expect(Object.keys(result.current.map)).toEqual(["tags"]);
    });

    it("reports fetch errors and stays unhydrated", async () => {
        const error = new Error("boom");
        postMock.mockRejectedValueOnce(error);
        const {result} = renderWithProvider(() => useAccessHydrated());

        await waitFor(() => expect(handleErrorMock).toHaveBeenCalledWith(error));
        expect(result.current).toBe(false);
    });

    it("aborts the request on unmount without reporting an error", async () => {
        postMock.mockImplementationOnce((_url, _body, {signal}: {signal: AbortSignal}) =>
            new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("aborted")))),
        );
        const {unmount} = renderWithProvider(() => useAccessHydrated());
        const signal: AbortSignal = postMock.mock.calls[0][2].signal;

        unmount();
        expect(signal.aborted).toBe(true);
        await Promise.resolve();
        expect(handleErrorMock).not.toHaveBeenCalled();
    });

    it("renders children after the setup step", async () => {
        const store = configureStore({reducer: {authentication: authSlice.reducer}});
        render(
            <Provider store={store}>
                <AccessProvider>
                    <span>child</span>
                </AccessProvider>
            </Provider>,
        );
        expect(screen.getByText("child")).toBeInTheDocument();
        await act(async () => {});
    });
});
