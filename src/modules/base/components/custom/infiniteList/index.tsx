import {Fragment, ReactNode, useCallback, useContext, useEffect, useMemo, useRef} from "react";
import Loader from "@baseModule/components/custom/loader/loader.tsx";
import SimpleError from "@baseModule/components/custom/errors/errorViewWrapper.tsx";
import NoData from "@baseModule/components/custom/noData.tsx";
import {PaginatedResponse, useInfiniteScroll} from "@baseModule/helpers/hooks/useInfiniteScroll.ts";
import type {HttpError} from "@baseModule/helpers/hooks/useHttpRequest.ts";
import LoadMoreSentinel from "@baseModule/components/custom/loader/loadMoreSentinel.tsx";
import {LanguageResolveContext} from "@baseModule/helpers/hocs/withLanguage.tsx";

export type InfiniteListRenderItem<T> = (item: T) => ReactNode;

export type InfiniteListFilter = {
    offset: number;
    limit: number;
    [key: string]: unknown;
};

export type InfiniteListProps<T> = {
    data: PaginatedResponse<T> | null | undefined;
    loading: boolean;
    error?: unknown;
    onFilterChange: (filter: InfiniteListFilter) => void;
    limit?: number;
    forceReload?: number;
    /** Extra params merged into the filter on each request. When changed, triggers a reset and refetch. */
    extraParams?: Record<string, unknown>;
    getId?: (item: T) => string | number;
    renderItem: InfiniteListRenderItem<T>;
    renderError?: (args: {onRetry: () => void}) => ReactNode;
    renderNoData?: () => ReactNode;
    className?: string;
    scrollRootClassName?: string;
};

export default function InfiniteList<T extends {_id?: string | number}>({
    data,
    loading,
    error,
    onFilterChange,
    limit = 50,
    forceReload,
    extraParams,
    getId,
    renderItem,
    renderError,
    renderNoData,
    className,
    scrollRootClassName,
}: InfiniteListProps<T>) {
    const scrollRootRef = useRef<HTMLDivElement>(null);
    const extraParamsRef = useRef(extraParams);

    extraParamsRef.current = extraParams;

    // `extraParams` is read from a ref: it must reach the request without making this callback's
    // identity change on every render. Changing it deliberately refetches, via `extraParamsKey`.
    const wrappedOnFilterChange = useCallback(
        (filter: InfiniteListFilter) => onFilterChange({...filter, ...(extraParamsRef.current ?? {})}),
        [onFilterChange],
    );

    const {
        accumulatedItems,
        hasMoreData,
        canLoadMore,
        loadMore,
        handleReset,
    } = useInfiniteScroll({
        data,
        loading,
        onFilterChange: wrappedOnFilterChange,
        limit,
        forceReload,
        getId,
    });

    const extraParamsKey = useMemo(
        () => (extraParams != null ? JSON.stringify(extraParams) : ""),
        [extraParams],
    );

    const isFirstMountRef = useRef(true);
    useEffect(() => {
        if (isFirstMountRef.current) {
            isFirstMountRef.current = false;
            return; // Skip on mount – initial fetch handled by useInfiniteScroll
        }
        handleReset();
    }, [extraParamsKey, handleReset]);

    /**
     * Default copy comes from the nearest `withLanguage` ancestor — the card, dialog or page this
     * list lives in — which is what `LanguageResolveContext` is for. Every current caller overrides
     * `renderError`/`renderNoData`, so these defaults are the path a *new* caller takes, and they
     * used to be hardcoded English in a five-language panel.
     */
    const resolveAncestorKey = useContext(LanguageResolveContext);
    const translate = (key: string, fallback: string) => resolveAncestorKey?.(key, true) || fallback;

    const typedError = error && typeof error === "object" ? (error as HttpError) : undefined;
    const hasItems = accumulatedItems.length > 0;

    const renderErrorNode = () => {
        if (renderError) return renderError({onRetry: handleReset});
        return (
            <SimpleError
                title={translate("failTitle", "Error")}
                description={translate("failDescription", translate("failTitleTooltip", "Something went wrong."))}
                onClick={handleReset}
                error={typedError}
            />
        );
    };

    const renderNoDataNode = () => {
        if (renderNoData) return renderNoData();
        return <NoData title={translate("noDataTitle", "No data")}/>;
    };

    return (
        <div ref={scrollRootRef} className={scrollRootClassName}>
            {!hasItems && (error ? renderErrorNode() : loading ? <Loader/> : renderNoDataNode())}

            {hasItems && (
                <>
                    <div className={className}>
                        {accumulatedItems.map((item, index) => (
                            <Fragment key={getId?.(item) ?? item._id ?? index}>
                                {renderItem(item)}
                            </Fragment>
                        ))}
                        {/* Kept out of the tree while an error is showing: an armed sentinel sitting
                            in view would ask for the chunk that just failed. */}
                        {hasMoreData && !error && (
                            <LoadMoreSentinel
                                canLoadMore={canLoadMore}
                                onLoadMore={loadMore}
                                scrollRoot={scrollRootRef}
                            />
                        )}
                    </div>

                    {loading && (
                        <div className="flex justify-center py-4">
                            <Loader/>
                        </div>
                    )}

                    {/* A failed page N used to replace the whole list with an error box, throwing away
                        everything the user had already scrolled through. It belongs under the list. */}
                    {!!error && <div className="py-2">{renderErrorNode()}</div>}
                </>
            )}
        </div>
    );
}
