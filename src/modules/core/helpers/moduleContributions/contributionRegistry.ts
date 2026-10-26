/**
 * Shared plumbing for the `clients/panel/*Contribution` attach files.
 *
 * Every loader in this folder follows the same contract:
 * - The default export is one contribution, an array of them, or `null`/`undefined` (nothing).
 * - Entries are validated when first read; a malformed file fails loudly with its path.
 * - Entries are ordered by `order` (default {@link DEFAULT_CONTRIBUTION_ORDER}), then `id`, then
 *   file path, so the result never depends on glob iteration order.
 * - Entries of modules the signed-in company does not have are left out (unless the kind opts
 *   out with `companyScoped: false`), so menus, routes and settings follow the company's modules.
 */

import {
    getCompanyModulesVersion,
    isModuleActive,
    moduleNameFromModulePath,
} from "@coreModule/helpers/modules/enabledModules.ts";

export const DEFAULT_CONTRIBUTION_ORDER = 100;

/** Fields every contribution kind shares. */
export type ContributionBase = {
    id?: string;
    order?: number;
};

/** Raw `import.meta.glob(…, {eager: true})` result: file path → module namespace. */
export type ContributionGlob = Record<string, unknown>;

export function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

export function isOptionalFunction(value: unknown): boolean {
    return value === undefined || typeof value === "function";
}

/** Function components, and the object forms React produces (`memo`, `forwardRef`, `lazy`). */
export function isComponentLike(value: unknown): boolean {
    return typeof value === "function"
        || (typeof value === "object" && value !== null && "$$typeof" in value);
}

/** `undefined`, or a plain object whose every value passes `isValue`. */
export function isOptionalRecordOf(value: unknown, isValue: (v: unknown) => boolean): boolean {
    return value === undefined || (isPlainObject(value) && Object.values(value).every(isValue));
}

export const isString = (value: unknown): value is string => typeof value === "string";
export const isFunction = (value: unknown): boolean => typeof value === "function";

function isContributionBase(value: unknown): value is ContributionBase & Record<string, unknown> {
    return isPlainObject(value)
        && (value.id === undefined || typeof value.id === "string")
        && (value.order === undefined || (typeof value.order === "number" && Number.isFinite(value.order)));
}

const warned = new Set<string>();

/** Dev-only warning, printed once per distinct message. */
export function warnContribution(message: string): void {
    if (!import.meta.env.DEV || warned.has(message)) {
        return;
    }
    warned.add(message);
    console.warn(message);
}

/** Test hook: lets repeated warnings be observed again. */
export function resetContributionWarnings(): void {
    warned.clear();
}

/** Source path of every accepted entry, for error messages that name the offending file. */
const sourcePaths = new WeakMap<object, string>();

/** `id`, else the file the entry came from, else a placeholder. */
export function describeContribution(entry: ContributionBase): string {
    return entry.id ?? sourcePaths.get(entry) ?? "(anonymous)";
}

const compareStrings = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export type ContributionListOptions = {
    /** File kind, used as the prefix of every message (e.g. `sidebarContribution`). */
    kind: string;
    glob: ContributionGlob;
    /** Kind-specific shape check; `id` / `order` are already validated. */
    isValid: (entry: Record<string, unknown>) => boolean;
    /** `false` keeps every built module's entries (kinds used before sign-in or by shared rendering). */
    companyScoped?: boolean;
};

/**
 * Returns a lazy, memoized reader of the sorted, validated contributions in `glob`.
 * Parsing is deferred to the first call so eager-glob import cycles have settled by then.
 * The reader returns a new array only when the company's modules change, so callers can
 * memoize derived values on its identity.
 */
