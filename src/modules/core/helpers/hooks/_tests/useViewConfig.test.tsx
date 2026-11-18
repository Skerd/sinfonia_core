import {renderHook} from "@testing-library/react";
import type {ReactNode} from "react";
import {describe, expect, it} from "vitest";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {type CachedViewConfigs, ViewConfigContext} from "@coreModule/helpers/context/viewConfigContext.tsx";
import {selectViewConfig, selectViewConfigByApiUrl, useViewConfig, useViewConfigState} from "@coreModule/helpers/hooks/useViewConfig.ts";

const sheet = {viewType: "sheet"} as unknown as ViewConfig;
const createForm = {viewType: "form"} as unknown as ViewConfig;
const configs: Record<string, CachedViewConfigs> = {
    countries: {sheet, "form:create": createForm},
};

const withProvider = (value: {configs: Record<string, CachedViewConfigs>; isHydrated: boolean}) =>
    ({children}: {children: ReactNode}) => (
        <ViewConfigContext.Provider value={value}>{children}</ViewConfigContext.Provider>
    );

describe("selectViewConfig", () => {
    it("finds a config by model (case-insensitive) and exact view key", () => {
        expect(selectViewConfig(configs, "countries", "sheet")).toBe(sheet);
        expect(selectViewConfig(configs, "Countries", "form:create")).toBe(createForm);
    });

    it("returns undefined for unknown models, view keys, or view-key case mismatches", () => {
        expect(selectViewConfig(configs, "cities", "sheet")).toBeUndefined();
        expect(selectViewConfig(configs, "countries", "form:edit")).toBeUndefined();
        expect(selectViewConfig(configs, "countries", "Sheet")).toBeUndefined();
    });

    it("returns undefined without a cache or a model", () => {
        expect(selectViewConfig(undefined, "countries", "sheet")).toBeUndefined();
        expect(selectViewConfig(configs, "", "sheet")).toBeUndefined();
        expect(selectViewConfig(configs, null, "sheet")).toBeUndefined();
        expect(selectViewConfig(configs, undefined, "sheet")).toBeUndefined();
    });
});

describe("selectViewConfigByApiUrl", () => {
    const cityCreate = {viewType: "form", apiUrl: "/api/auxiliary/city"} as ViewConfig;
    const citySheet = {viewType: "sheet", apiUrl: "/api/auxiliary/city"} as ViewConfig;
    const byUrl: Record<string, CachedViewConfigs> = {
        countries: {"form:create": {viewType: "form", apiUrl: "/api/auxiliary/country"} as ViewConfig},
        cities: {sheet: citySheet, "form:create": cityCreate},
    };

    it("finds the view of the model served at a CRUD url, by exact view key", () => {
        expect(selectViewConfigByApiUrl(byUrl, "/api/auxiliary/city", "form:create")).toBe(cityCreate);
        expect(selectViewConfigByApiUrl(byUrl, "/api/auxiliary/city", "sheet")).toBe(citySheet);
    });

    it("returns undefined for an unknown url or view key, or without a cache or url", () => {
        expect(selectViewConfigByApiUrl(byUrl, "/api/auxiliary/city/select", "form:create")).toBeUndefined();
        expect(selectViewConfigByApiUrl(byUrl, "/api/auxiliary/country", "form:edit")).toBeUndefined();
        expect(selectViewConfigByApiUrl(undefined, "/api/auxiliary/city", "form:create")).toBeUndefined();
        expect(selectViewConfigByApiUrl(byUrl, undefined, "form:create")).toBeUndefined();
    });
});

describe("useViewConfig", () => {
    it("returns the cached config object from the provider", () => {
        const {result} = renderHook(() => useViewConfig("COUNTRIES", "sheet"), {
            wrapper: withProvider({configs, isHydrated: true}),
        });
        expect(result.current).toBe(sheet);
    });

    it("returns undefined outside a provider", () => {
        const {result} = renderHook(() => useViewConfig("countries", "sheet"));
        expect(result.current).toBeUndefined();
    });

    it("follows the model and view key across re-renders", () => {
        const {result, rerender} = renderHook(
            ({model, viewKey}: {model: string; viewKey: string}) => useViewConfig(model, viewKey),
            {initialProps: {model: "countries", viewKey: "sheet"}, wrapper: withProvider({configs, isHydrated: true})},
        );
        expect(result.current).toBe(sheet);

        rerender({model: "countries", viewKey: "form:create"});
        expect(result.current).toBe(createForm);

        rerender({model: "cities", viewKey: "sheet"});
        expect(result.current).toBeUndefined();
    });
});

describe("useViewConfigState", () => {
    it("reports a found config as neither loading nor missing", () => {
        const {result} = renderHook(() => useViewConfigState("countries", "sheet"), {
            wrapper: withProvider({configs, isHydrated: true}),
        });
        expect(result.current).toEqual({config: sheet, loading: false, missing: false});
    });

    it("reports loading while the prefetch has not finished", () => {
        const {result} = renderHook(() => useViewConfigState("countries", "form:edit"), {
            wrapper: withProvider({configs: {}, isHydrated: false}),
        });
        expect(result.current).toEqual({config: undefined, loading: true, missing: false});
    });

    it("prefers a cached config even before hydration completes", () => {
        const {result} = renderHook(() => useViewConfigState("countries", "sheet"), {
            wrapper: withProvider({configs, isHydrated: false}),
        });
        expect(result.current).toEqual({config: sheet, loading: false, missing: false});
    });

    it("reports missing once hydrated without a match", () => {
        const {result} = renderHook(() => useViewConfigState("countries", "form:edit"), {
            wrapper: withProvider({configs, isHydrated: true}),
        });
        expect(result.current).toEqual({config: undefined, loading: false, missing: true});
    });

    it("reports missing, not loading, outside a provider", () => {
        const {result} = renderHook(() => useViewConfigState("countries", "sheet"));
        expect(result.current).toEqual({config: undefined, loading: false, missing: true});
    });
});
