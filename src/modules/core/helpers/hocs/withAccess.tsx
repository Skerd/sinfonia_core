import {
    ComponentType,
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {useSelector} from "react-redux";
import {getClientConfig} from "@coreModule/helpers/general";
import {AccessFormResponseType} from "armonia/src/modules/core/api/user/private/permissions/access.form.response.type.ts";
import {
    AccessAllFormResponseType,
} from "armonia/src/modules/core/api/user/private/permissions/accessAll.form.response.type.ts";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import useErrorHandler from "@coreModule/helpers/hooks/useErrorHandler.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {ReadOrWriteFields} from "armonia/src/modules/core/types";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";

export type AccessObject = {
    read: ReadOrWriteFields | boolean | any;
    write: ReadOrWriteFields | boolean | any;
    create: boolean;
    delete: boolean;
    restore: boolean;
    resourceId: string;
    renderComponentOnError: boolean;
    ifProp: string;
    ifPropValue: any;
};

export type WithAccessType = {
    canAccess: boolean;
    withAccess: AccessObject;
};

// Global Access Context - stores access objects keyed by resourceId (camelCase plural)
type AccessContextValue = {
    [resourceId: string]: {
        self: AccessObject;
        others?: AccessObject;
    };
};

const AccessContext = createContext<AccessContextValue>({});


function accessFormToAccessObject(
    resourceId: string,
    form: AccessFormResponseType
): AccessObject {
    return {
        read: form.read ?? false,
        write: form.write ?? false,
        create: form.create ?? false,
        delete: form.delete ?? false,
        restore: form.restore ?? false,
        resourceId,
        ifProp: "specificUserId",
        ifPropValue: false,
        renderComponentOnError: false,
    };
}

function accessAllResponseToContext(data: AccessAllFormResponseType): AccessContextValue {
    const ctx: AccessContextValue = {};
    for (const [modelName, bundle] of Object.entries(data)) {
        ctx[modelName] = {
            self: accessFormToAccessObject(modelName, bundle.self),
            others: bundle.others ? accessFormToAccessObject(modelName, bundle.others) : undefined,
        };
    }
    return ctx;
}

const emptyAccessObject = (resourceId: string): AccessObject => ({
    read: {},
    write: {},
    create: false,
    delete: false,
    restore: false,
    resourceId: resourceId ?? "",
    ifProp: "specificUserId",
    ifPropValue: false,
    renderComponentOnError: false,
});

/**
 * Reads access for a resource from the nearest `withAccess` provider.
 *
 * @param resourceId - camelCase plural resource id (e.g. `users`, `companyUsers`).
 * @param perspective - `self` (default) or `others`; when the schema is `loose`, `others` is omitted and `self` is used.
 */
export function useAccess(
    resourceId: string,
    perspective: "self" | "others" = "self"
): AccessObject {
    const accessMap = useContext(AccessContext);

    if (!resourceId) {
        return emptyAccessObject("");
    }
    resourceId = resourceId.toLowerCase();

    // console.log(accessMap);
    const entry = accessMap[resourceId];
    if (!entry) {
        return emptyAccessObject(resourceId);
    }

    const chosen = perspective === "others" && entry.others !== undefined ? entry.others : entry.self;

    return {
        ...chosen,
        resourceId,
    };
}

const siteAccessShell: AccessObject = {
    read: false,
    write: false,
    create: false,
    delete: false,
    restore: false,
    resourceId: "",
    ifProp: "specificUserId",
    ifPropValue: false,
    renderComponentOnError: false,
};

/**
 * Loads all model access flags once (POST `/api/user/permissions/access/all`, empty body).
 * Provides data via `useAccess(resourceId)` and React context. No request caching; intended for a single call on private layout mount.
 *
 * Injects `canAccess` (manifest loaded successfully) and `withAccess` (placeholder object for compositional typing).
 */
const withAccess = () => <TProps extends object>(
    WrappedComponent: ComponentType<TProps & WithLanguageType & WithAccessType>
) => {
    function EnhancedComponent_WithAccess(props: TProps & WithLanguageType) {
        const {resolveLanguageKey} = props;
        const config = getClientConfig();
        const authToken = useSelector((state: RootState) => state.authentication.token);
        const [error, setError] = useState<boolean>(false);
        const [loading, setLoading] = useState<boolean>(false);
        const [accessMap, setAccessMap] = useState<AccessContextValue>({});
        const [retryToken, setRetryToken] = useState(0);
        const handleError = useErrorHandler(useMemo(() => ({context: "withAccess"}), []));
        /** After first successful load; avoids full-page loader on effect re-runs (e.g. parent re-renders when auth is outermost). */
        const accessHydratedRef = useRef(false);
        /** Matches `retryToken` of the last successful fetch so user-initiated retries still show the loader. */
        const lastSuccessRetryRef = useRef(0);

        useEffect(() => {
            const abortController = new AbortController();

            const fetchAllAccess = async () => {
                if (!authToken) {
                    setLoading(false);
                    setAccessMap({});
                    accessHydratedRef.current = false;
                    lastSuccessRetryRef.current = 0;
                    return;
                }
                const showBlockingLoader =
                    !accessHydratedRef.current || retryToken !== lastSuccessRetryRef.current;
                try {
                    if (showBlockingLoader) {
                        setLoading(true);
                    }
                    setError(false);
                    const response = await apiClient.post<AccessAllFormResponseType>(
                        `/api/user/permissions/access/all`,
                        {},
                        {
                            signal: abortController.signal,
                            headers: {
                                "Cache-Control": "no-store",
                                Pragma: "no-cache",
                            },
                        }
                    );
                    if (abortController.signal.aborted) return;
                    setAccessMap(accessAllResponseToContext(response.data));
                    accessHydratedRef.current = true;
                    lastSuccessRetryRef.current = retryToken;
                } catch (e: unknown) {
                    if (abortController.signal.aborted) return;
                    handleError(e);
                    setError(true);
                } finally {
                    if (abortController.signal.aborted) return;
                    setLoading(false);
                }
            };

            void fetchAllAccess();

            return () => abortController.abort();
        }, [authToken, retryToken]);

        if (error && config.withResourceAccess.showError ) {
            return (
                <div className="flex p-4 items-center justify-center w-full border rounded-lg">
                    <SimpleError
                        title={String(resolveLanguageKey("failTitle"))}
                        description={String(resolveLanguageKey("failDescription"))}
                        tooltipDescription={String(resolveLanguageKey("tooltipDescription"))}
                        onClick={() => setRetryToken((n) => n + 1)}
                    />
                </div>
            );
        }

        if (error && !config.withResourceAccess.showError) {
            return <></>;
        }

        if (loading && (config.withResourceAccess.showLoading)) {
            return (
                <Loader title={resolveLanguageKey("loading")} />
            );
        }

        return (
            <AccessContext.Provider value={accessMap}>
                <WrappedComponent
                    {...props}
                    canAccess={Boolean(authToken) && !error && !loading}
                    withAccess={siteAccessShell}
                />
            </AccessContext.Provider>
        );
    }

    return compose(withLanguage("src/modules/core/helpers/hocs/withAccess.tsx"))(
        EnhancedComponent_WithAccess as ComponentType<TProps & WithLanguageType>
    );
};

export default withAccess;
