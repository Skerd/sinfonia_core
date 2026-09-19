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
import {ChevronsUpDown, User, X} from 'lucide-react';
import {cn} from '@coreModule/components/lib/utils.ts';
import LoadMoreSentinel from '@baseModule/components/custom/loader/loadMoreSentinel.tsx';
import {useApiSelectOptions, type SelectOption} from '@baseModule/helpers/hooks/components/useApiSelectOptions.ts';
import Loader from "@baseModule/components/custom/loader/loader.tsx";
import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import {CheckIcon, PlusCircledIcon} from "@radix-ui/react-icons";
import SelectOptionLabel from "@baseModule/components/custom/selectOptionLabel.tsx";
import {
    REF_SELECT_BY_API_URL,
    type RefSelectCreateFromSearch,
} from "armonia/src/modules/core/database/filter/refSelectRegistry";
import type {FilterGroup, FilterRule} from "armonia/src/modules/core/database/filter";
import {generateUUID} from "@baseModule/helpers/general/uuid.ts";
import {
    API_SELECT_CREATE_ADAPTERS,
    API_SELECT_CREATE_ADAPTER_BY_API_URL,
    API_SELECT_INLINE_CREATE_FALLBACK_LABEL_KEY_BY_API_URL,
} from "@coreModule/components/custom/apiSelect/createFromSearchRegistry.ts";
import {useAccess} from "@baseModule/helpers/hooks/useAccess.ts";
import {Dialog, DialogContent} from "@coreModule/components/ui/dialog.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import {findFromObject} from "@baseModule/helpers/general/objectPath.ts";

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
        onValueChange?: (value: string | string[], label?: string | string[], photo?: string) => void; /** When true, value/onValueChange use string[] and user can select multiple. */
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
         * Ids that should show a checkmark in the dropdown without binding them as this control's `value`
         * (e.g. ObjectIdChipsInput already-selected items while the picker stays empty for add-another).
         */
        markedValues?: string[];
        /**
         * Optional override for inline create-from-search (otherwise derived from `REF_SELECT_BY_API_URL` via `apiUrl`).
         */
        createFromSearch?: RefSelectCreateFromSearch;
    };

const DEFAULT_SEARCH_DEBOUNCE_MS = 300;

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


