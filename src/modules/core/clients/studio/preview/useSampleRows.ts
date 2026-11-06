import {useMemo, useState} from "react";
import {useSelector} from "react-redux";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import type {TableResponse} from "armonia/src/modules/core/types/shared.types.ts";

const SAMPLE_REQUEST = {method: "post" as const, url: "", data: {}, extraHeader: {"x-studio-sample": "1"}};

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
 * `{offset, limit}`. Rows belong to the signed-in company. `x-studio-sample` only lets
 * the development server accept the read when that company was not granted the module;
 * switch company to load the rows that company actually has.
 */
export function useSampleRows(apiUrl: string | undefined, limit = 5): SampleRowsState {
    const companyId = useSelector((state: RootState) => state.authentication.user?.company?._id);
    // A new load per endpoint, company or size; silent (the preview shows the error itself).
    const loadKey = apiUrl ? `${apiUrl}|${companyId ?? ""}|${limit}` : "";
    const [load, setLoad] = useState({loadKey, count: loadKey ? 1 : 0});
    if (load.loadKey !== loadKey) setLoad({loadKey, count: loadKey ? load.count + 1 : load.count});
    const body = useMemo(() => ({offset: 0, limit}), [limit]);
    const runtimeProps = useMemo(() => ({url: apiUrl}), [apiUrl]);
    const {data, loading, error} = useHttpRequest<TableResponse<SampleRow>>(SAMPLE_REQUEST, body, load.count, true, {}, runtimeProps);

    const state: SampleRowsState = !apiUrl
        ? {rows: [], loading: false, error: null}
        : {
            rows: loading || error ? [] : data?.data ?? [],
            loading,
            error: error ? error.message || "Could not load sample rows" : null,
        };
    return state;
}
