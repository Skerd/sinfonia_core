import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useFormContext, useWatch, type FieldValues} from 'react-hook-form';
import {Button} from '@coreModule/components/ui/button.tsx';
import {Popover, PopoverContent, PopoverTrigger} from '@coreModule/components/ui/popover.tsx';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator
} from '@coreModule/components/ui/command.tsx';
import {Badge} from '@coreModule/components/ui/badge.tsx';
import {Separator} from '@coreModule/components/ui/separator.tsx';
import {ChevronsUpDown, X} from 'lucide-react';
import {cn} from '@coreModule/components/lib/utils.ts';
import apiClient from '@coreModule/helpers/axiosClients/apiClient.ts';
import PageIncrementer from '@coreModule/components/custom/apiSelect/pageIncrementer.tsx';
import {HashLoader} from 'react-spinners';
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {CheckIcon, PlusCircledIcon} from "@radix-ui/react-icons";
import {
    REF_SELECT_BY_API_URL,
    type RefSelectCreateFromSearch,
} from "armonia/src/modules/core/database/filter/refSelectRegistry";
import type {FilterGroup, FilterRule} from "armonia/src/modules/core/database/filter";
import {generateUUID} from "@coreModule/helpers/general";
import {
    API_SELECT_CREATE_ADAPTERS,
    API_SELECT_CREATE_ADAPTER_BY_API_URL,
    API_SELECT_INLINE_CREATE_FALLBACK_LABEL_KEY_BY_API_URL,
} from "@coreModule/components/custom/apiSelect/createFromSearchRegistry.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {Dialog, DialogContent} from "@coreModule/components/ui/dialog.tsx";

/** Optional: only inside `<Form>` (react-hook-form). Enables project→edifice style cascades from view `widgetProps`. */
type ApiSelectFormDependencyProps = {
    /** RHF path for this control (e.g. binding.name from the view engine). */
    formFieldName?: string;
    /** When this field’s value changes from one non-empty id to another, clear these sibling paths. */
    cascadeClearFormFields?: string[];
    /** Merge `{ [paramName]: values[field] }` into the select POST body (default paramName `projectId`). */
    postBodyFromFormField?: { field: string; paramName?: string };
    /** Merge multiple `{ [paramName]: values[field] }` entries (e.g. unit select needs projectId + edificeId + floorId). */
    postBodyFromFormFields?: { field: string; paramName: string }[];
    /**
     * When `paramName` is still unset after merging `postBodyFromFormFields`, and `whenFieldEmpty` is empty,
     * set `paramName` from `formExtras[formExtraKey]` (e.g. `unitId` from `defaultUnitId` when `unit` is blank).
     */
    postBodyParamFallbackFromExtras?: {
        whenFieldEmpty: string;
        paramName: string;
        formExtraKey: string;
    }[];
    /** Passed from the view engine (e.g. edit ids) for `postBodyParamFallbackFromExtras` and static merges. */
    formExtras?: Record<string, unknown>;
    /** When set, the control stays disabled until every listed form field is non-empty. */
    enableWhenFormFieldsNonEmpty?: string[];
    /** Remount when that field’s value changes (fresh options cache). */
    remountKeyFormField?: string;
};

type ApiSelectProps = WithLanguageType &
    ApiSelectFormDependencyProps & {
        apiUrl: string;
        postBody?: Record<string, unknown>;
        value?: string | string[]; /** Single: string. Multiple: string[]. */
        onValueChange?: (value: string | string[], label?: string | string[]) => void; /** When true, value/onValueChange use string[] and user can select multiple. */
        multiple?: boolean;
        placeholder?: string;
        /**
         * Resolved display name inserted into the inline "Create new …" CTA (e.g. field label from the form).
         * Uses `createNewModel` with a `{}` placeholder. When omitted, falls back to `API_SELECT_INLINE_CREATE_FALLBACK_LABEL_KEY_BY_API_URL` for this `apiUrl`, if any.
         */
        inlineCreateEntityLabel?: string;
        disabled?: boolean;
        className?: string;
        pageSize?: number;
        forceLoad?: number;
        'aria-invalid'?: boolean;
        forTable?: boolean;
        defaultOptions?: SelectOption[];
        searchDebounceMs?: number;
        /** When true with `multiple`, renders removable chip badges below the select for selected items. */
        showSelectedChips?: boolean;
        /**
         * Optional override for inline create-from-search (otherwise derived from `REF_SELECT_BY_API_URL` via `apiUrl`).
         */
        createFromSearch?: RefSelectCreateFromSearch;
    };

const CACHE_MAX_KEYS = 20;
const DEFAULT_SEARCH_DEBOUNCE_MS = 300;

type SelectOption = {
    label: string;
    value: string;
};

const EMPTY_SEARCH_KEY = '__empty__';

type CacheEntry = { options: SelectOption[]; hasMore: boolean; total: number };

