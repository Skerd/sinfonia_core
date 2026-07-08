import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { FilterFieldConfig } from "armonia/src/modules/core/database/filter";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";

type FilterBuilderContextValue = {
    fields: FilterFieldConfig[];
    extraParams?: Record<string, unknown>;
    /** Display labels for ref-backed objectId values (keyed by filter field path, then id). */
    refLabelsByFieldPath: Record<string, Record<string, string>>;
    mergeRefLabels: (fieldPath: string, updates: Record<string, string>) => void;
};

const FilterBuilderContext = createContext<FilterBuilderContextValue | null>(null);

export function useFilterBuilder(): FilterBuilderContextValue {
    const ctx = useContext(FilterBuilderContext);
    if (!ctx) {
        throw new Error("useFilterBuilder must be used within FilterBuilderProvider");
    }
    return ctx;
}

type FilterBuilderProviderProps = WithLanguageType & {
    extraParams?: Record<string, unknown>;
    /** When provided, use these fields instead of fetching filter-fields. Enables single-request flow with table-config. */
    fields?: FilterFieldConfig[];
    children: React.ReactNode;
};

export function FilterBuilderProviderView({ extraParams, fields, children }: FilterBuilderProviderProps) {
    const [refLabelsByFieldPath, setRefLabelsByFieldPath] = useState<Record<string, Record<string, string>>>({});

    const mergeRefLabels = useCallback((fieldPath: string, updates: Record<string, string>) => {
        if (!fieldPath || Object.keys(updates).length === 0) return;
        setRefLabelsByFieldPath((prev) => ({
            ...prev,
            [fieldPath]: { ...(prev[fieldPath] ?? {}), ...updates },
        }));
    }, []);

    const value = useMemo<FilterBuilderContextValue>(
        () => ({
            fields: fields ?? [],
            extraParams,
            refLabelsByFieldPath,
            mergeRefLabels,
        }),
        [fields, extraParams, refLabelsByFieldPath, mergeRefLabels]
    );

    return (
        <FilterBuilderContext.Provider value={value}>
            {children}
        </FilterBuilderContext.Provider>
    );
}

export const FilterBuilderProvider = compose(
    withLanguage("src/modules/core/components/custom/filterBuilder/filterBuilderContext.tsx")
)(FilterBuilderProviderView)
