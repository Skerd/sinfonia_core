import {createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,} from "react";
import { FilterFieldConfig } from "armonia/src/modules/core/database/filter/fieldRegistry.types.ts";
import { TableColumnConfig } from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type.ts";
import { TableConfiguration } from "armonia/src/modules/core/api/auxiliary/private/tableConfigs/tableConfig.dto.ts";
import { tableConfigToFilterConfig } from "armonia/src/modules/core/database/filter/pathUtils.ts";
import {getLocalStorageValue, setLocalStorageValue} from "@coreModule/helpers/context/localStorage/localStorageProvider.ts";
import {getUser} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import useErrorHandler from "@coreModule/helpers/hooks/useErrorHandler.ts";
import {SessionSetupScreen, SESSION_SETUP_TOTAL_STEPS} from "@coreModule/components/ui/sessionSetupScreen.tsx";

export type CachedTableConfig = {
    filters: FilterFieldConfig[];
    columns: TableColumnConfig[];
    columnVisibility?: Record<string, boolean>;
};

type TableConfigContextValue = {
    configs: Record<string, CachedTableConfig>;
    isHydrated: boolean;
    setConfig: (resourceUrl: string, config: CachedTableConfig) => void;
    clearConfig: (resourceUrl: string) => void;
    updateColumnVisibility: (tableConfigKey: string, visibility: Record<string, boolean>) => void;
};

function columnVisibilityStorageKey(userId: string, tableConfigKey: string): string {
    return `column-visibility:${tableConfigKey}:${userId}`;
}

function loadStoredVisibility(userId: string, tableConfigKey: string): Record<string, boolean> | null {
    try {
        const raw = getLocalStorageValue(columnVisibilityStorageKey(userId, tableConfigKey));
        if (!raw) return null;
        return JSON.parse(raw) as Record<string, boolean>;
    } catch {
        return null;
    }
}

function saveStoredVisibility(userId: string, tableConfigKey: string, visibility: Record<string, boolean>): void {
    try {
        setLocalStorageValue(columnVisibilityStorageKey(userId, tableConfigKey), JSON.stringify(visibility));
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

function configsFromResponse(data: TableConfiguration): Record<string, CachedTableConfig> {
    const next: Record<string, CachedTableConfig> = {};
    const userId = getUser()?.id;
    for (const [key, cols] of Object.entries(data)) {
        if (!Array.isArray(cols)) continue;
        const k = key.toLowerCase();
        const columnVisibility = Object.fromEntries(cols.map((col) => [col.id, col.visible]));
        next[k] = {
            filters: tableConfigToFilterConfig(cols),
            columns: cols,
            columnVisibility: userId ? mergeWithStored(columnVisibility, userId, k) : columnVisibility,
        };
    }
    return next;
}

const TableConfigContext = createContext<TableConfigContextValue | null>(null);

type TableConfigProviderProps = {
    children: ReactNode;
    setupStep?: number;
    setupTotal?: number;
};

/**
 * Fetches all table configs (`GET /api/auxiliary/tableConfigs`) and caches them by collection name.
 * Mount only on the authenticated tree. Blocks children with a loader until the prefetch finishes.
 */
export function TableConfigProvider({
    children,
    setupStep = 2,
    setupTotal = SESSION_SETUP_TOTAL_STEPS,
}: TableConfigProviderProps) {
    const [configs, setConfigs] = useState<Record<string, CachedTableConfig>>({});
    const [isHydrated, setIsHydrated] = useState(false);
    const [error, setError] = useState(false);
    const [retryToken, setRetryToken] = useState(0);
    const handleError = useErrorHandler(useMemo(() => ({context: "TableConfigProvider"}), []));

    const setConfig = useCallback((resourceUrl: string, config: CachedTableConfig) => {
        const key = resourceUrl.toLowerCase();
        const userId = getUser()?.id;
        const merged = userId && config.columnVisibility ? mergeWithStored(config.columnVisibility, userId, key) : config.columnVisibility;
        setConfigs((prev) => ({
                ...prev,
                [key]: {
                    ...config,
                    columnVisibility: merged
                }
            })
        );
    }, []);

    const clearConfig = useCallback((resourceUrl: string) => {
        const key = resourceUrl.toLowerCase();
        setConfigs((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }, []);

    const updateColumnVisibility = useCallback((tableConfigKey: string, visibility: Record<string, boolean>) => {
        const key = tableConfigKey.toLowerCase();
        const userId = getUser()?.id;
        if (userId) saveStoredVisibility(userId, key, visibility);
        setConfigs((prev) => {
            const existing = prev[key];
            if (!existing) return prev;
            return {
                ...prev,
                [key]: {
                    ...existing,
                    columnVisibility: visibility
                }
            };
        });
    }, []);

    useEffect(() => {
        const abortController = new AbortController();
        setError(false);
        setIsHydrated(false);

        apiClient
            .get<TableConfiguration>("/api/auxiliary/tableConfigs", {signal: abortController.signal})
            .then((res) => {
                if (abortController.signal.aborted) return;
                setConfigs(configsFromResponse(res.data ?? {}));
                setIsHydrated(true);
                setError(false);
            })
            .catch((e: unknown) => {
                if (abortController.signal.aborted) return;
                handleError(e);
                setError(true);
                setIsHydrated(false);
            });

        return () => {
            abortController.abort();
        };
    }, [handleError, retryToken]);

    const value = useMemo<TableConfigContextValue>(() => ({
        configs, isHydrated, setConfig, clearConfig, updateColumnVisibility
    }), [configs, isHydrated, setConfig, clearConfig, updateColumnVisibility]);

    if( error || !isHydrated ){
        return (
            <SessionSetupScreen
                step={setupStep}
                total={setupTotal}
                phase="table"
                error={error}
                onRetry={() => setRetryToken((n) => n + 1)}
            />
        )
    }

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
