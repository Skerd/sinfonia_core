import {createContext, useCallback, useEffect, useMemo, useState, type ReactNode} from "react";
import type {FilterFieldConfig} from "armonia/src/modules/core/database/filter/fieldRegistry.types.ts";
import type {TableColumnConfig} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type.ts";
import type {TableConfiguration} from "armonia/src/modules/core/api/auxiliary/private/tableConfigs/tableConfig.dto.ts";
import {tableConfigToFilterConfig} from "armonia/src/modules/core/database/filter/pathUtils.ts";
import {getLocalStorageValue, setLocalStorageValue} from "@coreModule/helpers/context/localStorage/localStorageProvider.ts";
import {getUser} from "@coreModule/helpers/context/localStorage/authenticationStorage.ts";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import useErrorHandler from "@coreModule/helpers/hooks/useErrorHandler.ts";
import {SessionSetupScreen, SESSION_SETUP_TOTAL_STEPS} from "@coreModule/components/custom/sessionSetupScreen.tsx";

export type ColumnVisibility = Record<string, boolean>;

export type CachedTableConfig = {
    filters: FilterFieldConfig[];
    columns: TableColumnConfig[];
    columnVisibility?: ColumnVisibility;
};

export type TableConfigContextValue = {
    /** Keyed by lower-cased table config key. */
    configs: Record<string, CachedTableConfig>;
    isHydrated: boolean;
    setConfig: (resourceUrl: string, config: CachedTableConfig) => void;
    clearConfig: (resourceUrl: string) => void;
    /** Replaces a table's visibility and persists it for the current user. */
    updateColumnVisibility: (tableConfigKey: string, visibility: ColumnVisibility) => void;
};

export const TABLE_CONFIGS_URL = "/api/auxiliary/tableConfigs";

// ---------------------------------------------------------------------------
// Per-user column visibility (localStorage)
// ---------------------------------------------------------------------------

export function columnVisibilityStorageKey(userId: string, tableConfigKey: string): string {
    return `column-visibility:${tableConfigKey}:${userId}`;
}

/** Stored visibility for a table, keeping only boolean entries. `null` when missing or unreadable. */
function loadStoredVisibility(userId: string, tableConfigKey: string): ColumnVisibility | null {
    try {
        const raw = getLocalStorageValue(columnVisibilityStorageKey(userId, tableConfigKey));
        const parsed: unknown = raw ? JSON.parse(raw) : null;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
        return Object.fromEntries(Object.entries(parsed).filter(([, visible]) => typeof visible === "boolean"));
    } catch {
        return null;
    }
}

function saveStoredVisibility(userId: string, tableConfigKey: string, visibility: ColumnVisibility): void {
    try {
        setLocalStorageValue(columnVisibilityStorageKey(userId, tableConfigKey), JSON.stringify(visibility));
    } catch {
        // localStorage unavailable (quota, private mode, etc.)
    }
}

/**
 * Overlay the user's stored choices on the server defaults. Only columns the server
 * still knows are taken, so removed columns don't linger and new ones use their default.
 */
export function mergeWithStoredVisibility(
    defaults: ColumnVisibility,
    userId: string | undefined,
    tableConfigKey: string,
): ColumnVisibility {
    const stored = userId ? loadStoredVisibility(userId, tableConfigKey) : null;
    if (!stored) return defaults;
    const merged = {...defaults};
    for (const [columnId, visible] of Object.entries(stored)) {
        if (Object.hasOwn(merged, columnId)) merged[columnId] = visible;
    }
    return merged;
}

// ---------------------------------------------------------------------------
// Response → cache
// ---------------------------------------------------------------------------

const normalizeKey = (key: string) => key.toLowerCase();

function toCachedConfig(key: string, columns: TableColumnConfig[], userId: string | undefined): CachedTableConfig {
    const defaults = Object.fromEntries(columns.map((column) => [column.id, column.visible]));
    return {
        filters: tableConfigToFilterConfig(columns),
        columns,
        columnVisibility: mergeWithStoredVisibility(defaults, userId, key),
    };
}

/** Build the cache from `GET /api/auxiliary/tableConfigs`; keys are lower-cased, non-array entries skipped. */
export function configsFromResponse(
    data: TableConfiguration | null | undefined,
    userId: string | undefined = getUser()?.id,
): Record<string, CachedTableConfig> {
    const next: Record<string, CachedTableConfig> = {};
    for (const [rawKey, columns] of Object.entries(data ?? {})) {
        if (!Array.isArray(columns)) continue;
        const key = normalizeKey(rawKey);
        next[key] = toCachedConfig(key, columns, userId);
    }
    return next;
}

// ---------------------------------------------------------------------------
// Context & provider
// ---------------------------------------------------------------------------

/** Exported for tests and previews that supply configs directly; app code mounts `TableConfigProvider`. */
export const TableConfigContext = createContext<TableConfigContextValue | null>(null);

type TableConfigProviderProps = {
    children: ReactNode;
    setupStep?: number;
    setupTotal?: number;
};

type LoadState = "loading" | "ready" | "error";

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
    const [loadState, setLoadState] = useState<LoadState>("loading");
    const [attempt, setAttempt] = useState(0);
    const handleError = useErrorHandler({context: "TableConfigProvider"});

    const setConfig = useCallback((resourceUrl: string, config: CachedTableConfig) => {
        const key = normalizeKey(resourceUrl);
        const columnVisibility = config.columnVisibility
            ? mergeWithStoredVisibility(config.columnVisibility, getUser()?.id, key)
            : undefined;
        setConfigs((prev) => ({...prev, [key]: {...config, columnVisibility}}));
    }, []);

    const clearConfig = useCallback((resourceUrl: string) => {
        const key = normalizeKey(resourceUrl);
        setConfigs((prev) => {
            if (!Object.hasOwn(prev, key)) return prev;
            const {[key]: _removed, ...rest} = prev;
            return rest;
        });
    }, []);

    const updateColumnVisibility = useCallback((tableConfigKey: string, visibility: ColumnVisibility) => {
        const key = normalizeKey(tableConfigKey);
        const userId = getUser()?.id;
        if (userId) saveStoredVisibility(userId, key, visibility);
        setConfigs((prev) => {
            const existing = prev[key];
            if (!existing) return prev;
            return {...prev, [key]: {...existing, columnVisibility: visibility}};
        });
    }, []);

    useEffect(() => {
        const abortController = new AbortController();
        setLoadState("loading");

        apiClient
            .get<TableConfiguration>(TABLE_CONFIGS_URL, {signal: abortController.signal})
            .then((res) => {
                if (abortController.signal.aborted) return;
                setConfigs(configsFromResponse(res.data));
                setLoadState("ready");
            })
            .catch((e: unknown) => {
                if (abortController.signal.aborted) return;
                handleError(e);
                setLoadState("error");
            });

        return () => abortController.abort();
    }, [handleError, attempt]);

    const isHydrated = loadState === "ready";
    const retry = useCallback(() => setAttempt((n) => n + 1), []);

    const value = useMemo<TableConfigContextValue>(
        () => ({configs, isHydrated, setConfig, clearConfig, updateColumnVisibility}),
        [configs, isHydrated, setConfig, clearConfig, updateColumnVisibility],
    );

    if (!isHydrated) {
        return (
            <SessionSetupScreen
                step={setupStep}
                total={setupTotal}
                phase="table"
                error={loadState === "error"}
                onRetry={retry}
            />
        );
    }

    return <TableConfigContext.Provider value={value}>{children}</TableConfigContext.Provider>;
}
