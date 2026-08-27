import {
    ComponentType,
    createContext,
    Dispatch,
    SetStateAction,
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

/** Boolean / field-map overrides applied by `withDebug` on top of the real access map. */
export type AccessPermissionOverride = {
    create?: boolean;
    delete?: boolean;
    restore?: boolean;
    /**
     * Master override for the whole read/write map.
     * `false` denies everything; `true` restores the real map (or grants `true` if it was denied).
     */
    read?: boolean;
    write?: boolean;
    /**
     * Per-field denials/grants keyed by dotted path (`name`, `country.name`).
     * Nested maps use the same `keys` walk as `hasAccessPath`.
     */
    readFields?: Record<string, boolean>;
    writeFields?: Record<string, boolean>;
};

export type AccessDebugOverrides = {
    [resourceId: string]: {
        self?: AccessPermissionOverride;
        others?: AccessPermissionOverride;
    };
};

// Global Access Context - stores access objects keyed by resourceId (camelCase plural)
export type AccessContextValue = {
    [resourceId: string]: {
        self: AccessObject;
        others?: AccessObject;
    };
};

const AccessContext = createContext<AccessContextValue>({});

/** `null` outside `withAccess`. `false` until `/access/all` succeeds; then `true`. */
const AccessHydrationContext = createContext<boolean | null>(null);

type AccessDebugOverrideContextValue = {
    overrides: AccessDebugOverrides;
    setOverrides: Dispatch<SetStateAction<AccessDebugOverrides>>;
};

const AccessDebugOverrideContext = createContext<AccessDebugOverrideContextValue | null>(null);

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
        const key = modelName.toLowerCase();
        ctx[key] = {
            self: accessFormToAccessObject(key, bundle.self),
            others: bundle.others ? accessFormToAccessObject(key, bundle.others) : undefined,
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

type AccessFieldNode = {
    [key: string]: {
        keys?: AccessFieldNode;
    } | Record<string, never>;
};

export type AccessFieldPath = {
    path: string;
    depth: number;
    hasChildren: boolean;
};

/** Flatten a read/write field map into dotted paths (walks nested `keys`). */
export function flattenAccessFieldPaths(tree: unknown, prefix = "", depth = 0): AccessFieldPath[] {
    if (!tree || typeof tree !== "object" || Array.isArray(tree)) {
        return [];
    }
    const result: AccessFieldPath[] = [];
    for (const [key, value] of Object.entries(tree as Record<string, unknown>)) {
        const path = prefix ? `${prefix}.${key}` : key;
        const nestedKeys =
            value && typeof value === "object" && !Array.isArray(value) && "keys" in (value as object)
                ? (value as {keys?: unknown}).keys
                : undefined;
        const hasChildren =
            !!nestedKeys && typeof nestedKeys === "object" && !Array.isArray(nestedKeys)
            && Object.keys(nestedKeys as object).length > 0;
        result.push({path, depth, hasChildren});
        if (hasChildren) {
            result.push(...flattenAccessFieldPaths(nestedKeys, path, depth + 1));
        }
    }
    return result;
}

/** Same path walk as view-engine `hasAccessPath`. */
export function accessFieldPathExists(tree: unknown, path: string): boolean {
    if (!tree || !path) {
        return false;
    }
    if (typeof tree !== "object") {
        return tree === true;
    }
    const record = tree as Record<string, unknown>;
    if (record[path] !== undefined) {
        return !!record[path];
    }
    const parts = path.split(".");
    let cursor: unknown = record;
    for (let i = 0; i < parts.length; i++) {
        if (!cursor || typeof cursor !== "object") {
            return false;
        }
        const next = (cursor as Record<string, unknown>)[parts[i]];
        if (i === parts.length - 1) {
            return !!next;
        }
        cursor = (next as {keys?: unknown} | undefined)?.keys ?? next;
    }
    return false;
}

function deepCloneAccessFields(tree: unknown): AccessFieldNode {
    if (!tree || typeof tree !== "object" || Array.isArray(tree)) {
        return {};
    }
    const out: AccessFieldNode = {};
    for (const [key, value] of Object.entries(tree as Record<string, unknown>)) {
        if (value && typeof value === "object" && !Array.isArray(value) && "keys" in (value as object)) {
            const keys = (value as {keys?: unknown}).keys;
            out[key] = {
                keys: keys && typeof keys === "object" ? deepCloneAccessFields(keys) : {},
            };
        } else {
            out[key] = {};
        }
    }
    return out;
}

function removeAccessFieldPath(tree: AccessFieldNode, path: string): AccessFieldNode {
    const parts = path.split(".");
    if (parts.length === 1) {
        const next = {...tree};
        delete next[parts[0]];
        return next;
    }
    const [head, ...rest] = parts;
    const node = tree[head];
    if (!node || typeof node !== "object") {
        return tree;
    }
    const childKeys =
        "keys" in node && node.keys && typeof node.keys === "object"
            ? removeAccessFieldPath(node.keys as AccessFieldNode, rest.join("."))
            : {};
    if (Object.keys(childKeys).length === 0) {
        const next = {...tree};
        delete next[head];
        return next;
    }
    return {
        ...tree,
        [head]: {keys: childKeys},
    };
}

function grantAccessFieldPath(tree: AccessFieldNode, path: string, leafFromBase?: unknown): AccessFieldNode {
    const resolvedLeaf: AccessFieldNode[string] =
        leafFromBase && typeof leafFromBase === "object" && !Array.isArray(leafFromBase)
            ? ("keys" in (leafFromBase as object)
                ? {keys: deepCloneAccessFields((leafFromBase as {keys?: unknown}).keys ?? {})}
                : {})
            : {};

    const apply = (node: AccessFieldNode, segs: string[]): AccessFieldNode => {
        if (segs.length === 1) {
            if (node[segs[0]]) {
                return node;
            }
            return {...node, [segs[0]]: resolvedLeaf};
        }
        const [h, ...r] = segs;
        const cur = node[h];
        const keys =
            cur && typeof cur === "object" && "keys" in cur && cur.keys
                ? (cur.keys as AccessFieldNode)
                : {};
        return {...node, [h]: {keys: apply(keys, r)}};
    };
    return apply(tree, path.split("."));
}

function getAccessSubtree(tree: unknown, path: string): unknown {
    if (!tree || typeof tree !== "object") {
        return undefined;
    }
    const parts = path.split(".");
    let cursor: unknown = tree;
    for (let i = 0; i < parts.length; i++) {
        if (!cursor || typeof cursor !== "object") {
            return undefined;
        }
        const next = (cursor as Record<string, unknown>)[parts[i]];
        if (i === parts.length - 1) {
            return next;
        }
        cursor = (next as {keys?: unknown} | undefined)?.keys ?? next;
    }
    return undefined;
}

function applyFieldMapOverride(
    base: unknown,
    master: boolean | undefined,
    fieldOverrides?: Record<string, boolean>,
): unknown {
    if (master === false) {
        return false;
    }
    if (master === true) {
        return typeof base === "object" && base ? base : true;
    }

    const hasFieldOverrides = !!fieldOverrides && Object.keys(fieldOverrides).length > 0;
    if (!hasFieldOverrides) {
        return base;
    }

    let tree: AccessFieldNode =
        base && typeof base === "object" ? deepCloneAccessFields(base) : {};

    // Denies first (deeper paths first so parent deny wins cleanly), then grants.
    const denies = Object.entries(fieldOverrides!)
        .filter(([, enabled]) => !enabled)
        .sort((a, b) => b[0].split(".").length - a[0].split(".").length);
    const grants = Object.entries(fieldOverrides!)
        .filter(([, enabled]) => enabled)
        .sort((a, b) => a[0].split(".").length - b[0].split(".").length);

    for (const [path] of denies) {
        tree = removeAccessFieldPath(tree, path);
    }
    for (const [path] of grants) {
        if (!accessFieldPathExists(tree, path)) {
            tree = grantAccessFieldPath(tree, path, getAccessSubtree(base, path));
        }
    }

    return Object.keys(tree).length > 0 ? tree : false;
}

function mergeAccessOverride(
    base: AccessObject,
    override?: AccessPermissionOverride
): AccessObject {
    if (!override) {
        return base;
    }
    const next: AccessObject = {...base};
    if (override.create !== undefined) {
        next.create = override.create;
    }
    if (override.delete !== undefined) {
        next.delete = override.delete;
    }
    if (override.restore !== undefined) {
        next.restore = override.restore;
    }
    if (override.read !== undefined || override.readFields) {
        next.read = applyFieldMapOverride(base.read, override.read, override.readFields);
    }
    if (override.write !== undefined || override.writeFields) {
        next.write = applyFieldMapOverride(base.write, override.write, override.writeFields);
    }
    return next;
}

/** Full access map from the nearest `withAccess` provider (real server values, no debug overrides). */
export function useAccessMap(): AccessContextValue {
    return useContext(AccessContext);
}

/**
 * Whether the access map has been fetched. `null` outside `withAccess`.
 * Empty `read` before this is true is "not loaded yet", not Forbidden.
 */
export function useAccessHydrated(): boolean | null {
    return useContext(AccessHydrationContext);
}

/** Debug override state used by `withDebug` permission toggles. Null outside `withAccess`. */
export function useAccessDebugOverrides(): AccessDebugOverrideContextValue | null {
    return useContext(AccessDebugOverrideContext);
}

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
    const debugOverrides = useContext(AccessDebugOverrideContext);

    if (!resourceId) {
        return emptyAccessObject("");
    }
    resourceId = resourceId.toLowerCase();

    const entry = accessMap[resourceId];
    if (!entry) {
        return emptyAccessObject(resourceId);
    }

    const overrideKey: "self" | "others" =
        perspective === "others" && entry.others !== undefined ? "others" : "self";
    const chosen = overrideKey === "others" && entry.others !== undefined ? entry.others : entry.self;
    const override = debugOverrides?.overrides[resourceId]?.[overrideKey];

    return mergeAccessOverride({
        ...chosen,
        resourceId,
    }, override);
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
        const [isHydrated, setIsHydrated] = useState(false);
        const [retryToken, setRetryToken] = useState(0);
        const [accessOverrides, setAccessOverrides] = useState<AccessDebugOverrides>({});
        const handleError = useErrorHandler(useMemo(() => ({context: "withAccess"}), []));
        /** After first successful load; avoids full-page loader on effect re-runs (e.g. parent re-renders when auth is outermost). */
        const accessHydratedRef = useRef(false);
        /** Matches `retryToken` of the last successful fetch so user-initiated retries still show the loader. */
        const lastSuccessRetryRef = useRef(0);
        const accessDebugOverrideValue = useMemo(
            () => ({overrides: accessOverrides, setOverrides: setAccessOverrides}),
            [accessOverrides],
        );

        useEffect(() => {
            const abortController = new AbortController();

            const fetchAllAccess = async () => {
                if (!authToken) {
                    setLoading(false);
                    setAccessMap({});
                    setIsHydrated(false);
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
                    setIsHydrated(true);
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
            <AccessHydrationContext.Provider value={isHydrated}>
                <AccessContext.Provider value={accessMap}>
                    <AccessDebugOverrideContext.Provider value={accessDebugOverrideValue}>
                        <WrappedComponent
                            {...props}
                            canAccess={Boolean(authToken) && !error && !loading}
                            withAccess={siteAccessShell}
                        />
                    </AccessDebugOverrideContext.Provider>
                </AccessContext.Provider>
            </AccessHydrationContext.Provider>
        );
    }

    return compose(withLanguage("src/modules/core/helpers/hocs/withAccess.tsx"))(
        EnhancedComponent_WithAccess as ComponentType<TProps & WithLanguageType>
    );
};

export default withAccess;
