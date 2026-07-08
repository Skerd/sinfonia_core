import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import type { ViewConfig } from "armonia/src/modules/core/api/auxiliary/private/viewConfig";

import { useViewConfigMerge } from "@coreModule/helpers/context/viewConfigMergeContext.tsx";

export type CachedViewConfigs = Record<string, ViewConfig>;

type ViewConfigContextValue = {
    configs: Record<string, CachedViewConfigs>;
    /** True after the bulk `/api/auxiliary/viewConfigs` prefetch finishes (success or failure). */
    isHydrated: boolean;
    setModelConfigs: (model: string, views: CachedViewConfigs) => void;
    markHydrated: () => void;
    /** API/cache only — ignores studio or other merge overlays. */
    getApiViewConfig: (model: string, viewKey: string) => ViewConfig | undefined;
    /** Effective config after optional merge (e.g. Studio drafts). */
    getViewConfig: (model: string, viewKey: string) => ViewConfig | undefined;
};

const ViewConfigContext = createContext<ViewConfigContextValue | null>(null);

type ViewConfigProviderProps = {
    children: ReactNode;
};

export function ViewConfigProvider({ children }: ViewConfigProviderProps) {
    const [configs, setConfigs] = useState<Record<string, CachedViewConfigs>>({});
    const [isHydrated, setIsHydrated] = useState(false);
    const merge = useViewConfigMerge();

    const setModelConfigs = useCallback((model: string, views: CachedViewConfigs) => {
        setConfigs((prev) => ({ ...prev, [model]: views }));
    }, []);

    const markHydrated = useCallback(() => {
        setIsHydrated(true);
    }, []);

    const getApiViewConfig = useCallback(
        (model: string, viewKey: string): ViewConfig | undefined => {
            return configs[model.toLowerCase()]?.[viewKey];
        },
        [configs],
    );

    const getViewConfig = useCallback(
        (model: string, viewKey: string): ViewConfig | undefined => {
            const base = configs[model.toLowerCase()]?.[viewKey];
            return merge(base, model, viewKey);
        },
        [configs, merge],
    );

    const value = useMemo<ViewConfigContextValue>(
        () => ({ configs, isHydrated, setModelConfigs, markHydrated, getApiViewConfig, getViewConfig }),
        [configs, isHydrated, setModelConfigs, markHydrated, getApiViewConfig, getViewConfig],
    );

    return (
        <ViewConfigContext.Provider value={value}>
            {children}
        </ViewConfigContext.Provider>
    );
}

export function useViewConfigContext(): ViewConfigContextValue | null {
    return useContext(ViewConfigContext);
}
