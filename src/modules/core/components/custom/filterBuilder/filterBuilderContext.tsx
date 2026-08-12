import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { FilterFieldConfig } from "armonia/src/modules/core/database/filter";
import type { FilterRefLabels } from "@coreModule/helpers/filter/filterUrl.ts";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";

type FilterBuilderContextValue = {
    fields: FilterFieldConfig[];
    extraParams?: Record<string, unknown>;
    /** Display labels for ref-backed objectId values (keyed by filter field path, then id). */
    refLabelsByFieldPath: FilterRefLabels;
    mergeRefLabels: (fieldPath: string, updates: Record<string, string>) => void;
    /** Replace the full label map (URL hydrate / clear). */
    replaceRefLabels: (labels: FilterRefLabels) => void;
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
    /** Seed from `filterLabels` URL param so chips render without select hydrate. */
    initialRefLabels?: FilterRefLabels;
    children: React.ReactNode;
};

export function FilterBuilderProviderView({
    extraParams,
    fields,
    initialRefLabels,
    children,
}: FilterBuilderProviderProps) {
    const [refLabelsByFieldPath, setRefLabelsByFieldPath] = useState<FilterRefLabels>(
        () => initialRefLabels ?? {},
    );

    // Re-seed when URL `filterLabels` changes (back/forward / shared links).
    const initialKey = useMemo(
        () => JSON.stringify(initialRefLabels ?? {}),
        [initialRefLabels],
    );
    useEffect(() => {
        setRefLabelsByFieldPath(initialRefLabels ?? {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialKey]);

    const mergeRefLabels = useCallback((fieldPath: string, updates: Record<string, string>) => {
        if (!fieldPath || Object.keys(updates).length === 0) return;
        setRefLabelsByFieldPath((prev) => ({
            ...prev,
            [fieldPath]: { ...(prev[fieldPath] ?? {}), ...updates },
        }));
    }, []);

    const replaceRefLabels = useCallback((labels: FilterRefLabels) => {
        setRefLabelsByFieldPath(labels ?? {});
    }, []);

    const value = useMemo<FilterBuilderContextValue>(
        () => ({
            fields: fields ?? [],
            extraParams,
            refLabelsByFieldPath,
            mergeRefLabels,
            replaceRefLabels,
        }),
        [fields, extraParams, refLabelsByFieldPath, mergeRefLabels, replaceRefLabels]
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
