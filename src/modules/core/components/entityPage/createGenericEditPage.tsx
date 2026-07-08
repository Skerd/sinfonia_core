import {compose} from "redux";
import {useEffect, useState, type ReactNode} from "react";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useNavigate, useSearchParams} from "react-router-dom";
import {toast} from "sonner";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import type {HttpRequestHeaderBuilder} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import EditFormViewRenderer from "@coreModule/components/viewEngine/editFormViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import {useViewConfigContext} from "@coreModule/helpers/context/viewConfigContext.tsx";
import type {FieldValues, UseFormReturn} from "react-hook-form";
import Forbidden from "@coreModule/components/custom/pages/forbidden.tsx";
import {resolveEntityPageKeys} from "@coreModule/components/entityPage/resolveEntityPageKeys.ts";

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
            resolveLanguageKey: (key: string) => unknown;
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
            resolveLanguageKey: (key: string) => unknown;
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
function buildInitialValuesAuto(data: Record<string, unknown>, writeFields: Record<string, unknown>,): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if ("_id" in data) result._id = data._id;

    for (const [key, fieldAccess] of Object.entries(writeFields)) {
        if (!fieldAccess) continue;

        const value = data[key];

        if (typeof fieldAccess === "object" && fieldAccess !== null && "keys" in fieldAccess) {
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

    function GenericEditInner({
        resolveLanguageKey,
        languageCode,
        loading,
        innerRef,
        // onFilterChange,
        onPost,
        entityId,
        entityName,
    }: EditProps) {

        const navigate = useNavigate();
        const {accessKey, viewCollectionKey} = resolveEntityPageKeys(config);
        const {write, read} = useAccess(accessKey);
        const [params] = useSearchParams();
        const writeFields = (write || {}) as Record<string, unknown>;
        const readFields = (read || {}) as Record<string, unknown>;

        const [forceReload, setForceReload] = useState(0);
        const [entityData, setEntityData] = useState<TDto | null>(null);
        const [loadingEntity, setLoadingEntity] = useState(true);
        const [entityError, setEntityError] = useState(false);

        const viewConfigCtx = useViewConfigContext();
        const viewConfig = useViewConfig(viewCollectionKey, "form:edit");
        const formSchema = config.schema(languageCode, resolveLanguageKey("form"), writeFields, readFields);

        useEffect(() => {
            if (!entityId) {
                setEntityError(true);
                setLoadingEntity(false);
                return;
            }
            setLoadingEntity(true);
            setEntityError(false);
            const loader = config.fetchEntity
                ? config.fetchEntity(entityId)
                : apiClient.post<TDto>(`${config.apiUrl}/single`, {_id: entityId}).then((res) => res.data);

            loader
                .then((data) => {
                    setEntityData(data);
                })
                .catch(() => setEntityError(true))
                .finally(() => setLoadingEntity(false));
        }, [entityId, forceReload]);

        if (!write) return <Forbidden />;
        if (!entityId) return <Forbidden />;
        if (!viewConfig) {
            if (viewConfigCtx && !viewConfigCtx.isHydrated) {
                return <Loader />;
            }
            return <Forbidden />;
        }
        if (loadingEntity) return <Loader />;
        if (entityError || !entityData) {
            return (
                <SimpleError
                    title={resolveLanguageKey("errorTitle")}
                    description={resolveLanguageKey("errorDescription")}
                    onClick={() => setForceReload(Date.now())}
                />
            );
        }

        const rawData = config.mapEntityData
            ? config.mapEntityData(entityData)
            : entityData as Record<string, unknown>;
        const initialValues = config.buildInitialValues
            ? config.buildInitialValues(entityData, writeFields)
            : buildInitialValuesAuto(rawData, writeFields) as Partial<TForm>;
        const extraTitles = config.buildExtraTitles?.(params, entityName) ?? [entityName || ""];

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
                formExtras={config.buildFormExtras?.(entityId, params, entityData)}
                innerRef={innerRef}
                onSubmit={async (data: TForm) => {
                    const submitHelpers = {writeFields, params, resolveLanguageKey};
                    const blockKey = config.beforeSubmit?.(data, submitHelpers);
                    if (blockKey) {
                        toast.error(String(resolveLanguageKey(blockKey)));
                        return;
                    }
                    const outgoing = config.mapSubmitPayload
                        ? await config.mapSubmitPayload(data, {writeFields, params})
                        : data;
                    onPost(outgoing as unknown as TForm);
                }}
                onCancel={() => navigate(-1)}
                onSuccess={() => {
                    config.afterSuccess?.();
                    navigate(-1);
                }}
                writeAccess={writeFields as Record<string, any>}
                extraTitles={extraTitles}
                submitIcon={config.submitIcon}
                renderChildren={config.renderChildren
                    ? (form) => config.renderChildren!(form, entityData, {writeFields, resolveLanguageKey, loading})
                    : undefined}
            />
        );
    }

    GenericEditInner.displayName = `GenericEditPage_${resolveEntityPageKeys(config).viewCollectionKey || "unknown"}`;

    const patchHttp = {
        url:    config.apiUrl,
        method: "PATCH" as const,
        data:   {},
        ...(config.patchAddToHeader?.length ? {addToHeader: config.patchAddToHeader} : {}),
    };

    return compose(
        withLanguage(config.languagePath),
        withAxios<TDto, TForm>(patchHttp, true),
        withDebug(true, true)
    )(GenericEditInner) as any;
}