function SelectOptionAvatar({photo, label}: {photo?: string; label: string}) {
    if (!photo) return null;
    return (
        <Avatar className="size-6 shrink-0 border">
            <AvatarImage src={`/api/auxiliary/media/${photo}`} alt={label} />
            <AvatarFallback>
                <User size={12} />
            </AvatarFallback>
        </Avatar>
    );
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

    const watchedSelf = findFromObject(allValues, formFieldName);
    const depWatched = depFieldKey ? findFromObject(allValues, depFieldKey) : undefined;

    const depValuesKey = postBodyDeps.map((d) => `${d.field}:${String(findFromObject(allValues, d.field) ?? "")}`).join("|");
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
                const raw = findFromObject(allValues, dep.field);
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
            const raw = findFromObject(allValues, fb.whenFieldEmpty);
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
            const v = findFromObject(allValues, f);
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
    markedValues = [],
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
    const markedValuesSet = useMemo(
        () => new Set((markedValues ?? []).filter((v): v is string => typeof v === "string" && v.length > 0)),
        [markedValues]
    );

    const [open, setOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [createPrefillSearch, setCreatePrefillSearch] = useState("");

    const triggerRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const notifiedValueRef = useRef<string | undefined>(undefined);
    const notifiedMultiValuesKeyRef = useRef<string>("");

    const {
        options,
        loading,
        loadingMore,
        page,
        total,
        hasMore,
        pendingValue,
        loadMore,
        prependCreatedOption,
    } = useApiSelectOptions({
        apiUrl,
        disabled,
        pageSize,
        postBody,
        searchDebounceMs,
        forceLoad,
        open,
        searchText,
        value,
        multiple,
        defaultOptions,
    });

    // Latest-value ref so the notify effects below can call the newest handler without
    // re-running every time the parent passes a fresh inline arrow.
    const onValueChangeRef = useRef(onValueChange);
    useEffect(() => {
        onValueChangeRef.current = onValueChange;
    }, [onValueChange]);

    const mergedCreateFromSearch = useMemo(
        () => createFromSearchOverride ?? REF_SELECT_BY_API_URL.get(apiUrl)?.createFromSearch,
        [createFromSearchOverride, apiUrl]
    );

    const {create: canInlineCreate} = useAccess(mergedCreateFromSearch?.accessModel ?? "");

    const createAdapterKey = mergedCreateFromSearch ? API_SELECT_CREATE_ADAPTER_BY_API_URL[apiUrl] : undefined;
    const CreateAdapter = createAdapterKey ? API_SELECT_CREATE_ADAPTERS[createAdapterKey] : undefined;

    const handleOpenChange = useCallback((nextOpen: boolean) => {
        if( disabled ) return;
        if (!nextOpen) setSearchText('');
        setOpen(nextOpen);
    }, [disabled]);

    const allOptions = useMemo(() => {
        // Prefer fetched options; keep defaultOptions only for ids not yet loaded.
        const fetchedIds = new Set(options.map((o) => o.value));
        const orphans = defaultOptions.filter((o) => !fetchedIds.has(o.value));
        return [...options, ...orphans];
    }, [options, defaultOptions]);

    const searchLower = useMemo(
        () => searchText.trim().toLowerCase(),
        [searchText]
    );

    // Default/cached selections shown only while missing from the fetched page(s).
    // Once page 1 (or later pages) include the id, drop the duplicate default row.
    const filteredDefaultOptions = useMemo(() => {
        const fetchedIds = new Set(options.map((o) => o.value));
        return defaultOptions.filter(
            (opt) =>
                !fetchedIds.has(opt.value) &&
                (!searchLower || opt.label.toLowerCase().includes(searchLower)),
        );
    }, [defaultOptions, options, searchLower]);

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
                onValueChange?.(id, label, undefined);
            }
            prependCreatedOption(opt);
            setSearchText("");
        },
        [multiple, selectedValues, selectedOptions, allOptions, onValueChange, prependCreatedOption]
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

    const canClear = multiple ? selectedOptions.length > 0 : Boolean(selectedOption);

    const renderClearTriggerControl = () =>
        canClear ? (
            <span
                role="button"
                tabIndex={-1}
                aria-label={String(resolveLanguageKey('clear'))}
                aria-disabled={disabled || undefined}
                className={cn(
                    'rounded-sm p-0.5 text-muted-foreground',
                    disabled
                        ? 'pointer-events-none cursor-not-allowed'
                        : 'hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                )}
                onPointerDown={disabled ? undefined : (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onClick={disabled ? undefined : handleClear}
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
                onValueChange?.(option.value, option.label, option.photo);
                setOpen(false);
            }
        },
        [multiple, selectedValues, selectedValuesSet, selectedOptions, allOptions, onValueChange]
    );

    const renderOptionItem = useCallback(
        (option: SelectOption) => {
            const isSelected = selectedValuesSet.has(option.value) || markedValuesSet.has(option.value);
            return (
                <CommandItem
                    key={option.value}
                    value={option.value}
                    className="flex min-w-0 gap-x-2"
                    aria-selected={multiple ? isSelected : undefined}
                    onSelect={() => handleOptionSelect(option)}
                >
                    {multiple ? (
                        <div
                            className={cn(
                                'border-primary flex size-4 shrink-0 items-center justify-center rounded-sm border',
                                isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                            )}
                        >
                            <CheckIcon className={cn('text-background h-4 w-4')} />
                        </div>
                    ) : (
                        <CheckIcon className={cn('text-primary h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                    )}
                    {option.photo ? (
                        <SelectOptionAvatar photo={option.photo} label={option.label} />
                    ) : null}
                    <SelectOptionLabel label={option.label} className="min-w-0 flex-1" />
                </CommandItem>
            );
        },
        [multiple, selectedValuesSet, markedValuesSet, handleOptionSelect]
    );

    const renderMultipleTriggerContent = () => {
        if (selectedOptions.length === 0) return placeholder;
        if (selectedOptions.length <= 2) {
            const text = selectedOptions.map((o) => o.label).join(", ");
            return <SelectOptionLabel label={text} className="min-w-0 flex-1 text-left" />;
        }
        const text = `${selectedOptions.slice(0, 2).map((o) => o.label).join(", ")} +${selectedOptions.length - 2} ${resolveLanguageKey("more")}`;
        return <SelectOptionLabel label={text} className="min-w-0 flex-1 text-left" />;
    };

    const renderSingleTriggerContent = () => {
        if (selectedOption) {
            if (selectedOption.photo) {
                return (
                    <span className="flex min-w-0 max-w-full flex-1 items-center gap-2 overflow-hidden">
                        <SelectOptionAvatar photo={selectedOption.photo} label={selectedOption.label} />
                        <SelectOptionLabel label={selectedOption.label} className="min-w-0 flex-1 text-left" />
                    </span>
                );
            }
            return <SelectOptionLabel label={selectedOption.label} className="min-w-0 flex-1 text-left" />;
        }
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
        <div className={cn(!forTable && 'min-w-0 w-full max-w-full')}>
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
                                <div className="hidden gap-x-1 lg:flex">
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
                        <Button
                            ref={triggerRef}
                            variant="outline"
                            role="combobox"
                            type="button"
                            aria-expanded={open}
                            aria-invalid={ariaInvalid}
                            disabled={disabled}
                            className={cn(
                                // Override Button's shrink-0 / min-content so long labels truncate in the form grid.
                                'min-w-0 w-full max-w-full shrink overflow-hidden justify-between',
                                'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive',
                                {
                                    "text-muted-foreground": multiple ? selectedOptions.length === 0 : !selectedOption
                                },
                                className
                            )}
                        >
                            <span className="flex min-w-0 flex-1 overflow-hidden text-left">
                                {multiple ? renderMultipleTriggerContent() : renderSingleTriggerContent()}
                            </span>
                            <span className="ml-2 flex shrink-0 items-center gap-1">
                                {renderClearTriggerControl()}
                                <ChevronsUpDown className="h-4 w-4 opacity-50" />
                            </span>
                        </Button>
                )}
            </PopoverTrigger>
            <PopoverContent
                className={cn(
                    forTable
                        ? 'w-64 p-0'
                        : 'w-[var(--radix-popover-trigger-width)] min-w-64 max-w-[min(90vw,32rem)] p-0',
                )}
                align="start"
            >
                <Command className="flex h-auto min-h-0 w-full min-w-0 flex-col overflow-hidden" shouldFilter={false}>
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
                            <Loader size="20px" className="p-3" />
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
                                            <LoadMoreSentinel
                                                canLoadMore={isReady && page * pageSize < total}
                                                onLoadMore={loadMore}
                                                scrollRoot={listRef}
                                            />
                                        }
                                        {
                                            (loadingMore) &&
                                            <div className="flex p-2 items-center justify-center">
                                                <Loader inline className="size-4 text-muted-foreground" />
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
        {showSelectedChips && multiple && selectedValues.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 min-w-0 max-w-full">
                {selectedValues.map((id) => {
                    const label = selectedOptions.find(o => o.value === id)?.label ?? id;
                    return (
                        <div key={id} className="flex min-w-0 max-w-full items-center gap-2 px-3 py-1.5 bg-secondary rounded-md text-sm">
                            <span className="min-w-0 truncate font-medium" title={label}>{label}</span>
                            <button
                                type="button"
                                onClick={() => handleOptionSelect({ value: id, label })}
                                disabled={disabled}
                                className="text-destructive hover:text-destructive/80 ml-1 shrink-0"
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>
        )}
        </div>
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
        </>
    );
}

export const ApiSelect = withLanguage("src/modules/core/components/custom/apiSelect/index.tsx")(ApiSelectRender);