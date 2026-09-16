import {renderHook} from "@testing-library/react";
import type {ReactNode} from "react";
import {describe, expect, it, vi} from "vitest";
import type {FilterFieldConfig} from "armonia/src/modules/core/database/filter/fieldRegistry.types.ts";
import type {TableColumnConfig} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type.ts";
import {type CachedTableConfig, TableConfigContext} from "@baseModule/helpers/context/tableConfigContext.tsx";
import {
    selectTableConfig,
    TABLE_CONFIG_NOT_FOUND_ERROR,
    useTableConfig,
} from "@baseModule/helpers/hooks/useTableConfig.ts";

const cities: CachedTableConfig = {
    filters: [{name: "name"}] as unknown as FilterFieldConfig[],
    columns: [{id: "name", visible: true}] as unknown as TableColumnConfig[],
    columnVisibility: {name: true},
};
const configs: Record<string, CachedTableConfig> = {cities};

function providerValue(overrides: {configs?: Record<string, CachedTableConfig>; isHydrated?: boolean} = {}) {
    return {
        configs: overrides.configs ?? configs,
        isHydrated: overrides.isHydrated ?? true,
        setConfig: vi.fn(),
        clearConfig: vi.fn(),
        updateColumnVisibility: vi.fn(),
    };
}

const withProvider = (value: ReturnType<typeof providerValue>) => ({children}: {children: ReactNode}) => (
    <TableConfigContext.Provider value={value}>{children}</TableConfigContext.Provider>
);

describe("selectTableConfig", () => {
    it("finds a config regardless of key case", () => {
        expect(selectTableConfig(configs, "cities")).toBe(cities);
        expect(selectTableConfig(configs, "Cities")).toBe(cities);
    });

    it("returns undefined for unknown keys, no cache, or no key", () => {
        expect(selectTableConfig(configs, "countries")).toBeUndefined();
        expect(selectTableConfig(undefined, "cities")).toBeUndefined();
        expect(selectTableConfig(configs, "")).toBeUndefined();
        expect(selectTableConfig(configs, null)).toBeUndefined();
        expect(selectTableConfig(configs, undefined)).toBeUndefined();
    });
});

describe("useTableConfig", () => {
    it("returns the cached filters, columns and visibility", () => {
        const {result} = renderHook(() => useTableConfig("CITIES"), {wrapper: withProvider(providerValue())});

        expect(result.current.filters).toBe(cities.filters);
        expect(result.current.columns).toBe(cities.columns);
        expect(result.current.columnVisibility).toBe(cities.columnVisibility);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it("skips without a key: empty, not loading, no error", () => {
        const {result} = renderHook(() => useTableConfig(null), {wrapper: withProvider(providerValue())});

        expect(result.current).toMatchObject({filters: [], columns: [], columnVisibility: undefined, loading: false, error: null});
    });

    it("reports loading for a missing key while the prefetch runs", () => {
        const {result} = renderHook(() => useTableConfig("countries"), {
            wrapper: withProvider(providerValue({configs: {}, isHydrated: false})),
        });
        expect(result.current.loading).toBe(true);
        expect(result.current.error).toBeNull();
    });

    it("prefers a cached config even before hydration completes", () => {
        const {result} = renderHook(() => useTableConfig("cities"), {
            wrapper: withProvider(providerValue({isHydrated: false})),
        });
        expect(result.current.columns).toBe(cities.columns);
        expect(result.current.loading).toBe(false);
    });

    it("reports the not-found error once hydrated, and outside a provider", () => {
        const hydrated = renderHook(() => useTableConfig("countries"), {wrapper: withProvider(providerValue())});
        expect(hydrated.result.current.error).toBe(TABLE_CONFIG_NOT_FOUND_ERROR);
        expect(hydrated.result.current.error?.message).toBe("table_config_not_found");
        expect(hydrated.result.current.loading).toBe(false);

        const orphan = renderHook(() => useTableConfig("cities"));
        expect(orphan.result.current.error).toBe(TABLE_CONFIG_NOT_FOUND_ERROR);
        expect(orphan.result.current.loading).toBe(false);
    });

    it("keeps error, empty arrays and setColumnVisibility referentially stable across re-renders", () => {
        const {result, rerender} = renderHook(() => useTableConfig("countries"), {wrapper: withProvider(providerValue())});
        const first = result.current;

        rerender();

        expect(result.current.error).toBe(first.error);
        expect(result.current.filters).toBe(first.filters);
        expect(result.current.columns).toBe(first.columns);
        expect(result.current.setColumnVisibility).toBe(first.setColumnVisibility);
    });

    it("saves column visibility for its own key through the provider", () => {
        const value = providerValue();
        const {result} = renderHook(() => useTableConfig("Cities"), {wrapper: withProvider(value)});

        result.current.setColumnVisibility({name: false});

        expect(value.updateColumnVisibility).toHaveBeenCalledWith("Cities", {name: false});
    });

    it("does not save visibility without a key, and does not throw without a provider", () => {
        const value = providerValue();
        const keyless = renderHook(() => useTableConfig(""), {wrapper: withProvider(value)});
        keyless.result.current.setColumnVisibility({name: false});
        expect(value.updateColumnVisibility).not.toHaveBeenCalled();

        const orphan = renderHook(() => useTableConfig("cities"));
        expect(() => orphan.result.current.setColumnVisibility({name: false})).not.toThrow();
    });
});
