import {Fragment, ReactNode, RefObject, useCallback, useEffect, useMemo, useRef, useState} from "react";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import NoData from "@coreModule/components/custom/noData.tsx";
import {PaginatedResponse, useInfiniteScroll} from "@coreModule/helpers/hooks/useInfiniteScroll.ts";
import type {HttpError} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import OffsetIncrementer from "@coreModule/components/custom/infiniteList/offsetIncrementer.tsx";

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
    getId = (item: T) => item._id ?? String(item),
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
    const [internalReload, setInternalReload] = useState(0);
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

    const effectiveForceReload = (forceReload ?? 0) + internalReload;

    const {
        accumulatedItems,
        offset,
        total,
        hasMoreData,
        isReady,
        handleOffsetIncrement,
        handleReset
    } = useInfiniteScroll({
        data: normalizedData,
        loading,
        onFilterChange: wrappedOnFilterChange,
        limit,
        enabled,
        forceReload: effectiveForceReload,
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
        setInternalReload((v) => v + 1);
    }, [extraParamsKey, handleReset]);

    useEffect(() => {
        allItemsRef.current = accumulatedItems;
    }, [accumulatedItems]);

    const typedError = error && typeof error === "object" ? (error as HttpError) : undefined;

    const renderErrorNode = () => {
        const onRetry = () => {
            handleReset();
            setInternalReload((value) => value + 1);
        };
        if (renderError) return renderError({onRetry});
        return (
            <SimpleError
                title="Error"
                description="Something went wrong."
                onClick={onRetry}
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
                        {accumulatedItems.map((item, index) => {
                            const key = getId ? getId(item) : index;
                            return (
                                <Fragment key={key ?? index}>
                                    {renderItem(item, allItemsRef)}
                                </Fragment>
                            );
                        })}
                        {
                            hasMoreData && (
                            <OffsetIncrementer
                                ready={isReady}
                                offset={offset}
                                setOffset={handleOffsetIncrement}
                                total={total}
                                limit={limit}
                                scrollRoot={scrollRootRef as RefObject<HTMLElement>}
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
