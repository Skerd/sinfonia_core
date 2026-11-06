import {useState} from "react";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import type {HttpError, HttpRequest, HttpRequestRuntimeProps} from "@coreModule/helpers/types/httpRequest.types.ts";
import type {TableResponse} from "armonia/src/modules/core/types/shared.types.ts";

export type AllPagesOptions = {
    /** Rows asked for per request. Default 200. */
    pageSize?: number;
    /** Stop after this many rows; `truncated` then says the list was cut. Default 5000. */
    maxRows?: number;
    /** Same as `useHttpRequest`: requests wait while false. Default true. */
    inViewPort?: boolean;
    /** Same as `useHttpRequest`'s runtime props (path/header builders, `resolveLanguageKey` for toasts). */
    props?: HttpRequestRuntimeProps;
};

export type AllPagesState<T> = {
    /** Every row, once the last page arrived; empty while loading and after an error. */
    rows: T[];
    /** The server's `total` for the whole list. */
    total: number;
    /** True from the first page until the last one settled. */
    loading: boolean;
    error: HttpError | null;
    /** More rows exist than `maxRows` allowed. */
    truncated: boolean;
};

type Run<T> = {
    fetchCount: number;
    /** Request counter for `useHttpRequest`: one per page. */
    pageCount: number;
    offset: number;
    collected: T[];
    done: boolean;
    rows: T[];
    total: number;
    truncated: boolean;
};

/**
 * Loads every page of a list endpoint (`{offset, limit}` → `TableResponse<T>`), for views that
 * need the whole set at once, such as a calendar month. Built on {@link useHttpRequest}, so it
 * shares its abort, rate-limit and toast behavior; each page is one request.
 *
 * Like `useHttpRequest`, a load starts when `fetchCount` changes (and is > 0): bump it when the
 * filters in `requestData` change. A newer load aborts the one still running.
 */
export default function useAllPages<T>(
    httpRequest: HttpRequest,
    requestData: Record<string, unknown>,
    fetchCount: number,
    {pageSize = 200, maxRows = 5000, inViewPort = true, props = {}}: AllPagesOptions = {},
): AllPagesState<T> {
    const fresh = (count: number, pageCount: number): Run<T> => ({
        fetchCount: count,
        pageCount: count > 0 ? pageCount + 1 : pageCount,
        offset: 0,
        collected: [],
        done: count <= 0,
        rows: [],
        total: 0,
        truncated: false,
    });
    const [run, setRun] = useState<Run<T>>(() => fresh(fetchCount, 0));
    let current = run;
    if (run.fetchCount !== fetchCount) {
        current = fresh(fetchCount, run.pageCount);
        setRun(current);
    }

    const {error} = useHttpRequest<TableResponse<T>>(
        httpRequest,
        {...requestData, offset: current.offset, limit: pageSize},
        current.pageCount,
        inViewPort,
        {
            success: (page) => setRun((previous) => {
                // A page of a load that was replaced since (only possible after its abort raced the response).
                if (previous.fetchCount !== current.fetchCount) return previous;
                const collected = [...previous.collected, ...page.data];
                const more = page.data.length === pageSize && collected.length < page.total && collected.length < maxRows;
                if (more) {
                    return {...previous, collected, offset: collected.length, pageCount: previous.pageCount + 1};
                }
                return {
                    ...previous,
                    collected: [],
                    done: true,
                    rows: collected,
                    total: page.total,
                    truncated: page.total > collected.length && collected.length >= maxRows,
                };
            }),
            error: () => setRun((previous) => (
                previous.fetchCount === current.fetchCount ? {...previous, collected: [], done: true, rows: [], total: 0} : previous
            )),
        },
        props,
    );

    return {
        rows: current.rows,
        total: current.total,
        loading: !current.done,
        error: current.done ? error : null,
        truncated: current.truncated,
    };
}
