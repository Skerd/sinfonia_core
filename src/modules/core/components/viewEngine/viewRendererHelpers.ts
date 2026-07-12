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
