import { ComponentType, useEffect } from "react";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import { tableConfigToFilterConfig } from "armonia/src/modules/core/database/filter/pathUtils.ts";
import { TableConfiguration } from "armonia/src/modules/core/api/auxiliary/private/tableConfigs/tableConfig.dto.ts";
import { useTableConfigContext } from "@coreModule/helpers/context/tableConfigContext.tsx";

/**
 * HOC that pre-fetches all table configurations from the bulk endpoint and populates TableConfigContext.
 * Uses collection names as context keys (e.g. "cities", "countries"). Child components pass the key
 * to useTableConfig(tableConfigKey) to read config.
 *
 * Must be used within TableConfigProvider. Fetches run in the background; children render immediately.
 */
function withTableConfig<TProps extends object>() {
    return (WrappedComponent: ComponentType<TProps>) => {
        function WithTableConfigComponent(props: TProps) {
            const tableConfigContext = useTableConfigContext();

            useEffect(() => {
                if (!tableConfigContext) return;

                let cancelled = false;

                apiClient
                    .get<TableConfiguration>("/api/auxiliary/tableConfigs")
                    .then((res) => {
                        if (cancelled || !res.data) return;

                        const data = res.data ?? {};
                        for (const [key, cols] of Object.entries(data)) {
                            if (!Array.isArray(cols)) continue;
                            tableConfigContext.setConfig(key, {
                                filters: tableConfigToFilterConfig(cols),
                                columns: cols,
                                columnVisibility: Object.fromEntries(cols.map((col) => [col.id, col.visible])),
                            });
                        }
                    })
                    .catch(() => {
                        // Silently ignore pre-fetch errors
                    });

                return () => {
                    cancelled = true;
                };
            }, []);

            return <WrappedComponent {...props} />;
        }

        return WithTableConfigComponent;
    };
}

export default withTableConfig;
