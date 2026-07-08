import { ComponentType, useEffect } from "react";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import type { ViewConfiguration } from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import { useViewConfigContext } from "@coreModule/helpers/context/viewConfigContext.tsx";

/**
 * HOC that pre-fetches all view configurations from the bulk endpoint and populates ViewConfigContext.
 * Mirrors the withTableConfig pattern: fetches run in the background, children render immediately.
 *
 * Must be used within ViewConfigProvider.
 */
function withViewConfig<TProps extends object>() {
    return (WrappedComponent: ComponentType<TProps>) => {
        function WithViewConfigComponent(props: TProps) {
            const viewConfigContext = useViewConfigContext();

            useEffect(() => {
                if (!viewConfigContext) return;

                let cancelled = false;

                apiClient
                    .get<ViewConfiguration>("/api/auxiliary/viewConfigs")
                    .then((res) => {
                        if (cancelled || !res.data) return;

                        for (const [model, views] of Object.entries(res.data)) {
                            viewConfigContext.setModelConfigs(model, views);
                        }
                    })
                    .catch(() => {
                        // Silently ignore pre-fetch errors — views fall back to hand-coded components
                    })
                    .finally(() => {
                        if (!cancelled) {
                            viewConfigContext.markHydrated();
                        }
                    });

                return () => {
                    cancelled = true;
                };
            }, []);

            return <WrappedComponent {...props} />;
        }

        return WithViewConfigComponent;
    };
}

export default withViewConfig;
