import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import type { ViewConfig, ViewConfiguration } from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import useErrorHandler from "@coreModule/helpers/hooks/useErrorHandler.ts";
import {SessionSetupScreen, SESSION_SETUP_TOTAL_STEPS} from "@coreModule/components/ui/sessionSetupScreen.tsx";

export type CachedViewConfigs = Record<string, ViewConfig>;

type ViewConfigContextValue = {
    configs: Record<string, CachedViewConfigs>;
    /** True after the bulk `/api/auxiliary/viewConfigs` prefetch finishes. */
    isHydrated: boolean;
    setModelConfigs: (model: string, views: CachedViewConfigs) => void;
    getViewConfig: (model: string, viewKey: string) => ViewConfig | undefined;
};

const ViewConfigContext = createContext<ViewConfigContextValue | null>(null);

type ViewConfigProviderProps = {
    children: ReactNode;
    setupStep?: number;
    setupTotal?: number;
};

function configsFromResponse(data: ViewConfiguration): Record<string, CachedViewConfigs> {
    const next: Record<string, CachedViewConfigs> = {};
    for (const [model, views] of Object.entries(data)) {
        next[model.toLowerCase()] = views;
    }
    return next;
}

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
    const [isHydrated, setIsHydrated] = useState(false);
    const [error, setError] = useState(false);
    const [retryToken, setRetryToken] = useState(0);
    const handleError = useErrorHandler(useMemo(() => ({context: "ViewConfigProvider"}), []));

    const setModelConfigs = useCallback((model: string, views: CachedViewConfigs) => {
        setConfigs((prev) => ({ ...prev, [model.toLowerCase()]: views }));
    }, []);

    const getViewConfig = useCallback((model: string, viewKey: string): ViewConfig | undefined => {
        return configs[model.toLowerCase()]?.[viewKey];
    }, [configs]);

    useEffect(() => {
        const abortController = new AbortController();
        setError(false);
        setIsHydrated(false);

        apiClient
            .get<ViewConfiguration>("/api/auxiliary/viewConfigs", {signal: abortController.signal})
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

    const value = useMemo<ViewConfigContextValue>(() => ({
        configs, isHydrated, setModelConfigs, getViewConfig
    }), [configs, isHydrated, setModelConfigs, getViewConfig]);

    if( error || !isHydrated ){
        return (
            <SessionSetupScreen
                step={setupStep}
                total={setupTotal}
                phase="view"
                error={error}
                onRetry={() => setRetryToken((n) => n + 1)}
            />
        )
    }

    return (
        <ViewConfigContext.Provider value={value}>
            {children}
        </ViewConfigContext.Provider>
    );
}

export function useViewConfigContext(): ViewConfigContextValue | null {
    return useContext(ViewConfigContext);
}
