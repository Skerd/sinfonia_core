import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
} from "react";
import {useSelector} from "react-redux";
import type {AccessFormResponseType} from "armonia/src/modules/core/api/user/private/permissions/access.form.response.type.ts";
import type {AccessAllFormResponseType} from "armonia/src/modules/core/api/user/private/permissions/accessAll.form.response.type.ts";
import apiClient from "@baseModule/helpers/apiClient/apiClient.ts";
import useErrorHandler from "@baseModule/helpers/hooks/useErrorHandler.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import type {ReadOrWriteFields} from "armonia/src/modules/core/types";
import {SessionSetupScreen, SESSION_SETUP_TOTAL_STEPS} from "@coreModule/components/ui/sessionSetupScreen.tsx";

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

type AccessFlag = "create" | "delete" | "restore";
const ACCESS_FLAGS: readonly AccessFlag[] = ["create", "delete", "restore"];

/** Boolean / field-map overrides applied by `withDebug` on top of the real access map. */
export type AccessPermissionOverride = Partial<Record<AccessFlag, boolean>> & {
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

export type AccessPerspective = "self" | "others";

export type AccessDebugOverrides = {
    [resourceId: string]: Partial<Record<AccessPerspective, AccessPermissionOverride>>;
};

/** Global access map, keyed by lower-cased resource id (`companyusers`). */
export type AccessContextValue = {
    [resourceId: string]: {
        self: AccessObject;
        others?: AccessObject;
    };
};

export const AccessContext = createContext<AccessContextValue>({});

/** `null` outside `AccessProvider`. `false` until `/access/all` succeeds; then `true`. */
const AccessHydrationContext = createContext<boolean | null>(null);

type AccessDebugOverrideContextValue = {
    overrides: AccessDebugOverrides;
    setOverrides: Dispatch<SetStateAction<AccessDebugOverrides>>;
};

export const AccessDebugOverrideContext = createContext<AccessDebugOverrideContextValue | null>(null);

// ---------------------------------------------------------------------------
// Access objects
// ---------------------------------------------------------------------------

function makeAccessObject(
    resourceId: string,
    permissions: Pick<AccessObject, "read" | "write" | AccessFlag>,
): AccessObject {
    return {
        ...permissions,
        resourceId,
        ifProp: "specificUserId",
        ifPropValue: false,
        renderComponentOnError: false,
    };
}

function accessFormToAccessObject(resourceId: string, form: AccessFormResponseType): AccessObject {
    return makeAccessObject(resourceId, {
        read: form.read ?? false,
        write: form.write ?? false,
        create: form.create ?? false,
        delete: form.delete ?? false,
        restore: form.restore ?? false,
    });
}

/** Server keys are model names (`CompanyUsers`); the map is keyed lower-case so lookups are case-insensitive. */
export function accessAllResponseToContext(data: AccessAllFormResponseType): AccessContextValue {
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

/** Denied access for `resourceId`: what `useAccess` returns when nothing is known about it. */
export const emptyAccessObject = (resourceId: string): AccessObject =>
    makeAccessObject(resourceId, {read: {}, write: {}, create: false, delete: false, restore: false});

const allowAllAccessObject = (resourceId: string): AccessObject =>
    makeAccessObject(resourceId, {read: true, write: true, create: true, delete: true, restore: true});

/**
 * Nested map that grants every resource. Studio gallery mounts `*Card` widgets the
 * session may not be allowed to read — without this they render as empty HiddenElement.
 */
export function AccessAllowAllProvider({children}: {children: ReactNode}) {
    const value = useMemo(() => {
        // Cache per id so `useAccess` sees a stable entry across renders.
        const entries = new Map<string, AccessContextValue[string]>();
        return new Proxy({} as AccessContextValue, {
            get(_target, resourceId) {
                if (typeof resourceId !== "string") return undefined;
                let entry = entries.get(resourceId);
                if (!entry) {
                    entry = {self: allowAllAccessObject(resourceId)};
                    entries.set(resourceId, entry);
                }
                return entry;
            },
        });
    }, []);
    return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

// ---------------------------------------------------------------------------
// Field maps (`{name: {}, country: {keys: {name: {}}}}`)
// ---------------------------------------------------------------------------

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

/** The `keys` map of a field node, if it has one. */
function nestedKeysOf(node: unknown): unknown {
    return isPlainObject(node) && "keys" in node ? node.keys : undefined;
}

/** Flatten a read/write field map into dotted paths (walks nested `keys`). */
export function flattenAccessFieldPaths(tree: unknown, prefix = "", depth = 0): AccessFieldPath[] {
    if (!isPlainObject(tree)) {
        return [];
    }
    const result: AccessFieldPath[] = [];
    for (const [key, value] of Object.entries(tree)) {
        const path = prefix ? `${prefix}.${key}` : key;
        const nestedKeys = nestedKeysOf(value);
        const hasChildren = isPlainObject(nestedKeys) && Object.keys(nestedKeys).length > 0;
        result.push({path, depth, hasChildren});
        if (hasChildren) {
            result.push(...flattenAccessFieldPaths(nestedKeys, path, depth + 1));
        }
    }
    return result;
}

/**
 * Node at a dotted path. Intermediate steps descend into a node's `keys` when present
 * (else into the node itself); the last step returns the node, `keys` included.
 */
function getAccessSubtree(tree: unknown, path: string): unknown {
    const parts = path.split(".");
    let cursor: unknown = tree;
    for (let i = 0; i < parts.length; i++) {
        if (!cursor || typeof cursor !== "object") {
            return undefined;
        }
        const node = (cursor as Record<string, unknown>)[parts[i]];
        if (i === parts.length - 1) {
            return node;
        }
        cursor = nestedKeysOf(node) ?? node;
    }
    return undefined;
}

/** Same path walk as view-engine `hasAccessPath`. `true` grants every path. */
export function accessFieldPathExists(tree: unknown, path: string): boolean {
    if (!tree || !path) {
        return false;
    }
    if (typeof tree !== "object") {
        return tree === true;
    }
    // A flat key containing dots (`"country.name": {}`) wins over the nested walk.
    const flat = (tree as Record<string, unknown>)[path];
    if (flat !== undefined) {
        return !!flat;
    }
    return !!getAccessSubtree(tree, path);
}

function deepCloneAccessFields(tree: unknown): AccessFieldNode {
    if (!isPlainObject(tree)) {
        return {};
    }
    const out: AccessFieldNode = {};
    for (const [key, value] of Object.entries(tree)) {
        out[key] = isPlainObject(value) && "keys" in value ? {keys: deepCloneAccessFields(value.keys)} : {};
    }
    return out;
}

/** Remove a dotted path; parents left without children are removed too. */
function removeAccessFieldPath(tree: AccessFieldNode, path: string): AccessFieldNode {
    const [head, ...rest] = path.split(".");
    if (!Object.hasOwn(tree, head)) {
        return tree;
    }
    const next = {...tree};
    if (rest.length === 0) {
        delete next[head];
        return next;
    }
    const childKeys = removeAccessFieldPath((nestedKeysOf(tree[head]) as AccessFieldNode | undefined) ?? {}, rest.join("."));
    if (Object.keys(childKeys).length === 0) {
        delete next[head];
    } else {
        next[head] = {keys: childKeys};
    }
    return next;
}

/** Add a dotted path, creating parents; the leaf copies its sub-map from `leafFromBase` when that has one. */
function grantAccessFieldPath(tree: AccessFieldNode, path: string, leafFromBase?: unknown): AccessFieldNode {
    const leaf: AccessFieldNode[string] =
        isPlainObject(leafFromBase) && "keys" in leafFromBase
            ? {keys: deepCloneAccessFields(leafFromBase.keys)}
            : {};

    const apply = (node: AccessFieldNode, [head, ...rest]: string[]): AccessFieldNode => {
        if (rest.length === 0) {
            return node[head] ? node : {...node, [head]: leaf};
        }
        const keys = (nestedKeysOf(node[head]) as AccessFieldNode | undefined) ?? {};
        return {...node, [head]: {keys: apply(keys, rest)}};
    };
    return apply(tree, path.split("."));
}

const pathDepth = (path: string) => path.split(".").length;

/** Apply a master switch and/or per-field overrides to a read/write map. Never mutates `base`. */
export function applyFieldMapOverride(
    base: unknown,
    master: boolean | undefined,
    fieldOverrides?: Record<string, boolean>,
): unknown {
    if (master === false) {
        return false;
    }
    if (master === true) {
        return isPlainObject(base) ? base : true;
    }
    // `true` has no field list to edit: a field grant is already covered, and removing
    // one field can't be expressed, so treating it as a narrower map would deny everything else.
    if (!fieldOverrides || Object.keys(fieldOverrides).length === 0 || base === true) {
        return base;
    }

    const entries = Object.entries(fieldOverrides);
    // Denies first (deepest first), then grants (shallowest first so parents exist).
    const denies = entries.filter(([, enabled]) => !enabled).sort(([a], [b]) => pathDepth(b) - pathDepth(a));
    const grants = entries.filter(([, enabled]) => enabled).sort(([a], [b]) => pathDepth(a) - pathDepth(b));

    let tree = deepCloneAccessFields(base);
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

/** Layer a debug override on top of a real access object. Returns `base` itself when there is nothing to apply. */
export function mergeAccessOverride(base: AccessObject, override?: AccessPermissionOverride): AccessObject {
    if (!override) {
        return base;
    }
    const next: AccessObject = {...base};
    for (const flag of ACCESS_FLAGS) {
        if (override[flag] !== undefined) {
            next[flag] = override[flag];
        }
    }
    if (override.read !== undefined || override.readFields) {
        next.read = applyFieldMapOverride(base.read, override.read, override.readFields);
    }
    if (override.write !== undefined || override.writeFields) {
        next.write = applyFieldMapOverride(base.write, override.write, override.writeFields);
    }
    return next;
}

// ---------------------------------------------------------------------------
// Hooks & provider
// ---------------------------------------------------------------------------

/** Full access map from the nearest `AccessProvider` (real server values, no debug overrides). */
export function useAccessMap(): AccessContextValue {
    return useContext(AccessContext);
}

/**
 * Whether the access map has been fetched. `null` outside `AccessProvider`.
 * Empty `read` before this is true is "not loaded yet", not Forbidden.
 */
export function useAccessHydrated(): boolean | null {
    return useContext(AccessHydrationContext);
}

/** Debug override state used by `withDebug` permission toggles. Null outside `AccessProvider`. */
export function useAccessDebugOverrides(): AccessDebugOverrideContextValue | null {
    return useContext(AccessDebugOverrideContext);
}

/**
 * Loads all model access flags once (POST `/api/user/permissions/access/all`, empty body).
 * Shows the setup step, starts the fetch, and immediately continues.
 * Provides data via `useAccess(resourceId)` as the response arrives.
 */
export function AccessProvider({
    children,
    setupStep = 2,
    setupTotal = SESSION_SETUP_TOTAL_STEPS,
}: {
    children: ReactNode;
    setupStep?: number;
    setupTotal?: number;
}) {
    const authToken = useSelector((state: RootState) => state.authentication.token);
    const [accessMap, setAccessMap] = useState<AccessContextValue>({});
    const [isHydrated, setIsHydrated] = useState(false);
    const [showSetup, setShowSetup] = useState(true);
    const [accessOverrides, setAccessOverrides] = useState<AccessDebugOverrides>({});
    const handleError = useErrorHandler({context: "AccessProvider"});
    const accessDebugOverrideValue = useMemo(
        () => ({overrides: accessOverrides, setOverrides: setAccessOverrides}),
        [accessOverrides],
    );

    useEffect(() => {
        setShowSetup(false);
    }, []);

    useEffect(() => {
        if (!authToken) {
            setAccessMap({});
            setIsHydrated(false);
            return;
        }

        const abortController = new AbortController();
        apiClient
            .post<AccessAllFormResponseType>(
                `/api/user/permissions/access/all`,
                {},
                {
                    signal: abortController.signal,
                    headers: {
                        "Cache-Control": "no-store",
                        Pragma: "no-cache",
                    },
                }
            )
            .then((response) => {
                if (abortController.signal.aborted) return;
                setAccessMap(accessAllResponseToContext(response.data));
                setIsHydrated(true);
            })
            .catch((e: unknown) => {
                if (abortController.signal.aborted) return;
                handleError(e);
            });

        return () => abortController.abort();
    }, [authToken, handleError]);

    if (showSetup) {
        return (
            <SessionSetupScreen
                step={setupStep}
                total={setupTotal}
                phase="access"
                error={false}
                onRetry={() => {}}
            />
        );
    }

    return (
        <AccessHydrationContext.Provider value={isHydrated}>
            <AccessContext.Provider value={accessMap}>
                <AccessDebugOverrideContext.Provider value={accessDebugOverrideValue}>
                    {children}
                </AccessDebugOverrideContext.Provider>
            </AccessContext.Provider>
        </AccessHydrationContext.Provider>
    );
}