/** Align `fetchedPages` with how many list pages are already merged into cached `options` (fixes stuck pagination after cache restore). */
function syncFetchedPagesForCachedOptions(
    fetchedPages: Set<number>,
    optionsLen: number,
    pageSize: number
): void {
    fetchedPages.clear();
    if (optionsLen <= 0 || pageSize <= 0) return;
    const pagesRepresented = Math.max(1, Math.ceil(optionsLen / pageSize));
    for (let p = 1; p <= pagesRepresented; p++) {
        fetchedPages.add(p);
    }
}

function evictCacheIfNeeded(
    cache: Map<string, CacheEntry>,
    newKey: string
): void {
    if (!cache.has(newKey) && cache.size >= CACHE_MAX_KEYS) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) {
            cache.delete(firstKey);
        }
    }
}

type ApiSelectListItem = {
    _id?: string;
    value?: string;
    id?: string;
    name?: string;
    label?: string;
};

type ApiListResponse = {
    data?: ApiSelectListItem[];
    total?: number;
};

function parseListResponse(raw: unknown): { data: ApiSelectListItem[]; total: number } {
    const r = raw as ApiListResponse | null | undefined;
    return {
        data: Array.isArray(r?.data) ? r.data : [],
        total: typeof r?.total === 'number' ? r.total : 0,
    };
}

function toSelectOption(item: ApiSelectListItem): SelectOption {
    return {
        value: item._id ?? item.value ?? item.id ?? '',
        label: item.name ?? item.label ?? '',
    };
}

type ApiSelectInnerProps = Omit<
    ApiSelectProps,
    | 'formFieldName'
    | 'cascadeClearFormFields'
    | 'postBodyFromFormField'
    | 'postBodyFromFormFields'
    | 'postBodyParamFallbackFromExtras'
    | 'formExtras'
    | 'enableWhenFormFieldsNonEmpty'
    | 'remountKeyFormField'
>;

function getNestedValue(obj: FieldValues | undefined, path: string): unknown {
    if (!obj) return undefined;
    return path.split(".").reduce((acc: unknown, key) => (acc != null && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined), obj);
}

