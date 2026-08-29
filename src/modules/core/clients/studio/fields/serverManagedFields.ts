/**
 * Paths the server owns, which a form must never offer.
 *
 * All six come from Mongoose plugins in maestro, not from any model's own schema, and every
 * one of them is written by the server on save — a form input bound to one is at best ignored
 * and at worst overwritten on the next write:
 *
 *  - `lifeCyclePlugin`   → `createdAt`, `updatedAt`
 *  - `softDeletePlugin`  → `deletedAt`, `deletedBy`
 *  - `ownershipPlugin`   → `createdBy`, `company`
 *
 * `_id` and `__v` are Mongo's own and belong to the same class of thing.
 *
 * Sheets are deliberately unaffected: displaying these is exactly what maestro's shared
 * `lifecycleSheetGroup` does, and it is a legitimate section of a sheet.
 */

export const LIFECYCLE_FIELDS = ["createdAt", "updatedAt"] as const;
export const SOFT_DELETE_FIELDS = ["deletedAt", "deletedBy"] as const;
export const OWNERSHIP_FIELDS = ["createdBy", "company"] as const;
export const DOCUMENT_FIELDS = ["_id", "__v"] as const;

export const SERVER_MANAGED_FIELDS: ReadonlySet<string> = new Set([
    ...LIFECYCLE_FIELDS,
    ...SOFT_DELETE_FIELDS,
    ...OWNERSHIP_FIELDS,
    ...DOCUMENT_FIELDS,
]);

/**
 * Matches on the root segment, so the subtrees go with it: `createdBy.name` and
 * `company.address.city` are as server-managed as their roots.
 */
export function isServerManaged(path: string): boolean {
    const root = path.includes(".") ? path.slice(0, path.indexOf(".")) : path;
    return SERVER_MANAGED_FIELDS.has(root);
}

/** Drops server-managed paths from an allowlist before a form's panes read it. */
export function withoutServerManaged(paths: readonly string[]): string[] {
    return paths.filter((path) => !isServerManaged(path));
}
