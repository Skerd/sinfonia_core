import {compose} from "redux";
import {useMemo, type ComponentType, type ReactNode} from "react";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withRequestWording from "@coreModule/helpers/hocs/withRequestWording.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useNavigate, useSearchParams} from "react-router-dom";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {useActionAccess} from "@coreModule/helpers/hooks/useActionAccess.ts";
import FormViewRenderer from "@coreModule/components/viewEngine/FormViewRenderer.tsx";
import {useViewConfigState} from "@coreModule/helpers/hooks/useViewConfig.ts";
import type {FieldValues, UseFormReturn} from "react-hook-form";
import Forbidden from "@coreModule/components/custom/pages/forbidden.tsx";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import {resolveEntityPageKeys} from "@coreModule/helpers/general/entityPage.ts";
import {useCompanyTimeZone} from "@coreModule/helpers/hooks/useCompanyTimeZone.ts";
import {useSelector} from "react-redux";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import type {AuthUser} from "@coreModule/helpers/redux/slices/authSlice.ts";
import type {ValidationContext} from "armonia/src/modules/core/helpers/zodBuilder.ts";

/** What a `defaultValues` builder may read besides the URL. */
export type CreateDefaultsContext = {
    /** The session company's IANA zone (`useCompanyTimeZone`); pass it to `companyToday` for a "today" default. */
    timeZone: string;
    /** The signed-in user and their session company, e.g. to start a form with their own name (TD-F114). */
    user: AuthUser;
};

type GenericCreatePageConfig<TForm extends FieldValues> = {
    languagePath: string;
    model?: string;
    apiUrl: string;
    /** Armonia factory; it receives the session company's {@link ValidationContext} as its 5th argument (D116). */
    schema: (languageCode: string, form: unknown, writeFields?: Record<string, unknown>, readFields?: Record<string, unknown>, context?: ValidationContext) => any;
    /**
     * Static values, or a builder that reads the URL (e.g. `?projectId=` prefill) and the session company's
     * {@link CreateDefaultsContext} (a calendar-day default is "today" in the company's zone, GLB-09, D116).
     */
    defaultValues?: Partial<TForm> | ((params: URLSearchParams, context: CreateDefaultsContext) => Partial<TForm>);
    submitIcon?: ReactNode;
    buildExtraTitles?: (params: URLSearchParams) => string[];

    /** Route (or history delta) to go to after success; defaults to `navigate(-1)`. */
    successPath?: string | number;
    buildFormExtras?: (params: URLSearchParams) => Record<string, unknown>;
    /** Normalize client form values before sending (JSON body or multipart). May be async for pre-upload patterns. */
    mapSubmitPayload?: (data: TForm) => TForm | FormData | Promise<TForm | FormData>;
    /** Side effects once the PUT succeeds (`FormViewRenderer` / axios success pipeline). */
    afterSuccess?: () => void;
    /** Render prop for interactive children that need form access (slug prefill, cascading selects). */
    renderChildren?: (form: UseFormReturn<TForm>) => ReactNode;

    //deprecated
    collectionName?: string;
    accessModel?: string;
};

export type GenericCreateSurfaceProps = {
    /**
     * Close host UI (e.g. dialog) instead of `navigate(-1)` after success or on cancel. After a save it gets the new
     * record's id, so the host can pick it (an `#ApiSelect` creating a missing option); on cancel it gets nothing.
     */
    onFinished?: (createdId?: string) => void;
    /** Hide page header chrome — set when embedding inside a dialog. */
    embedForm?: boolean;
};

/** The new record's id in a create response: `createCrudRouter`'s PUT always answers with `_id`. */
function createdIdOf(data: unknown): string | undefined {
    if (typeof data !== "object" || data === null || !("_id" in data)) return undefined;
    return typeof data._id === "string" && data._id !== "" ? data._id : undefined;
}

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
        const {create, requestable} = useAccess(accessKey);
        // A requestable platform list (D160): the `request` permission also opens the form, and the server stores the
        // new row as a request for the platform to approve.
        const canRequest = useActionAccess(accessKey, "request");
        const {config: viewConfig, loading: viewConfigLoading} = useViewConfigState(viewCollectionKey, "form:create");

        const timeZone = useCompanyTimeZone();
        const user = useSelector((state: RootState) => state.authentication.user);
        const formSchema = useMemo(
            () => config.schema(languageCode, resolveLanguageKey("form"), undefined, undefined, {timeZone}),
            [languageCode, resolveLanguageKey, timeZone],
        );

        // Keyed by the query string so URL-driven builders re-run only when the URL actually changes.
        const paramsKey = params.toString();
        const defaultValues = useMemo(() => {
            const source = config.defaultValues;
            return (typeof source === "function" ? source(params, {timeZone, user}) : source) ?? {};
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [paramsKey, timeZone, user.id]);
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

        if (!create && !(requestable && canRequest)) return <Forbidden />;
        if (!viewConfig) return viewConfigLoading ? <Loader /> : <Forbidden />;

        const close = (createdId?: string) => {
            if (onFinished) onFinished(createdId);
            else navigate(-1);
        };

        const handleSuccess = (data: unknown) => {
            config.afterSuccess?.();
            // An embedding host (dialog) always owns the close; `successPath` only applies to routed pages.
            if (onFinished || config.successPath === undefined) return close(createdIdOf(data));
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
                onCancel={() => close()}
                onSuccess={handleSuccess}
                formExtras={formExtras}
                extraTitles={extraTitles}
                submitIcon={config.submitIcon}
                hideChrome={!!embedForm}
                renderChildren={config.renderChildren}
            />
        );
    }

    GenericCreateInner.displayName = `GenericCreatePage_${viewCollectionKey || "unknown"}`;

    return compose(
        withLanguage(config.languagePath),
        withRequestWording(accessKey),
        withAxios<unknown, TForm>({url: config.apiUrl, method: "PUT", data: {}}, true),
        withDebug(true, true, accessKey),
    )(GenericCreateInner) as ComponentType<GenericCreateSurfaceProps>;
}
