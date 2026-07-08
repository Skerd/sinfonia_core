import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { FilterFieldConfig } from "armonia/src/modules/core/database/filter/fieldRegistry.types.ts";
import { TableColumnConfig } from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type.ts";
import { getUser } from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";

/** Cached table config shape (successful fetch result, no loading/error). */
export type CachedTableConfig = {
    filters: FilterFieldConfig[];
    columns: TableColumnConfig[];
    columnVisibility?: Record<string, boolean>;
};

type TableConfigContextValue = {
    configs: Record<string, CachedTableConfig>;
    setConfig: (resourceUrl: string, config: CachedTableConfig) => void;
    clearConfig: (resourceUrl: string) => void;
    updateColumnVisibility: (tableConfigKey: string, visibility: Record<string, boolean>) => void;
};

function colvisStorageKey(userId: string, tableConfigKey: string): string {
    return `colvis:${userId}:${tableConfigKey}`;
}

function loadStoredVisibility(userId: string, tableConfigKey: string): Record<string, boolean> | null {
    try {
        const raw = localStorage.getItem(colvisStorageKey(userId, tableConfigKey));
        if (!raw) return null;
        return JSON.parse(raw) as Record<string, boolean>;
    } catch {
        return null;
    }
}

function saveStoredVisibility(userId: string, tableConfigKey: string, visibility: Record<string, boolean>): void {
    try {
        localStorage.setItem(colvisStorageKey(userId, tableConfigKey), JSON.stringify(visibility));
    } catch {
        // localStorage unavailable (quota, private mode, etc.)
    }
}

function mergeWithStored(serverVisibility: Record<string, boolean>, userId: string, tableConfigKey: string): Record<string, boolean> {
    const stored = loadStoredVisibility(userId, tableConfigKey);
    if (!stored) return serverVisibility;
    const merged = { ...serverVisibility };
    for (const [colId, vis] of Object.entries(stored)) {
        if (colId in merged) merged[colId] = vis;
    }
    return merged;
}

const TableConfigContext = createContext<TableConfigContextValue | null>(null);

type TableConfigProviderProps = {
    children: ReactNode;
};

/**
 * Provides a cache for table configs keyed by resourceUrl.
 * When useTableConfig fetches a config, it stores it here so sibling/descendant
 * components can read from context instead of re-fetching.
 */
export function TableConfigProvider({ children }: TableConfigProviderProps) {
    const [configs, setConfigs] = useState<Record<string, CachedTableConfig>>({});

    const setConfig = useCallback((resourceUrl: string, config: CachedTableConfig) => {
        const userId = getUser()?.id;
        const merged =
            userId && config.columnVisibility
                ? mergeWithStored(config.columnVisibility, userId, resourceUrl)
                : config.columnVisibility;
        setConfigs((prev) => ({
            ...prev,
            [resourceUrl]: { ...config, columnVisibility: merged },
        }));
    }, []);

    const clearConfig = useCallback((resourceUrl: string) => {
        setConfigs((prev) => {
            const next = { ...prev };
            delete next[resourceUrl];
            return next;
        });
    }, []);

    const updateColumnVisibility = useCallback((tableConfigKey: string, visibility: Record<string, boolean>) => {
        const userId = getUser()?.id;
        if (userId) saveStoredVisibility(userId, tableConfigKey, visibility);
        setConfigs((prev) => {
            const existing = prev[tableConfigKey];
            if (!existing) return prev;
            return { ...prev, [tableConfigKey]: { ...existing, columnVisibility: visibility } };
        });
    }, []);

    const value = useMemo<TableConfigContextValue>(
        () => ({ configs, setConfig, clearConfig, updateColumnVisibility }),
        [configs, setConfig, clearConfig, updateColumnVisibility]
    );

    return (
        <TableConfigContext.Provider value={value}>
            {children}
        </TableConfigContext.Provider>
    );
}

/** Returns the table config context value, or null when used outside a provider. */
export function useTableConfigContext(): TableConfigContextValue | null {
    return useContext(TableConfigContext);
}
