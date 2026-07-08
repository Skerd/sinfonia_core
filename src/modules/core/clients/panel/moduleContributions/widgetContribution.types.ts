import type {ComponentType, ReactNode} from "react";
import type {FieldBinding, ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {ViewRendererContext} from "@coreModule/components/viewEngine/viewRendererHelpers.ts";

/**
 * Optional attach file: `src/modules/<pkg>/clients/panel/widgetContribution.ts(x)`.
 * Discovered via {@link applyWidgetContributions} (`import.meta.glob`).
 *
 * Modules register their SDUI widgets / sheet field special-cases here so core’s
 * `widgetRegistry` + `ViewRenderer` stay free of cross-module imports.
 */
export type SheetFieldRendererArgs = {
    node: ViewNode;
    binding: FieldBinding;
    ctx: ViewRendererContext;
    index: number;
    /** Resolved registry component for `binding.widget`, if any. */
    Component: ComponentType<any> | null;
};

/**
 * Custom sheet-mode renderer for a widget token.
 * Return `undefined` to fall through to ViewRenderer’s generic/`#SmallInfoCard` paths.
 * Return `null` to render nothing (handled / hidden).
 */
export type SheetFieldRenderer = (args: SheetFieldRendererArgs) => ReactNode | undefined;

/** `POST …/single` (+ label fields) used by audit / activity field hints. */
export type AuditSinglePostHint = {
    url: string;
    labelFields: string[];
};

export type WidgetContribution = {
    /** Stable id for debugging / ordering tie-breaks. */
    id?: string;
    /** Lower runs earlier; default 100. */
    order?: number;
    /** Token → React component (same keys as legacy `WIDGET_REGISTRY`). */
    widgets?: Record<string, ComponentType<any>>;
    /**
     * Default prop name for `#ReferencesRender` when `itemDataProp` is omitted
     * (e.g. `#UnitCard` → `"unit"`).
     */
    referencesDefaultItemProps?: Record<string, string>;
    /** Token → custom sheet field branch (replaces hard-coded ViewRenderer cases). */
    sheetFieldRenderers?: Record<string, SheetFieldRenderer>;
    /**
     * Widget / linked-sheet tokens → audit `singlePost` hints.
     * Merged into `collectFieldLabelsFromViewConfig` LOOKUPs.
     */
    auditSinglePostHints?: Record<string, AuditSinglePostHint>;
};
