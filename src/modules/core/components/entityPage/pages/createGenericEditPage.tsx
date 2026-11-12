import {compose} from "redux";
import {useEffect, useMemo, useState, type ReactNode, type ComponentType} from "react";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {type ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useNavigate, useSearchParams} from "react-router-dom";
import {toast} from "sonner";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import SimpleError from "@coreModule/components/custom/errors/errorViewWrapper.tsx";
import useHttpRequest, {type HttpRequest, type HttpRequestHeaderBuilder} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import EditFormViewRenderer from "@coreModule/components/viewEngine/editFormViewRenderer.tsx";
import {useViewConfigState} from "@coreModule/helpers/hooks/useViewConfig.ts";
import type {FieldValues, UseFormReturn} from "react-hook-form";
import Forbidden from "@coreModule/components/custom/pages/forbidden.tsx";
import {resolveEntityPageKeys} from "@coreModule/helpers/general/entityPage.ts";
import {useCompanyTimeZone} from "@coreModule/helpers/hooks/useCompanyTimeZone.ts";
import type {ValidationContext} from "armonia/src/modules/core/helpers/zodBuilder.ts";

type GenericEditPageConfig<TDto, TForm extends FieldValues> = {
    languagePath: string;
    model?: string;
    apiUrl: string;
    /** Armonia factory; it receives the session company's {@link ValidationContext} as its 5th argument (D116). */
    schema: (languageCode: string, form: unknown, writeFields: Record<string, unknown>, readFields: Record<string, unknown>, context?: ValidationContext) => any;
    mapEntityData?: (dto: TDto) => Record<string, unknown>;
    submitIcon?: ReactNode;
    buildExtraTitles?: (params: URLSearchParams, entityName?: string | null) => string[];

    /**
     * How the entity document loads, instead of `POST {apiUrl}/single` with `{_id}`. Header and
     * path builders read `entityId` (e.g. `{whatToGet: "entityId", whereToPut: "x-company-id"}`).
     */
    entityRequest?: HttpRequest;
    /** @deprecated Use `entityRequest`; kept until its last module caller moves. */
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
    /** Route (or history delta) to go to after a save; defaults to `navigate(-1)`, as in `createGenericCreatePage`. */
    successPath?: string | number;
    /**
     * Stay on the page after a save instead of going back. For settings split into one page per section: going back
     * would land on whichever section was open before, not the one just saved (TD-F56, UX-12).
     */
    stayAfterSave?: boolean;
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

    const entityRequest: HttpRequest = config.entityRequest ?? {method: "post", url: `${config.apiUrl}/single`, data: {}};
    const usesRequest = !config.fetchEntity;

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
        const [fetchedData, setFetchedData] = useState<TDto | null>(null);
        const [fetching, setFetching] = useState(usesRequest ? false : true);
        const [fetchError, setFetchError] = useState(false);

        // One silent load per entity and per retry; the page shows its own loader and error.
        const loadKey = `${entityId ?? ""}|${reloadCount}`;
        const [load, setLoad] = useState({loadKey, count: entityId && usesRequest ? 1 : 0});
        if (load.loadKey !== loadKey) {
            setLoad({loadKey, count: entityId && usesRequest ? load.count + 1 : load.count});
        }
        const entityBody = useMemo(() => ({_id: entityId}), [entityId]);
        const entityProps = useMemo(() => ({entityId}), [entityId]);
        const entityLoad = useHttpRequest<TDto>(entityRequest, entityBody, load.count, true, {}, entityProps);

        const entityData = usesRequest ? entityLoad.data : fetchedData;
        const loadingEntity = usesRequest ? entityLoad.loading : fetching;
        const entityError = usesRequest ? !!entityLoad.error : fetchError;

        const {config: viewConfig, loading: viewConfigLoading} = useViewConfigState(viewCollectionKey, "form:edit");
        const timeZone = useCompanyTimeZone();
        const formSchema = useMemo(
            () => config.schema(languageCode, resolveLanguageKey("form"), writeFields, readFields, {timeZone}),
            [languageCode, resolveLanguageKey, writeFields, readFields, timeZone],
        );

        useEffect(() => {
            if (!config.fetchEntity) return;
            if (!entityId) {
                setFetching(false);
                return;
            }
            // Ignore responses that arrive after the id changed or the page unmounted.
            let stale = false;
            setFetching(true);
            setFetchError(false);
            config.fetchEntity(entityId)
                .then((data) => { if (!stale) setFetchedData(data); })
                .catch(() => { if (!stale) setFetchError(true); })
                .finally(() => { if (!stale) setFetching(false); });
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
            // The page's `axios.success` toast still confirms the save.
            if (config.stayAfterSave) return;
            if (config.successPath === undefined) navigate(-1);
            else if (typeof config.successPath === "number") navigate(config.successPath);
            else navigate(config.successPath);
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
    )(GenericEditInner) as ComponentType<GenericEditPageProps>;
}
