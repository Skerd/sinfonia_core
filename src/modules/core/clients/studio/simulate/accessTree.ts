/**
 * Narrowing the access maps the preview renders with.
 *
 * The config mirror in `filterNodesMirror.ts` reproduces what *maestro* does with an
 * allowlist. It is only half the story: the panel's own renderers read the account's access
 * map at render time — `EditFormViewRenderer` drops a field the account cannot write, and
 * `#DisplayCard` blurs a value the account cannot read — so a simulation that narrows the
 * config but hands the renderer the real map still shows the real account's screen.
 *
 * These helpers narrow the map itself, in the nested `{key: {keys: {…}}}` shape `useAccess`
 * returns and `collectAccessPaths` flattens.
 */

type AccessNode = {keys?: unknown} & Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

/**
 * Copies an access tree without the revoked paths, dropping each revoked path's subtree with
 * it — losing `address` loses `address.city`, exactly as an account that never had it.
 */
export function pruneAccessTree<T>(tree: T, revoked: ReadonlySet<string>, prefix = ""): T {
    if (!isRecord(tree) || revoked.size === 0) return tree;

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(tree)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (revoked.has(path)) continue;

        const nested = (value as AccessNode | null)?.keys;
        result[key] = isRecord(value)
            ? isRecord(nested)
                ? {...value, keys: pruneAccessTree(nested, revoked, path)}
                : value
            : value;
    }
    return result as T;
}