export function createContributionList<T extends ContributionBase>({
    kind,
    glob,
    isValid,
    companyScoped = true,
}: ContributionListOptions): () => readonly T[] {
    let cached: readonly T[] | undefined;
    let active: {version: number; entries: readonly T[]} | undefined;

    const build = (): readonly T[] => {
        const entries: {entry: T; path: string; index: number}[] = [];
        for (const [path, mod] of Object.entries(glob)) {
            const exported = (mod as {default?: unknown} | null | undefined)?.default;
            if (exported == null) {
                continue;
            }
            const isArray = Array.isArray(exported);
            if (!isArray && !isPlainObject(exported)) {
                throw new Error(`[${kind}] Invalid default export in ${path}: expected a ${kind} or an array of them`);
            }
            const list: unknown[] = isArray ? exported : [exported];
            list.forEach((candidate, index) => {
                if (!isContributionBase(candidate) || !isValid(candidate)) {
                    throw new Error(isArray
                        ? `[${kind}] Invalid entry at ${path}[${index}]: expected a ${kind}`
                        : `[${kind}] Invalid default export in ${path}: expected a ${kind} or an array of them`);
                }
                sourcePaths.set(candidate, path);
                entries.push({entry: candidate as unknown as T, path, index});
            });
        }

        entries.sort((a, b) =>
            (a.entry.order ?? DEFAULT_CONTRIBUTION_ORDER) - (b.entry.order ?? DEFAULT_CONTRIBUTION_ORDER)
            || compareStrings(a.entry.id ?? "", b.entry.id ?? "")
            || compareStrings(a.path, b.path)
            || a.index - b.index);

        const seen = new Map<string, string>();
        for (const {entry, path} of entries) {
            if (entry.id === undefined) {
                continue;
            }
            const first = seen.get(entry.id);
            if (first !== undefined) {
                warnContribution(`[${kind}] Duplicate id "${entry.id}" in ${first} and ${path}`);
            } else {
                seen.set(entry.id, path);
            }
        }

        return Object.freeze(entries.map(({entry}) => entry));
    };

    return () => {
        const all = (cached ??= build());
        if (!companyScoped) {
            return all;
        }
        const version = getCompanyModulesVersion();
        if (active?.version !== version) {
            active = {
                version,
                entries: Object.freeze(all.filter((entry) => {
                    const moduleName = moduleNameFromModulePath(sourcePaths.get(entry) ?? "");
                    return moduleName === undefined || isModuleActive(moduleName);
                })),
            };
        }
        return active.entries;
    };
}

/** Memoizes `compute` on the identity of `list()`'s result (see `createContributionList`). */
export function memoizeOnList<T, R>(list: () => readonly T[], compute: (entries: readonly T[]) => R): () => R {
    let key: readonly T[] | undefined;
    let value: R;
    return () => {
        const entries = list();
        if (entries !== key) {
            key = entries;
            value = compute(entries);
        }
        return value;
    };
}

/**
 * Runs one module's hook so a throwing module cannot take down the shared UI it feeds.
 * The error is logged (in every environment) and `undefined` is returned instead.
 */
export function safeInvoke<R>(kind: string, entry: ContributionBase, fn: () => R): R | undefined {
    try {
        return fn();
    } catch (error) {
        console.error(`[${kind}] "${describeContribution(entry)}" threw; its contribution is skipped.`, error);
        return undefined;
    }
}

export type RecordSource<V> = {
    source: ContributionBase;
    record: Readonly<Record<string, V>> | undefined;
};

/**
 * Merges contributed key → value maps in order; later sources win. The result has no prototype,
 * so lookups of names like `constructor` or `toString` miss instead of hitting `Object.prototype`.
 * Keys in `reservedKeys` are dropped (they belong to core).
 */
export function mergeRecords<V>(
    kind: string,
    sources: readonly RecordSource<V>[],
    reservedKeys: ReadonlySet<string> = new Set(),
): Readonly<Record<string, V>> {
    const merged: Record<string, V> = Object.create(null);
    const owners = new Map<string, string>();
    for (const {source, record} of sources) {
        if (!record) {
            continue;
        }
        const owner = describeContribution(source);
        for (const [key, value] of Object.entries(record)) {
            if (reservedKeys.has(key)) {
                warnContribution(`[${kind}] "${owner}" cannot override the core key "${key}"; ignored.`);
                continue;
            }
            const previous = owners.get(key);
            if (previous !== undefined && previous !== owner) {
                warnContribution(`[${kind}] "${owner}" overrides key "${key}" from "${previous}".`);
            }
            owners.set(key, owner);
            merged[key] = value;
        }
    }
    return Object.freeze(merged);
}

/** `Object.hasOwn` lookup, for maps that may be plain objects. */
export function getOwn<V>(record: Readonly<Record<string, V>>, key: string): V | undefined {
    return Object.hasOwn(record, key) ? record[key] : undefined;
}
