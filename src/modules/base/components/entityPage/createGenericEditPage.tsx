import {compose} from "redux";
import {useEffect, useMemo, useState, type ReactNode} from "react";
import withAxios, {WithAxiosType} from "@baseModule/helpers/hocs/withAxios.tsx";
import withLanguage, {type ResolveLanguageKey, WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import {useNavigate, useSearchParams} from "react-router-dom";
import {toast} from "sonner";
import {useAccess} from "@baseModule/helpers/hooks/useAccess.ts";
import Loader from "@baseModule/components/custom/loader/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import apiClient from "@baseModule/helpers/apiClient/apiClient.ts";
import type {HttpRequestHeaderBuilder} from "@baseModule/helpers/hooks/useHttpRequest.ts";
import EditFormViewRenderer from "@baseModule/components/viewEngine/editFormViewRenderer.tsx";
import {useViewConfigState} from "@baseModule/helpers/hooks/useViewConfig.ts";
import type {FieldValues, UseFormReturn} from "react-hook-form";
import Forbidden from "@coreModule/components/custom/pages/forbidden.tsx";
import {resolveEntityPageKeys} from "@baseModule/helpers/general/entityPage.ts";

type GenericEditPageConfig<TDto, TForm extends FieldValues> = {
    languagePath: string;
    model?: string;
    apiUrl: string;
    schema: (languageCode: string, form: unknown, writeFields: Record<string, unknown>, readFields: Record<string, unknown>) => any;
    mapEntityData?: (dto: TDto) => Record<string, unknown>;
    submitIcon?: ReactNode;
    buildExtraTitles?: (params: URLSearchParams, entityName?: string | null) => string[];

    // to be checked
    /** Bypass `POST {apiUrl}/single` when loading the entity document. */
    fetchEntity?: (entityId: string) => Promise<TDto>;
    buildFormExtras?: (entityId: string, params: URLSearchParams, entity?: TDto | null) => Record<string, unknown>;
    mapSubmitPayload?: (
        data: TForm,
        helpers: {writeFields: Record<string, unknown>; params: URLSearchParams},
    ) => TForm | FormData | Promise<TForm | FormData>;
    /** Return a language key (resolved via `resolveLanguageKey`) to block submit. */
    beforeSubmit?: (
        data: TForm,
        helpers: {
            writeFields: Record<string, unknown>;
            params: URLSearchParams;
            resolveLanguageKey: ResolveLanguageKey;
        },
    ) => string | null;
    /** Runs after PATCH succeeds, before navigating back (`EditFormViewRenderer` success pipeline). */
    afterSuccess?: () => void;
    /**
     * Dynamic headers merged into the PATCH (`addToHeader` on `HttpRequest`).
     * Values are read from serialized component props (e.g. `{ whatToGet: "entityId", whereToPut: "x-company-id" }`).
     */
    patchAddToHeader?: HttpRequestHeaderBuilder[];
    /** Render prop for interactive children that need form + entity access (switches, cascading selects, etc.). */
    renderChildren?: (
        form: UseFormReturn<TForm>,
        entity: TDto | null,
        helpers: {
            writeFields: Record<string, unknown>;
            resolveLanguageKey: ResolveLanguageKey;
            loading: boolean;
        },
    ) => ReactNode;


    // deprecated
    collectionName?: string;
    accessModel?: string;
    buildInitialValues?: (dto: TDto, writeFields: Record<string, unknown>) => Partial<TForm>;
};

export type GenericEditPageProps = {
    entityId?: string | null;
    entityName?: string | null;
};

// Recursively maps entity data to form initial values using writeFields permissions.
// writeFields uses `.keys` for nested objects: writeFields.address.keys.street
// _id is always included regardless of permissions.
function buildInitialValuesAuto(data: Record<string, unknown>, writeFields: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if ("_id" in data) result._id = data._id;

    for (const [key, fieldAccess] of Object.entries(writeFields)) {
        if (!fieldAccess) continue;

        const value = data[key];

        if (typeof fieldAccess === "object" && "keys" in fieldAccess) {
            const subKeys = (fieldAccess as {keys: Record<string, unknown>}).keys;
            if (Array.isArray(value)) {
                result[key] = value.map(item =>
                    typeof item === "object" && item !== null
                        ? buildInitialValuesAuto(item as Record<string, unknown>, subKeys)
                        : item,
                );
            } else if (typeof value === "object" && value !== null) {
                result[key] = buildInitialValuesAuto(value as Record<string, unknown>, subKeys);
            } else {
                result[key] = value;
            }
        } else {
            result[key] = value;
        }
    }

    return result;
}

export function createGenericEditPage<TDto, TForm extends FieldValues>(config: GenericEditPageConfig<TDto, TForm>) {
    type EditProps = WithLanguageType & WithAxiosType<TDto, TForm> & GenericEditPageProps;

    // Config is static per page, so resolve the keys once instead of on every render.
    const {accessKey, viewCollectionKey} = resolveEntityPageKeys(config);

    const loadEntity = (entityId: string): Promise<TDto> =>
        config.fetchEntity
            ? config.fetchEntity(entityId)
            : apiClient.post<TDto>(`${config.apiUrl}/single`, {_id: entityId}).then((res) => res.data);

    function GenericEditInner({
        resolveLanguageKey,
        languageCode,
        loading,
        innerRef,
        onPost,
        entityId,
        entityName,
    }: EditProps) {
        const navigate = useNavigate();
        const {write, read} = useAccess(accessKey);
        const [params] = useSearchParams();
        const writeFields = useMemo(() => (write || {}) as Record<string, unknown>, [write]);
        const readFields = useMemo(() => (read || {}) as Record<string, unknown>, [read]);

        const [reloadCount, setReloadCount] = useState(0);
        const [entityData, setEntityData] = useState<TDto | null>(null);
        const [loadingEntity, setLoadingEntity] = useState(true);
        const [entityError, setEntityError] = useState(false);

        const {config: viewConfig, loading: viewConfigLoading} = useViewConfigState(viewCollectionKey, "form:edit");
        const formSchema = useMemo(
            () => config.schema(languageCode, resolveLanguageKey("form"), writeFields, readFields),
            [languageCode, resolveLanguageKey, writeFields, readFields],
        );

        useEffect(() => {
            if (!entityId) {
                setLoadingEntity(false);
                return;
            }
            // Ignore responses that arrive after the id changed or the page unmounted.
            let stale = false;
            setLoadingEntity(true);
            setEntityError(false);
            loadEntity(entityId)
                .then((data) => { if (!stale) setEntityData(data); })
                .catch(() => { if (!stale) setEntityError(true); })
                .finally(() => { if (!stale) setLoadingEntity(false); });
            return () => { stale = true; };
        }, [entityId, reloadCount]);

        // Stable references: `EditFormViewRenderer` resets the form from these, and the
        // mapping walks the whole document, so only redo it when the inputs change.
        const initialValues = useMemo(() => {
            if (!entityData) return null;
            if (config.buildInitialValues) return config.buildInitialValues(entityData, writeFields);
            const rawData = config.mapEntityData
                ? config.mapEntityData(entityData)
                : (entityData as Record<string, unknown>);
            return buildInitialValuesAuto(rawData, writeFields) as Partial<TForm>;
        }, [entityData, writeFields]);
        const formExtras = useMemo(
            () => (entityId ? config.buildFormExtras?.(entityId, params, entityData) : undefined),
            [entityId, params, entityData],
        );
        const extraTitles = useMemo(
            () => config.buildExtraTitles?.(params, entityName) ?? [entityName || ""],
            [params, entityName],
        );

        if (!write || !entityId) return <Forbidden />;
        if (!viewConfig) return viewConfigLoading ? <Loader /> : <Forbidden />;
        if (loadingEntity) return <Loader />;
        if (entityError || !entityData || !initialValues) {
            return (
                <SimpleError
                    title={resolveLanguageKey("errorTitle")}
                    description={resolveLanguageKey("errorDescription")}
                    onClick={() => setReloadCount((n) => n + 1)}
                />
            );
        }

        const handleSubmit = async (data: TForm) => {
            const blockKey = config.beforeSubmit?.(data, {writeFields, params, resolveLanguageKey});
            if (blockKey) {
                toast.error(String(resolveLanguageKey(blockKey)));
                return;
            }
            const outgoing = config.mapSubmitPayload
                ? await config.mapSubmitPayload(data, {writeFields, params})
                : data;
            onPost(outgoing as TForm);
        };

        const handleSuccess = () => {
            config.afterSuccess?.();
            navigate(-1);
        };

        return (
            <EditFormViewRenderer<TForm>
                config={viewConfig}
                resolveLanguageKey={resolveLanguageKey}
                formSchema={formSchema}
                initialValues={initialValues}
                loading={loading}
                loadingData={false}
                loadingDataError={false}
                loadingDataErrorTitle="errorTitle"
                loadingDataErrorDescription="errorDescription"
                formExtras={formExtras}
                innerRef={innerRef}
                onSubmit={handleSubmit}
                onCancel={() => navigate(-1)}
                onSuccess={handleSuccess}
                writeAccess={writeFields as Record<string, any>}
                extraTitles={extraTitles}
                submitIcon={config.submitIcon}
                renderChildren={config.renderChildren
                    ? (form) => config.renderChildren!(form, entityData, {writeFields, resolveLanguageKey, loading})
                    : undefined}
            />
        );
    }

    GenericEditInner.displayName = `GenericEditPage_${viewCollectionKey || "unknown"}`;

    const patchHttp = {
        url:    config.apiUrl,
        method: "PATCH" as const,
        data:   {},
        ...(config.patchAddToHeader?.length ? {addToHeader: config.patchAddToHeader} : {}),
    };

    return compose(
        withLanguage(config.languagePath),
        withAxios<TDto, TForm>(patchHttp, true),
        withDebug(true, true, accessKey),
    )(GenericEditInner) as any;
}
