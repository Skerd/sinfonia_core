import {useEffect, useState} from "react";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import type {TableResponse} from "armonia/src/modules/core/types/shared.types.ts";

export type SampleRow = Record<string, unknown> & {_id: string};

type SampleRowsState = {
    rows: SampleRow[];
    loading: boolean;
    error: string | null;
};

/**
 * Loads a handful of real rows so a sheet preview shows the widgets a live entity
 * actually triggers — `dependent` prunes empty branches, so an empty object would
 * render almost nothing and hide most of the config being edited.
 *
 * Uses the list endpoint every `CardAndTableView` uses: `POST <apiUrl>` with
 * `{offset, limit}`. Failures are surfaced rather than swallowed; a model whose list
 * the current user cannot read is a real thing to know while editing its view.
 */
export function useSampleRows(apiUrl: string | undefined, limit = 5): SampleRowsState {
    const [state, setState] = useState<SampleRowsState>({rows: [], loading: false, error: null});

    useEffect(() => {
        if (!apiUrl) {
            setState({rows: [], loading: false, error: null});
            return;
        }

        const abort = new AbortController();
        setState({rows: [], loading: true, error: null});

        apiClient
            .post<TableResponse<SampleRow>>(apiUrl, {offset: 0, limit}, {signal: abort.signal})
            .then(({data}) => {
                if (abort.signal.aborted) return;
                setState({rows: data?.data ?? [], loading: false, error: null});
            })
            .catch((error: unknown) => {
                if (abort.signal.aborted) return;
                setState({
                    rows: [],
                    loading: false,
                    error: error instanceof Error ? error.message : "Could not load sample rows",
                });
            });

        return () => abort.abort();
    }, [apiUrl, limit]);

    return state;
}