function ApiSelectFormDependencyBridge({
    formFieldName,
    cascadeClearFormFields,
    postBodyFromFormField,
    postBodyFromFormFields,
    postBodyParamFallbackFromExtras,
    formExtras,
    enableWhenFormFieldsNonEmpty,
    remountKeyFormField,
    innerProps,
}: {
    formFieldName: string;
    cascadeClearFormFields?: string[];
    postBodyFromFormField?: { field: string; paramName?: string };
    postBodyFromFormFields?: { field: string; paramName: string }[];
    postBodyParamFallbackFromExtras?: { whenFieldEmpty: string; paramName: string; formExtraKey: string }[];
    formExtras?: Record<string, unknown>;
    enableWhenFormFieldsNonEmpty?: string[];
    remountKeyFormField?: string;
    innerProps: ApiSelectInnerProps;
}) {
    const form = useFormContext<FieldValues>();
    const postBodyDeps = useMemo<{ field: string; paramName: string }[]>(
        () =>
            postBodyFromFormFields?.length
                ? postBodyFromFormFields
                : postBodyFromFormField
                  ? [{ field: postBodyFromFormField.field, paramName: postBodyFromFormField.paramName ?? "projectId" }]
                  : [],
        [postBodyFromFormFields, postBodyFromFormField],
    );

    const depFieldKey = postBodyFromFormField?.field ?? remountKeyFormField;
    const watchedFieldNames = useMemo(() => {
        const names = new Set<string>([formFieldName]);
        for (const dep of postBodyDeps) names.add(dep.field);
        if (depFieldKey) names.add(depFieldKey);
        for (const f of enableWhenFormFieldsNonEmpty ?? []) names.add(f);
        for (const fb of postBodyParamFallbackFromExtras ?? []) names.add(fb.whenFieldEmpty);
        return [...names];
    }, [formFieldName, postBodyDeps, depFieldKey, enableWhenFormFieldsNonEmpty, postBodyParamFallbackFromExtras]);

    const watchedSlices = useWatch({
        control: form.control,
        name: watchedFieldNames as readonly string[],
    }) as unknown[] | undefined;

    const allValues = useMemo(() => {
        const values = form.getValues();
        const next: FieldValues = {...values};
        if (Array.isArray(watchedSlices)) {
            watchedFieldNames.forEach((name, index) => {
                const parts = name.split(".");
                let cursor: Record<string, unknown> = next;
                for (let i = 0; i < parts.length - 1; i++) {
                    const part = parts[i];
                    const existing = cursor[part];
                    if (existing == null || typeof existing !== "object") {
                        cursor[part] = {};
                    }
                    cursor = cursor[part] as Record<string, unknown>;
                }
                cursor[parts[parts.length - 1]] = watchedSlices[index];
            });
        }
        return next;
    }, [form, watchedFieldNames, watchedSlices]);

    const watchedSelf = getNestedValue(allValues, formFieldName);
    const depWatched = depFieldKey ? getNestedValue(allValues, depFieldKey) : undefined;

    const depValuesKey = postBodyDeps.map((d) => `${d.field}:${String(getNestedValue(allValues, d.field) ?? "")}`).join("|");
    const extraFallbackKey =
        postBodyParamFallbackFromExtras?.map((f) => `${f.formExtraKey}:${String(formExtras?.[f.formExtraKey] ?? "")}`).join("|") ??
        "";

    const prevSelfRef = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (!cascadeClearFormFields?.length) return;
        const current = watchedSelf != null && watchedSelf !== '' ? String(watchedSelf) : '';
        const prevRaw = prevSelfRef.current;
        const previous = prevRaw != null && prevRaw !== '' ? String(prevRaw) : '';
        if (previous && current && current !== previous) {
            for (const target of cascadeClearFormFields) {
                form.setValue(target as keyof FieldValues, '' as never, { shouldValidate: false });
            }
        }
        prevSelfRef.current = watchedSelf as string | undefined;
    }, [watchedSelf, cascadeClearFormFields, form]);

    const mergedPostBody = useMemo(() => {
        const staticPostBody = (innerProps.postBody as Record<string, unknown>) || {};
        const hasDeps = postBodyDeps.length > 0;
        const hasFallbacks = (postBodyParamFallbackFromExtras?.length ?? 0) > 0;
        if (!hasDeps && !hasFallbacks) return staticPostBody;
        const out: Record<string, unknown> = { ...staticPostBody };
        if (hasDeps) {
            const rules: FilterRule[] = [];
            for (const dep of postBodyDeps) {
                const raw = getNestedValue(allValues, dep.field);
                const v = raw != null && raw !== "" ? String(raw) : "";
                if (v) {
                    rules.push({id: generateUUID(), field: dep.paramName, operator: "equals", value: v});
                }
            }
            if (rules.length > 0) {
                out.filters = {id: generateUUID(), operator: "and", rules, groups: []} satisfies FilterGroup;
            }
        }
        for (const fb of postBodyParamFallbackFromExtras ?? []) {
            const existing = out[fb.paramName];
            if (existing != null && existing !== "") continue;
            const raw = getNestedValue(allValues, fb.whenFieldEmpty);
            if (raw != null && raw !== "") continue;
            const ev = formExtras?.[fb.formExtraKey];
            if (ev != null && ev !== "") {
                out[fb.paramName] = String(ev);
            }
        }
        return out;
    }, [postBodyDeps, depValuesKey, innerProps.postBody, allValues, formExtras, postBodyParamFallbackFromExtras]);

    const selectKey =
        postBodyDeps.length > 0
            ? `${formFieldName}-${depValuesKey}-${extraFallbackKey}`
            : remountKeyFormField
              ? `${formFieldName}-${depWatched != null && depWatched !== "" ? String(depWatched) : "none"}`
              : formFieldName;

    const requiredFields = enableWhenFormFieldsNonEmpty ?? [];
    const disabledByDependencyRequired =
        requiredFields.length > 0 &&
        requiredFields.some((f) => {
            const v = getNestedValue(allValues, f);
            return v == null || v === "";
        });

    const disabledByDependencyLegacy =
        !!postBodyFromFormField && !postBodyFromFormFields?.length && !(depWatched != null && depWatched !== "");

    const disabledByDependency = disabledByDependencyRequired || disabledByDependencyLegacy;
    const disabled = !!(innerProps.disabled || disabledByDependency);

    const useMergedPostBody =
        postBodyDeps.length > 0 || (postBodyParamFallbackFromExtras?.length ?? 0) > 0;
    const postBody = useMergedPostBody ? mergedPostBody : innerProps.postBody;

    return (
        <ApiSelectCore
            key={selectKey}
            {...innerProps}
            postBody={postBody}
            formExtras={formExtras}
            disabled={disabled}
        />
    );
}

function ApiSelectRender(props: ApiSelectProps) {
    const {
        formFieldName,
        cascadeClearFormFields,
        postBodyFromFormField,
        postBodyFromFormFields,
        postBodyParamFallbackFromExtras,
        formExtras,
        enableWhenFormFieldsNonEmpty,
        remountKeyFormField,
        ...innerProps
    } = props;

    const needsFormDependencyBridge =
        typeof formFieldName === 'string' &&
        formFieldName !== '' &&
        ((Array.isArray(cascadeClearFormFields) && cascadeClearFormFields.length > 0) ||
            !!postBodyFromFormField ||
            (Array.isArray(postBodyFromFormFields) && postBodyFromFormFields.length > 0) ||
            (Array.isArray(postBodyParamFallbackFromExtras) && postBodyParamFallbackFromExtras.length > 0) ||
            (Array.isArray(enableWhenFormFieldsNonEmpty) && enableWhenFormFieldsNonEmpty.length > 0) ||
            !!remountKeyFormField);

    if (needsFormDependencyBridge) {
        return (
            <ApiSelectFormDependencyBridge
                formFieldName={formFieldName}
                cascadeClearFormFields={cascadeClearFormFields}
                postBodyFromFormField={postBodyFromFormField}
                postBodyFromFormFields={postBodyFromFormFields}
                postBodyParamFallbackFromExtras={postBodyParamFallbackFromExtras}
                formExtras={formExtras}
                enableWhenFormFieldsNonEmpty={enableWhenFormFieldsNonEmpty}
                remountKeyFormField={remountKeyFormField}
                innerProps={innerProps as ApiSelectInnerProps}
            />
        );
    }

    return <ApiSelectCore {...innerProps} formExtras={formExtras} />;
}

