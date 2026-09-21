import type {ReactNode} from "react";
import type {FieldBinding, ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";

/** Access maps as the server sends them: `{field: true, ref: {keys: {name: true}}}`. */
export type AccessMap = Record<string, any>;

/** Loose bag from `field.widgetProps` / `node.props`; read it through `engine/widgetProps.ts`. */
export type WidgetProps = Record<string, any>;

export type ViewRendererContext = {
    data?: Record<string, any>;
    resolveLanguageKey: ResolveLanguageKey;
    access?: AccessMap;
    /** Per-field write permissions (edit forms). Nodes with permissions.write are hidden when the key is absent. */
    writeAccess?: AccessMap;
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
     * so the parent document and DisplayCard re-render from `data` consistently.
     */
    unlinkEmbeddedRefPath?: (dotPath: string) => void;
    /**
     * Removes one element from an embedded ref array (dot path to the array, e.g. `constructors`) after
     * a linked entity delete from a list row’s nested sheet.
     */
    unlinkEmbeddedListRefItem?: (listPath: string, index: number) => void;
};
