import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {ViewNode, FieldBinding} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {ReactNode} from "react";

export type ViewRendererContext = {
    data?: Record<string, any>;
    resolveLanguageKey: ResolveLanguageKey;
    access?: Record<string, any>;
    /** Per-field write permissions (edit forms). Nodes with permissions.write are hidden when the key is absent. */
    writeAccess?: Record<string, any>;
    mode: "sheet" | "form";
    /**
     * Sheet entity model (`ViewConfig.model`), used to namespace `#SheetGroup` collapse
     * localStorage keys so the same section title stays independent across entity types.
     */
    sheetModel?: string;
    renderField?: (node: ViewNode, binding: FieldBinding, index: number) => ReactNode;
    /** Form submit / busy state (create & edit). */
    formLoading?: boolean;
    /** Edit form: initial entity load (e.g. PATCH form fetching record). */
    formLoadingData?: boolean;
    /**
     * Opaque extras for registered form widgets (e.g. label refs, route-derived `projectId`).
     * Not used by generic `#Field` nodes.
     */
    formExtras?: Record<string, unknown>;
    /** Overrides unit context for `#ReferencesRender` when sheet entity is not a unit (e.g. inspection). */
    referenceCardUnitContext?: {unitId: string; unitName: string};
    /**
     * Clears an embedded ref field on the sheet row (dot path, e.g. `project`) after linked entity delete,
     * so the parent document and SmallInfoCard re-render from `data` consistently.
     */
    unlinkEmbeddedRefPath?: (dotPath: string) => void;
    /**
     * Removes one element from an embedded ref array (dot path to the array, e.g. `constructors`) after
     * a linked entity delete from a list row’s nested sheet.
     */
    unlinkEmbeddedListRefItem?: (listPath: string, index: number) => void;
};

export function hasAccessPath(access: Record<string, any> | undefined, path: string | undefined): boolean {
    if (!access || !path) return true;
    if (access[path] !== undefined) return !!access[path];

    const parts = path.split(".");
    let cursor: any = access;

    for (let i = 0; i < parts.length; i++) {
        if (!cursor || typeof cursor !== "object") return false;
        const next = cursor[parts[i]];
        if (i === parts.length - 1) return !!next;
        cursor = next?.keys ?? next;
    }
    return false;
}

export type SmallInfoCardAccessSpec = {
    /** Access paths for the *value* being rendered (not card chrome). */
    paths: string[];
    /** `any` = at least one path; `all` = every path. */
    mode: "any" | "all";
};

/**
 * Paths that gate the SmallInfoCard *value* (HiddenElement `show`), derived from what
 * is rendered — not from `permissions.read` (that only hides/shows the whole card):
 * - `field.name` like `country.name`
 * - `parent` + `valuePath` joins (e.g. createdBy name+surname)
 *
 * Card visibility stays on explicit `node.permissions` in the sheet renderer.
 */
export function resolveSmallInfoCardValueAccessSpec(
    binding: FieldBinding | undefined,
): SmallInfoCardAccessSpec | null {
    const wp = binding?.widgetProps ?? {};
    const parent = typeof wp.parent === "string" && wp.parent.length > 0 ? wp.parent : undefined;
    const valuePath = Array.isArray(wp.valuePath)
        ? (wp.valuePath as unknown[]).filter((p): p is string => typeof p === "string" && p.length > 0)
        : [];

    if (parent && valuePath.length > 0) {
        return {
            paths: valuePath.map((p) => `${parent}.${p}`),
            mode: "any",
        };
    }

    const fieldName = typeof binding?.name === "string" ? binding.name : undefined;
    if (fieldName) {
        return {paths: [fieldName], mode: "all"};
    }

    return null;
}

/** True when the user may see the rendered value (vs locked HiddenElement). */
export function hasSmallInfoCardValueAccess(
    access: Record<string, any> | undefined,
    binding: FieldBinding | undefined,
): boolean {
    const spec = resolveSmallInfoCardValueAccessSpec(binding);
    if (!spec || spec.paths.length === 0) return true;
    if (!access) return true;
    if (spec.mode === "any") {
        return spec.paths.some((p) => hasAccessPath(access, p));
    }
    return spec.paths.every((p) => hasAccessPath(access, p));
}

/** Keep only `valuePath` segments the user can read under `parent`. */
export function filterAccessibleValuePath(
    access: Record<string, any> | undefined,
    parent: string,
    valuePath: string[],
): string[] {
    if (!access) return valuePath;
    return valuePath.filter((p) => hasAccessPath(access, `${parent}.${p}`));
}

export function resolvePath(obj: Record<string, any>, path: string): any {
    return path.split(".").reduce<any>((acc, key) => acc?.[key], obj);
}

/**
 * Unit `sale` / `reservation` may be a populated subdocument or a raw ObjectId string.
 * `resolvePath(data, "reservation._id")` is wrong for the string case (no `_id` on a primitive).
 */
export function normalizeObjectIdRef<T extends {_id: string}>(
    raw: unknown,
): {stub: T; fetchId: string | undefined} | null {
    if (raw == null || raw === "") return null;
    if (typeof raw === "string") {
        return {stub: {_id: raw} as T, fetchId: raw};
    }
    if (typeof raw === "object") {
        const _id = (raw as {_id?: unknown})._id;
        if (_id != null && _id !== "") {
            const fetchId = typeof _id === "string" ? _id : String(_id);
            return {stub: raw as T, fetchId};
        }
        return {stub: raw as T, fetchId: undefined};
    }
    return null;
}