function ApiSelectCore({
    apiUrl,
    postBody = {},
    value,
    onValueChange,
    multiple = false,
    placeholder = 'Select...',
    disabled = false,
    className,
    pageSize = 50,
    forceLoad,
    'aria-invalid': ariaInvalid,
    resolveLanguageKey,
    forTable = false,
    defaultOptions = [],
    searchDebounceMs = DEFAULT_SEARCH_DEBOUNCE_MS,
    showSelectedChips = false,
    createFromSearch: createFromSearchOverride,
    formExtras,
    inlineCreateEntityLabel,
}: ApiSelectProps) {

    // Normalize value to array for consistent "is selected?" checks
    const selectedValues: string[] = useMemo(
        () =>
            multiple
                ? (Array.isArray(value) ? value : value != null ? [value] : [])
                : (value != null && !Array.isArray(value) ? [value] : []),
        [multiple, value]
    );

    const [open, setOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [options, setOptions] = useState<SelectOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [pendingValue, setPendingValue] = useState<string | undefined>(undefined);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [createPrefillSearch, setCreatePrefillSearch] = useState("");

    const triggerRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [popoverWidth, setPopoverWidth] = useState<number>();
    const notifiedValueRef = useRef<string | undefined>(undefined);
    const notifiedMultiValuesKeyRef = useRef<string>("");

    // Simple cache: store options by search key and whether there's more data
    const cacheRef = useRef<Map<string, { options: SelectOption[]; hasMore: boolean; total: number }>>(new Map());
    const fetchedPagesRef = useRef<Set<number>>(new Set());
    const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const isFetchingRef = useRef(false);
    const fetchPageRef = useRef<((pageNum: number, search: string) => Promise<void>) | null>(null);
    const optionsRef = useRef<SelectOption[]>([]);
    const lastForceLoadRef = useRef<number | undefined>(undefined);
    const abortControllerRef = useRef<AbortController | null>(null);
    const postBodyRef = useRef(postBody);
    const openRef = useRef(open);
    const searchTextRef = useRef(searchText);
    const onValueChangeRef = useRef(onValueChange);

    useEffect(() => {
        onValueChangeRef.current = onValueChange;
    }, [onValueChange]);

    useEffect(() => {
        postBodyRef.current = postBody;
    }, [postBody]);

    useEffect(() => {
        openRef.current = open;
    }, [open]);

    useEffect(() => {
        searchTextRef.current = searchText;
    }, [searchText]);

    const mergedCreateFromSearch = useMemo(
        () => createFromSearchOverride ?? REF_SELECT_BY_API_URL.get(apiUrl)?.createFromSearch,
        [createFromSearchOverride, apiUrl]
    );

    const {create: canInlineCreate} = useAccess(mergedCreateFromSearch?.accessModel ?? "");

    const createAdapterKey = mergedCreateFromSearch ? API_SELECT_CREATE_ADAPTER_BY_API_URL[apiUrl] : undefined;
    const CreateAdapter = createAdapterKey ? API_SELECT_CREATE_ADAPTERS[createAdapterKey] : undefined;

    // Fetch options from API
    const fetchPage = useCallback(async (pageNum: number, search: string) => {
        if (!apiUrl || disabled || fetchedPagesRef.current.has(pageNum) || isFetchingRef.current) return;

        // Cancel any in-flight request before starting a new one
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        isFetchingRef.current = true;

        if (pageNum === 1) {
            setLoading(true);
        }
        else {
            setLoadingMore(true);
        }

        const body = { ...postBodyRef.current, name: search, page: pageNum, limit: pageSize };
        try {
            const response = await apiClient.post(
                apiUrl,
                body,
                { signal: controller.signal }
            );

            if (controller.signal.aborted) {
                return;
            }

            const listSearchKey = search || EMPTY_SEARCH_KEY;
            if (
                openRef.current &&
                listSearchKey !== (searchTextRef.current || EMPTY_SEARCH_KEY)
            ) {
                return;
            }

            // Reserve this page only after we know this response matches the current list search (when open).
            fetchedPagesRef.current.add(pageNum);

            const { data: responseData, total: responseTotal } = parseListResponse(response.data);
            const newOptions: SelectOption[] = responseData.map(toSelectOption);

            if (pageNum === 1) {
                setOptions(newOptions);
                optionsRef.current = newOptions;
                const effectiveTotal = responseTotal > 0 ? responseTotal : newOptions.length;
                setTotal(effectiveTotal);
                const hasMoreData =
                    responseTotal > 0
                        ? newOptions.length < responseTotal
                        : newOptions.length === pageSize;
                setHasMore(hasMoreData);
                // Cache first page
                const cacheKey = search || EMPTY_SEARCH_KEY;
                evictCacheIfNeeded(cacheRef.current, cacheKey);
                cacheRef.current.set(cacheKey, {
                    options: newOptions,
                    hasMore: hasMoreData,
                    total: responseTotal > 0 ? responseTotal : newOptions.length,
                });
            }
            else {
                // Calculate updated options first
                const existing = new Set(optionsRef.current.map(o => o.value));
                const unique = newOptions.filter(o => !existing.has(o.value));
                const updated = [...optionsRef.current, ...unique];

                const serverTotal = responseTotal > 0 ? responseTotal : 0;
                let hasMoreData: boolean;
                let finalTotal: number;
                if (serverTotal > 0) {
                    hasMoreData = updated.length < serverTotal;
                    finalTotal = serverTotal;
                } else if (newOptions.length < pageSize) {
                    hasMoreData = false;
                    finalTotal = updated.length;
                } else {
                    hasMoreData = true;
                    finalTotal = updated.length;
                }

                // Update all state at once
                setOptions(updated);
                optionsRef.current = updated;
                setHasMore(hasMoreData);
                setTotal(finalTotal);

                // Update cache with all accumulated options
                const cacheKey = search || EMPTY_SEARCH_KEY;
                evictCacheIfNeeded(cacheRef.current, cacheKey);
                cacheRef.current.set(cacheKey, { options: updated, hasMore: hasMoreData, total: finalTotal });
            }

        } catch (err: unknown) {
            if (controller.signal.aborted) {
                return;
            }
            console.error('Failed to load options:', err);
            fetchedPagesRef.current.delete(pageNum);
            if (pageNum === 1) {
                setOptions([]);
                setTotal(0);
                setHasMore(false);
            }
        } finally {
            if (controller.signal.aborted) {
                fetchedPagesRef.current.delete(pageNum);
            }
            setLoading(false);
            setLoadingMore(false);
            isFetchingRef.current = false;
            if (abortControllerRef.current === controller) {
                abortControllerRef.current = null;
            }
        }
    }, [apiUrl, disabled, pageSize]);

    useEffect(() => {
        fetchPageRef.current = fetchPage;
    }, [fetchPage]);

    // Handle forceLoad prop - refetch data when it changes
    useEffect(() => {
        if (forceLoad !== undefined && forceLoad !== lastForceLoadRef.current) {
            lastForceLoadRef.current = forceLoad;
            cacheRef.current.clear();
            fetchedPagesRef.current.clear();
            setPage(1);
            setOptions([]);
            optionsRef.current = [];
            setHasMore(true);
            setTotal(0);
            setSearchText('');
            if (open && !disabled) {
                fetchPageRef.current?.(1, '');
            }
        }
    }, [forceLoad, open, disabled]);

    // Load initial data when value is provided but not found in options
    useEffect(() => {
        const valuesToHydrate: string[] = multiple && Array.isArray(value)
            ? value.filter((v): v is string => v != null && v !== '')
            : (value != null && !Array.isArray(value) && value !== '' ? [value] : []);

        if (disabled || valuesToHydrate.length === 0) {
            setPendingValue(undefined);
            return;
        }

        const opts = optionsRef.current;
        const isInDefault = (v: string) => defaultOptions.some((opt) => opt.value === v);
        const hasAll = valuesToHydrate.every((v) => opts.some((opt) => opt.value === v) || isInDefault(v));
        if (hasAll) {
            setPendingValue(undefined);
            return;
        }

        const cached = cacheRef.current.get(EMPTY_SEARCH_KEY);
        if (cached) {
            const hasAllInCache = valuesToHydrate.every((v) => cached.options.some((opt) => opt.value === v) || isInDefault(v));
            if (hasAllInCache) {
                setOptions(cached.options);
                optionsRef.current = cached.options;
                setHasMore(cached.hasMore);
                setTotal(cached.total);
                setPendingValue(undefined);
                syncFetchedPagesForCachedOptions(fetchedPagesRef.current, cached.options.length, pageSize);
                return;
            }
            // Restore cache so we have as many options as possible
            setOptions(cached.options);
            optionsRef.current = cached.options;
            setHasMore(cached.hasMore);
            setTotal(cached.total);
            syncFetchedPagesForCachedOptions(fetchedPagesRef.current, cached.options.length, pageSize);
        }

        const firstMissing = valuesToHydrate.find((v) => !optionsRef.current.some((opt) => opt.value === v) && !isInDefault(v));
        setPendingValue(multiple ? undefined : firstMissing);
        if (!fetchedPagesRef.current.has(1) && !isFetchingRef.current) {
            fetchPageRef.current?.(1, '');
        }
    }, [value, disabled, multiple, defaultOptions, pageSize]);

    // Load initial data or from cache when popover opens
    useEffect(() => {
        if (!open || disabled) return;

        const searchKey = searchText || EMPTY_SEARCH_KEY;

        // Check cache - restore all cached options
        const cached = cacheRef.current.get(searchKey);
        if (cached && cached.options.length > 0) {
            setOptions(cached.options);
            optionsRef.current = cached.options;
            setHasMore(cached.hasMore);
            setTotal(cached.total);
            setPage(1);
            syncFetchedPagesForCachedOptions(fetchedPagesRef.current, cached.options.length, pageSize);
            return;
        }

        // Reset and fetch
        setPage(1);
        setOptions([]);
        optionsRef.current = [];
        setHasMore(true);
        fetchedPagesRef.current.clear();

        // Debounce search
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            fetchPageRef.current?.(1, searchText);
        }, searchText ? searchDebounceMs : 0);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [open, searchText, disabled, searchDebounceMs, pageSize]);

    // Load more when page changes
    useEffect(() => {
        if (!open || page === 1 || disabled || !hasMore) return;
        if (fetchedPagesRef.current.has(page)) return;
        fetchPageRef.current?.(page, searchText || '');
    }, [page, open, disabled, hasMore, searchText]);

    const handleOpenChange = useCallback((nextOpen: boolean) => {
        if( disabled ) return;
        if (!nextOpen) setSearchText('');
        else if (triggerRef.current) setPopoverWidth(triggerRef.current.offsetWidth);
        setOpen(nextOpen);
    }, [disabled]);

    const allOptions = useMemo(
        () => [...options, ...defaultOptions],
        [options, defaultOptions]
    );

    const searchLower = useMemo(
        () => searchText.trim().toLowerCase(),
        [searchText]
    );

    const filteredDefaultOptions = useMemo(
        () =>
            defaultOptions.filter((opt) =>
                !searchLower || opt.label.toLowerCase().includes(searchLower)
            ),
        [defaultOptions, searchLower]
    );

    const selectedValuesSet = useMemo(
        () => new Set(selectedValues),
        [selectedValues]
    );

    const selectedOptions = useMemo(
        () => allOptions.filter((opt) => selectedValuesSet.has(opt.value)),
        [allOptions, selectedValuesSet]
    );

    const selectedOption = !multiple ? selectedOptions[0] : undefined;
    const isReady = !loading && !loadingMore && hasMore;

    const openInlineCreateDialog = useCallback(() => {
        setCreatePrefillSearch(searchText.trim());
        setOpen(false);
        queueMicrotask(() => setCreateDialogOpen(true));
    }, [searchText]);

    const handleInlineCreated = useCallback(
        (id: string, label: string) => {
            setCreateDialogOpen(false);
            const opt: SelectOption = {value: id, label};
            if (multiple) {
                const nextValues = [...selectedValues, id];
                const resolveLabel = (v: string) =>
                    selectedOptions.find((o) => o.value === v)?.label ??
                    allOptions.find((o) => o.value === v)?.label ??
                    v;
                const nextLabels = [...selectedValues.map(resolveLabel), label];
                onValueChange?.(nextValues, nextLabels);
            } else {
                onValueChange?.(id, label);
            }
            setOptions((prev) => {
                const merged = [opt, ...prev.filter((o) => o.value !== id)];
                optionsRef.current = merged;
                return merged;
            });
            const cacheKey = searchTextRef.current || EMPTY_SEARCH_KEY;
            const cached = cacheRef.current.get(cacheKey);
            if (cached) {
                cacheRef.current.set(cacheKey, {
                    ...cached,
                    options: [opt, ...cached.options.filter((o) => o.value !== id)],
                });
            }
            setSearchText("");
        },
        [multiple, selectedValues, selectedOptions, allOptions, onValueChange]
    );

    const showInlineCreateCta =
        !!mergedCreateFromSearch &&
        !!CreateAdapter &&
        canInlineCreate &&
        !loading &&
        !disabled &&
        searchText.trim().length > 0;

    const inlineCreateFallbackKey = API_SELECT_INLINE_CREATE_FALLBACK_LABEL_KEY_BY_API_URL[apiUrl];
    const inlineCreateCtaText =
        mergedCreateFromSearch &&
        (inlineCreateEntityLabel?.trim()
            ? String(resolveLanguageKey("createNewModel")).replaceAll("{}", inlineCreateEntityLabel.trim())
            : inlineCreateFallbackKey
              ? String(resolveLanguageKey(inlineCreateFallbackKey))
              : String(resolveLanguageKey("createNewModel")).replaceAll("{}", ""));

    const clearValue = useCallback(() => {
        if (disabled) return;
        if (multiple) {
            onValueChange?.([], []);
        } else {
            onValueChange?.('');
        }
        setPendingValue(undefined);
        setSearchText('');
        setOpen(false);
    }, [disabled, multiple, onValueChange]);

    const handleClear = useCallback(
        (e: React.MouseEvent | React.PointerEvent) => {
            e.preventDefault();
            e.stopPropagation();
            clearValue();
        },
        [clearValue]
    );

    const canClear = !disabled && selectedValues.length > 0;

    const renderClearTriggerControl = () =>
        canClear ? (
            <span
                role="button"
                tabIndex={-1}
                aria-label={String(resolveLanguageKey('clear'))}
                className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onClick={handleClear}
            >
                <X className="h-3.5 w-3.5" />
            </span>
        ) : null;

    const handleOptionSelect = useCallback(
        (option: SelectOption) => {
            if (multiple) {
                const isSelected = selectedValuesSet.has(option.value);
                const nextValues = isSelected
                    ? selectedValues.filter((v) => v !== option.value)
                    : [...selectedValues, option.value];
                const resolveOption = (v: string) =>
                    selectedOptions.find((o) => o.value === v) ?? allOptions.find((o) => o.value === v);
                const nextOptions = nextValues.map(resolveOption).filter(Boolean) as SelectOption[];
                const nextLabels = nextOptions.map((o) => o.label);
                onValueChange?.(nextValues, nextLabels);
            } else {
                onValueChange?.(option.value, option.label);
                setOpen(false);
            }
        },
        [multiple, selectedValues, selectedValuesSet, selectedOptions, allOptions, onValueChange]
    );

    const renderOptionItem = useCallback(
        (option: SelectOption) => {
            const isSelected = selectedValuesSet.has(option.value);
            return (
                <CommandItem
                    key={option.value}
                    value={option.value}
                    className="space-x-0"
                    aria-selected={multiple ? isSelected : undefined}
                    onSelect={() => handleOptionSelect(option)}
                >
                    {multiple ? (
                        <div
                            className={cn(
                                'border-primary flex size-4 items-center justify-center rounded-sm border',
                                isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                            )}
                        >
                            <CheckIcon className={cn('text-background h-4 w-4')} />
                        </div>
                    ) : (
                        <CheckIcon className={cn('text-primary h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                    )}
                    <p>{option.label}</p>
                </CommandItem>
            );
        },
        [multiple, selectedValuesSet, handleOptionSelect]
    );

    const renderMultipleTriggerContent = () => {
        if (selectedOptions.length === 0) return placeholder;
        if (selectedOptions.length <= 2) {
            return selectedOptions.map((o) => o.label).join(', ');
        }
        return `${selectedOptions.slice(0, 2).map((o) => o.label).join(', ')} +${selectedOptions.length - 2} ${resolveLanguageKey("more")}`;
    };

    const renderSingleTriggerContent = () => {
        if (selectedOption) return selectedOption.label;
        if (pendingValue) {
            return (
                <span className="flex items-center text-muted-foreground italic">
                    {pendingValue}
                    {loading && <span className="ml-2 text-xs animate-pulse">...</span>}
                </span>
            );
        }
        return placeholder;
    };

    // Clear pending value when option is found
    useEffect(() => {
        if (pendingValue && selectedOption) {
            setPendingValue(undefined);
        }
    }, [pendingValue, selectedOption?.value, selectedOption?.label]);

    // Notify parent when value changes (single mode only; multiple is driven by item toggles)
    useEffect(() => {
        if (multiple) return;
        const scalarValue = value as string | undefined;
        if (scalarValue && selectedOption?.label && notifiedValueRef.current !== scalarValue && !loading) {
            notifiedValueRef.current = scalarValue;
            onValueChangeRef.current?.(scalarValue, selectedOption.label);
        } else if (!scalarValue) {
            notifiedValueRef.current = undefined;
        }
    }, [multiple, value, selectedOption?.label, loading]);

    // Multiple: after options hydrate, notify labels (e.g. filter chips / forms with ids only)
    useEffect(() => {
        if (!multiple || loading || loadingMore) return;
        if (selectedValues.length === 0) {
            notifiedMultiValuesKeyRef.current = "";
            return;
        }
        if (selectedOptions.length !== selectedValues.length) return;
        const labels = selectedValues.map((vid) => selectedOptions.find((o) => o.value === vid)?.label ?? "");
        if (labels.some((l) => !l)) return;
        const key = [...selectedValues].sort().join("\u0000");
        if (notifiedMultiValuesKeyRef.current === key) return;
        notifiedMultiValuesKeyRef.current = key;
        onValueChangeRef.current?.(selectedValues, labels);
    }, [multiple, loading, loadingMore, selectedValues, selectedOptions]);

    return (
        <>
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild disabled={disabled}>
                {forTable ? (
                    <Button
                        ref={triggerRef}
                        variant="outline"
                        size="sm"
                        type="button"
                        className={cn('h-8 border-dashed', className)}
                        role="combobox"
                        aria-expanded={open}
                        aria-invalid={ariaInvalid}
                        disabled={disabled}
                    >
                        <PlusCircledIcon className="size-4" />
                        {placeholder}
                        {selectedValues.length > 0 && (
                            <>
                                <Separator orientation="vertical" className="mx-2 h-4" />
                                <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                                    {selectedValues.length}
                                </Badge>
                                <div className="hidden space-x-1 lg:flex">
                                    {selectedValues.length > 2 ? (
                                        <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                            {selectedValues.length} selected
                                        </Badge>
                                    ) : (
                                        selectedOptions.map((opt) => (
                                            <Badge variant="secondary" key={opt.value} className="rounded-sm px-1 font-normal">
                                                {opt.label}
                                            </Badge>
                                        ))
                                    )}
                                </div>
                                {renderClearTriggerControl()}
                            </>
                        )}
                    </Button>
                ) : (
                    <div className="w-full">
                        <Button
                            ref={triggerRef}
                            variant="outline"
                            role="combobox"
                            type="button"
                            aria-expanded={open}
                            aria-invalid={ariaInvalid}
                            disabled={disabled}
                            className={cn(
                                'w-full justify-between',
                                'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive',
                                {
                                    "text-muted-foreground": multiple ? selectedOptions.length === 0 : !selectedOption
                                },
                                className
                            )}
                        >
                            <span className="truncate">
                                {multiple ? renderMultipleTriggerContent() : renderSingleTriggerContent()}
                            </span>
                            <span className="ml-2 flex shrink-0 items-center gap-1">
                                {renderClearTriggerControl()}
                                <ChevronsUpDown className="h-4 w-4 opacity-50" />
                            </span>
                        </Button>
                    </div>
                )}
            </PopoverTrigger>
            <PopoverContent
                className={cn(forTable ? 'w-[200px] p-0' : 'w-full p-0')}
                style={forTable ? undefined : { width: popoverWidth }}
                align="start"
            >
                <Command className="w-full" shouldFilter={false}>
                    <div className="relative">
                        <CommandInput
                            placeholder={`${resolveLanguageKey("search")}...`}
                            value={searchText}
                            onValueChange={setSearchText}
                        />
                        {
                            selectedOptions.length > 0 && !forTable &&
                            <div className="absolute top-0 right-2">
                                <Button
                                    variant="ghost"
                                    type="button"
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                    onClick={clearValue}
                                >
                                    {resolveLanguageKey("clear")}
                                </Button>
                            </div>
                        }
                    </div>

                    <CommandList ref={listRef} aria-multiselectable={multiple}>
                        {
                            loading && options.length === 0 ?
                            <div className="flex p-3 items-center justify-center w-full border rounded-lg">
                                <HashLoader color="gray" size="20px" loading />
                            </div>
                            :
                            <>
                                {
                                    options.length === 0 && filteredDefaultOptions.length === 0 ?
                                    <div className="flex flex-col gap-2 p-3 items-center justify-center w-full rounded-lg">
                                        <CommandEmpty className="py-0">{resolveLanguageKey("noResults")}</CommandEmpty>
                                        {showInlineCreateCta && mergedCreateFromSearch && (
                                            <Button
                                                type="button"
                                                variant="link"
                                                className="h-auto p-0 text-sm font-medium"
                                                onClick={openInlineCreateDialog}
                                            >
                                                {inlineCreateCtaText}
                                            </Button>
                                        )}
                                    </div>
                                    :
                                    <>
                                        <CommandGroup>
                                            {options.map(renderOptionItem)}
                                        </CommandGroup>
                                        {
                                            hasMore &&
                                            <PageIncrementer
                                                ready={isReady}
                                                page={page}
                                                setPage={setPage}
                                                total={total}
                                                limit={pageSize}
                                                scrollRoot={listRef}
                                            />
                                        }
                                        {
                                            (loadingMore) &&
                                            <div className="flex p-2 items-center justify-center">
                                                <HashLoader color="gray" size="16px" loading={loadingMore} />
                                            </div>
                                        }
                                        {filteredDefaultOptions.length > 0 && (
                                            <CommandGroup>
                                                {filteredDefaultOptions.map(renderOptionItem)}
                                            </CommandGroup>
                                        )}
                                        {forTable && selectedValues.length > 0 && (
                                            <>
                                                <CommandSeparator />
                                                <CommandGroup>
                                                    <CommandItem
                                                        onSelect={clearValue}
                                                        className="justify-center text-center"
                                                    >
                                                        {resolveLanguageKey("clear")}
                                                    </CommandItem>
                                                </CommandGroup>
                                            </>
                                        )}
                                    </>
                                }
                            </>
                        }
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
        {CreateAdapter ? (
            <Dialog
                open={createDialogOpen}
                onOpenChange={(next) => {
                    if (!next) setCreateDialogOpen(false);
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <CreateAdapter
                        onCreated={handleInlineCreated}
                        onCancel={() => setCreateDialogOpen(false)}
                        defaultNameQuery={createPrefillSearch}
                        postBody={postBody}
                        formExtras={formExtras}
                    />
                </DialogContent>
            </Dialog>
        ) : null}
        {showSelectedChips && multiple && selectedValues.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
                {selectedValues.map((id) => {
                    const label = selectedOptions.find(o => o.value === id)?.label ?? id;
                    return (
                        <div key={id} className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md text-sm">
                            <span className="font-medium">{label}</span>
                            <button
                                type="button"
                                onClick={() => handleOptionSelect({ value: id, label })}
                                disabled={disabled}
                                className="text-destructive hover:text-destructive/80 ml-1"
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>
        )}
        </>
    );
}

export const ApiSelect = compose(
    withLanguage("src/modules/core/components/custom/apiSelect/index.tsx")
)(ApiSelectRender);