import {compose} from "redux";
import {useMemo, type ReactNode} from "react";
import withAxios, {WithAxiosType} from "@baseModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import {useNavigate, useSearchParams} from "react-router-dom";
import {useAccess} from "@baseModule/helpers/hooks/useAccess.ts";
import FormViewRenderer from "@baseModule/components/viewEngine/FormViewRenderer.tsx";
import {useViewConfigState} from "@baseModule/helpers/hooks/useViewConfig.ts";
import type {FieldValues} from "react-hook-form";
import Forbidden from "@coreModule/components/custom/pages/forbidden.tsx";
import Loader from "@baseModule/components/custom/loader/loader.tsx";
import {resolveEntityPageKeys} from "@baseModule/helpers/general/entityPage.ts";

type GenericCreatePageConfig<TForm extends FieldValues> = {
    languagePath: string;
    model?: string;
    apiUrl: string;
    schema: (languageCode: string, form: unknown) => any;
    /** Static values, or a builder that reads the URL (e.g. `?projectId=` prefill). */
    defaultValues?: Partial<TForm> | ((params: URLSearchParams) => Partial<TForm>);
    submitIcon?: ReactNode;
    buildExtraTitles?: (params: URLSearchParams) => string[];

    /** Route (or history delta) to go to after success; defaults to `navigate(-1)`. */
    successPath?: string | number;
    buildFormExtras?: (params: URLSearchParams) => Record<string, unknown>;
    /** Normalize client form values before sending (JSON body or multipart). May be async for pre-upload patterns. */
    mapSubmitPayload?: (data: TForm) => TForm | FormData | Promise<TForm | FormData>;
    /** Side effects once the PUT succeeds (`FormViewRenderer` / axios success pipeline). */
    afterSuccess?: () => void;

    //deprecated
    collectionName?: string;
    accessModel?: string;
};

export type GenericCreateSurfaceProps = {
    /** Close host UI (e.g. dialog) instead of `navigate(-1)` after success or on cancel. */
    onFinished?: () => void;
    /** Hide page header chrome — set when embedding inside a dialog. */
    embedForm?: boolean;
};

export function createGenericCreatePage<TForm extends FieldValues>(config: GenericCreatePageConfig<TForm>) {
    type CreateProps = WithLanguageType & WithAxiosType<unknown, TForm> & GenericCreateSurfaceProps;

    // Config is static per page, so resolve the keys once instead of on every render.
    const {accessKey, viewCollectionKey} = resolveEntityPageKeys(config);

    function GenericCreateInner({
        resolveLanguageKey,
        languageCode,
        loading,
        innerRef,
        onPost,
        onFinished,
        embedForm,
    }: CreateProps) {
        const [params] = useSearchParams();
        const navigate = useNavigate();
        const {create} = useAccess(accessKey);
        const {config: viewConfig, loading: viewConfigLoading} = useViewConfigState(viewCollectionKey, "form:create");

        const formSchema = useMemo(
            () => config.schema(languageCode, resolveLanguageKey("form")),
            [languageCode, resolveLanguageKey],
        );

        // Keyed by the query string so URL-driven builders re-run only when the URL actually changes.
        const paramsKey = params.toString();
        const defaultValues = useMemo(() => {
            const source = config.defaultValues;
            return (typeof source === "function" ? source(params) : source) ?? {};
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [paramsKey]);
        const formExtras = useMemo(
            () => config.buildFormExtras?.(params),
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [paramsKey],
        );
        const extraTitles = useMemo(
            () => config.buildExtraTitles?.(params) ?? [],
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [paramsKey],
        );

        if (!create) return <Forbidden />;
        if (!viewConfig) return viewConfigLoading ? <Loader /> : <Forbidden />;

        const close = () => {
            if (onFinished) onFinished();
            else navigate(-1);
        };

        const handleSuccess = () => {
            config.afterSuccess?.();
            // An embedding host (dialog) always owns the close; `successPath` only applies to routed pages.
            if (onFinished || config.successPath === undefined) return close();
            if (typeof config.successPath === "number") navigate(config.successPath);
            else navigate(config.successPath);
        };

        const handleSubmit = async (data: TForm) => {
            const outgoing = config.mapSubmitPayload ? await config.mapSubmitPayload(data) : data;
            onPost(outgoing as TForm);
        };

        return (
            <FormViewRenderer<TForm>
                config={viewConfig}
                resolveLanguageKey={resolveLanguageKey}
                formSchema={formSchema}
                defaultValues={defaultValues}
                loading={loading}
                innerRef={innerRef}
                onSubmit={handleSubmit}
                onCancel={close}
                onSuccess={handleSuccess}
                formExtras={formExtras}
                extraTitles={extraTitles}
                submitIcon={config.submitIcon}
                hideChrome={!!embedForm}
            />
        );
    }

    GenericCreateInner.displayName = `GenericCreatePage_${viewCollectionKey || "unknown"}`;

    return compose(
        withLanguage(config.languagePath),
        withAxios<unknown, TForm>({url: config.apiUrl, method: "PUT", data: {}}, true),
        withDebug(true, true, accessKey),
    )(GenericCreateInner) as any;
}
