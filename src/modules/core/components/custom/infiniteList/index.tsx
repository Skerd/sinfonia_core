import {Fragment, ReactNode, RefObject, useCallback, useEffect, useMemo, useRef} from "react";
import Loader from "@baseModule/components/custom/loader/loader.tsx";
import SimpleError from "@baseModule/components/custom/errors/errorViewWrapper.tsx";
import NoData from "@baseModule/components/custom/noData.tsx";
import {PaginatedResponse, useInfiniteScroll} from "@baseModule/helpers/hooks/useInfiniteScroll.ts";
import type {HttpError} from "@baseModule/helpers/hooks/useHttpRequest.ts";
import LoadMoreSentinel from "@baseModule/components/custom/loader/loadMoreSentinel.tsx";

export type InfiniteListRenderItem<T> = (
    item: T,
    allItemsRef: RefObject<T[]>
) => ReactNode;

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
    enabled?: boolean;
    forceReload?: number;
    /** Extra params merged into the filter on each request. When changed, triggers a reset and refetch. */
    extraParams?: Record<string, unknown>;
    getId?: (item: T) => string | number;
    renderItem: InfiniteListRenderItem<T>;
    renderError?: (args: {onRetry: () => void}) => ReactNode;
    renderLoading?: () => ReactNode;
    renderNoData?: () => ReactNode;
    className?: string;
    scrollRootClassName?: string;
    getItems?: (response: PaginatedResponse<T>) => T[];
    getTotal?: (response: PaginatedResponse<T>) => number;
};

export default function InfiniteList<T extends {_id?: string | number}>({
    data,
    loading,
    error,
    onFilterChange,
    limit = 50,
    enabled = true,
    forceReload,
    extraParams,
    getId,
    renderItem,
    renderError,
    renderLoading,
    renderNoData,
    className,
    scrollRootClassName,
    getItems,
    getTotal
}: InfiniteListProps<T>) {
    const scrollRootRef = useRef<HTMLDivElement>(null);
    const allItemsRef = useRef<T[]>([]);
    const extraParamsRef = useRef(extraParams);

    extraParamsRef.current = extraParams;

    const wrappedOnFilterChange = useCallback(
        (filter: InfiniteListFilter) => onFilterChange({...filter, ...(extraParamsRef.current ?? {})}),
        [onFilterChange]
    );

    const normalizedData = useMemo<PaginatedResponse<T> | null | undefined>(() => {
        if (!data) return data;
        if (!getItems && !getTotal) return data as PaginatedResponse<T>;

        const items = getItems ? getItems(data) : (data as PaginatedResponse<T>)?.data;
        const total = getTotal ? getTotal(data) : (data as PaginatedResponse<T>)?.total;

        return {
            ...(data as any),
            data: items ?? [],
            total: total ?? 0
        } as PaginatedResponse<T>;
    }, [data, getItems, getTotal]);

    const {
        accumulatedItems,
        offset,
        hasMoreData,
        canLoadMore,
        loadMore,
        handleReset
    } = useInfiniteScroll({
        data: normalizedData,
        loading,
        onFilterChange: wrappedOnFilterChange,
        limit,
        enabled,
        forceReload,
        getId
    });

    const extraParamsKey = useMemo(
        () => (extraParams != null ? JSON.stringify(extraParams) : ""),
        [extraParams]
    );

    const isFirstMountRef = useRef(true);
    useEffect(() => {
        if (isFirstMountRef.current) {
            isFirstMountRef.current = false;
            return; // Skip on mount – initial fetch handled by useInfiniteScroll
        }
        handleReset();
    }, [extraParamsKey, handleReset]);

    useEffect(() => {
        allItemsRef.current = accumulatedItems;
    }, [accumulatedItems]);

    const typedError = error && typeof error === "object" ? (error as HttpError) : undefined;

    const renderErrorNode = () => {
        if (renderError) return renderError({onRetry: handleReset});
        return (
            <SimpleError
                title="Error"
                description="Something went wrong."
                onClick={handleReset}
                error={typedError}
            />
        );
    };

    const renderLoadingNode = () => {
        if (renderLoading) return renderLoading();
        return <Loader />;
    };

    const renderNoDataNode = () => {
        if (renderNoData) return renderNoData();
        return <NoData title="No data" />;
    };

    return (
        <div ref={scrollRootRef} className={scrollRootClassName}>
            {error ? (
                renderErrorNode()
            ) : loading && accumulatedItems.length === 0 ? (
                renderLoadingNode()
            ) : accumulatedItems.length === 0 ? (
                renderNoDataNode()
            ) : (
                <div>
                    <div className={className}>
                        {accumulatedItems.map((item, index) => (
                            <Fragment key={getId?.(item) ?? item._id ?? index}>
                                {renderItem(item, allItemsRef)}
                            </Fragment>
                        ))}
                        {hasMoreData && (
                            <LoadMoreSentinel
                                canLoadMore={canLoadMore}
                                onLoadMore={loadMore}
                                scrollRoot={scrollRootRef}
                            />
                        )}
                    </div>
                    {loading && offset > 0 && (
                        <div className="flex justify-center py-4">
                            <Loader />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
