import {createContext, useCallback, useEffect, useMemo, useState, type ReactNode} from "react";
import type {ViewConfig, ViewConfiguration} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import apiClient from "@baseModule/helpers/apiClient/apiClient.ts";
import useErrorHandler from "@baseModule/helpers/hooks/useErrorHandler.ts";
import {SessionSetupScreen, SESSION_SETUP_TOTAL_STEPS} from "@baseModule/components/custom/sessionSetupScreen.tsx";

/** One collection's views, keyed by view key (`sheet`, `form:create`, …). */
export type CachedViewConfigs = Record<string, ViewConfig>;

export type ViewConfigContextValue = {
    /** Cached configs by lower-cased collection name. Read them through `useViewConfig`. */
    configs: Record<string, CachedViewConfigs>;
    /** True after the bulk `/api/auxiliary/viewConfigs` prefetch finishes. */
    isHydrated: boolean;
};

export const VIEW_CONFIGS_URL = "/api/auxiliary/viewConfigs";

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

/**
 * Build the cache from `GET /api/auxiliary/viewConfigs`. Collection names are lower-cased
 * (views of names differing only in case are merged); malformed entries are skipped.
 */
export function configsFromResponse(data: ViewConfiguration | null | undefined): Record<string, CachedViewConfigs> {
    const next: Record<string, CachedViewConfigs> = {};
    for (const [model, views] of Object.entries(data ?? {})) {
        if (!isPlainObject(views)) continue;
        const key = model.toLowerCase();
        next[key] = next[key] ? {...next[key], ...views} : views;
    }
    return next;
}

/** Exported for tests and previews that supply configs directly; app code mounts `ViewConfigProvider`. */
export const ViewConfigContext = createContext<ViewConfigContextValue | null>(null);

type ViewConfigProviderProps = {
    children: ReactNode;
    setupStep?: number;
    setupTotal?: number;
};

type LoadState = "loading" | "ready" | "error";

/**
 * Fetches all view configs (`GET /api/auxiliary/viewConfigs`) and caches them by collection name.
 * Mount only on the authenticated tree. Blocks children with a loader until the prefetch finishes.
 */
export function ViewConfigProvider({
    children,
    setupStep = 3,
    setupTotal = SESSION_SETUP_TOTAL_STEPS,
}: ViewConfigProviderProps) {
    const [configs, setConfigs] = useState<Record<string, CachedViewConfigs>>({});
    const [loadState, setLoadState] = useState<LoadState>("loading");
    const [attempt, setAttempt] = useState(0);
    const handleError = useErrorHandler({context: "ViewConfigProvider"});

    useEffect(() => {
        const abortController = new AbortController();
        setLoadState("loading");

        apiClient
            .get<ViewConfiguration>(VIEW_CONFIGS_URL, {signal: abortController.signal})
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
    const value = useMemo<ViewConfigContextValue>(() => ({configs, isHydrated}), [configs, isHydrated]);

    if (!isHydrated) {
        return (
            <SessionSetupScreen
                step={setupStep}
                total={setupTotal}
                phase="view"
                error={loadState === "error"}
                onRetry={retry}
            />
        );
    }

    return <ViewConfigContext.Provider value={value}>{children}</ViewConfigContext.Provider>;
}
