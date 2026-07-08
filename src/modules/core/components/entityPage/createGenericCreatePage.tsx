import {compose} from "redux";
import {type ReactNode} from "react";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useNavigate, useSearchParams} from "react-router-dom";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import FormViewRenderer from "@coreModule/components/viewEngine/FormViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import {useViewConfigContext} from "@coreModule/helpers/context/viewConfigContext.tsx";
import type {FieldValues} from "react-hook-form";
import Forbidden from "@coreModule/components/custom/pages/forbidden.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import {resolveEntityPageKeys} from "@coreModule/components/entityPage/resolveEntityPageKeys.ts";

type GenericCreatePageConfig<TForm extends FieldValues> = {
    languagePath: string;
    model?: string;
    apiUrl: string;
    schema: (languageCode: string, form: unknown) => any;
    defaultValues?: TForm | ((params: URLSearchParams) => TForm | Partial<TForm>) | Partial<TForm>;
    submitIcon?: ReactNode;
    buildExtraTitles?: (params: URLSearchParams) => string[];



    // to be checked
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

    function GenericCreateInner({
        resolveLanguageKey,
        languageCode,
        loading,
        innerRef,
        // onFormDataChange,
        onPost,
        onFinished,
        embedForm,
    }: CreateProps) {

        const [params] = useSearchParams();
        const navigate = useNavigate();
        const {accessKey, viewCollectionKey} = resolveEntityPageKeys(config);
        const {create} = useAccess(accessKey);
        const viewConfigCtx = useViewConfigContext();
        const viewConfig = useViewConfig(viewCollectionKey, "form:create");
        const formSchema = config.schema(languageCode, resolveLanguageKey("form"));

        if (!create) return <Forbidden />;
        if (!viewConfig) {
            if (viewConfigCtx && !viewConfigCtx.isHydrated) {
                return <Loader />;
            }
            return <Forbidden />;
        }

        function handleSuccessNavigate() {
            config.afterSuccess?.();
            if (onFinished) {
                onFinished();
                return;
            }
            if (config.successPath !== undefined) {
                navigate(config.successPath as any);
                return;
            }
            navigate(-1);
        }

        function handleCancel() {
            if (onFinished) {
                onFinished();
                return;
            }
            navigate(-1);
        }

        return (
            <FormViewRenderer<TForm>
                config={viewConfig}
                resolveLanguageKey={resolveLanguageKey}
                formSchema={formSchema}
                defaultValues={ !!config.defaultValues ? (typeof config.defaultValues === "function" ? config.defaultValues(params) : config.defaultValues) : {}}
                loading={loading}
                innerRef={innerRef}
                onSubmit={async (data: TForm) => {
                    const outgoing = config.mapSubmitPayload
                        ? await config.mapSubmitPayload(data)
                        : data;
                    onPost(outgoing as unknown as TForm);
                }}
                onCancel={handleCancel}
                onSuccess={handleSuccessNavigate}
                formExtras={config.buildFormExtras?.(params)}
                extraTitles={config.buildExtraTitles?.(params) ?? []}
                submitIcon={config.submitIcon}
                hideChrome={!!embedForm}
            />
        );
    }

    GenericCreateInner.displayName = `GenericCreatePage_${resolveEntityPageKeys(config).viewCollectionKey || "unknown"}`;

    return compose(
        withLanguage(config.languagePath),
        withAxios<unknown, TForm>({url: config.apiUrl, method: "PUT", data: {}}, true),
        withDebug(true, true)
    )(GenericCreateInner) as any;
}
