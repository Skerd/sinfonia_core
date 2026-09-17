import type {ComponentType, ReactNode} from "react";
import type {FieldBinding, ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {ViewRendererContext} from "@baseModule/components/viewEngine/viewRendererHelpers.ts";
import type {WidgetMeta} from "@baseModule/components/viewEngine/widgetMeta.ts";
import type {CompoundFormWidgetRenderer} from "@baseModule/components/viewEngine/form/types.ts";

export type {CompoundFormWidgetArgs, CompoundFormWidgetRenderer, FormWidgetExtra} from "@baseModule/components/viewEngine/form/types.ts";

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
 * Return `undefined` to fall through to ViewRenderer’s generic/`#DisplayCard` paths.
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
     * Token → design-time description (which view modes it suits, whether it renders
     * children, which props it reads). Purely additive: consumed by developer tooling
     * such as the Studio's palette, props editor and lint, never by the renderer. A
     * widget without an entry is treated as unconstrained, not invalid.
     */
    widgetMeta?: Record<string, WidgetMeta>;
    /**
     * Default prop name for `#ReferencesRender` when `itemDataProp` is omitted
     * (e.g. `#UnitCard` → `"unit"`).
     */
    referencesDefaultItemProps?: Record<string, string>;
    /** Token → custom sheet field branch (replaces hard-coded ViewRenderer cases). */
    sheetFieldRenderers?: Record<string, SheetFieldRenderer>;
    /**
     * Form tokens that own their own `FormField` (must not be wrapped again) and take the
     * default compound props (`name`, `label`, `placeholder`, … then `widgetProps`).
     * Tokens listed in {@link compoundFormWidgetRenderers} need not be repeated here.
     */
    compoundFormWidgets?: string[];
    /** Compound form tokens with their own binding → props mapping. Each token is compound. */
    compoundFormWidgetRenderers?: Record<string, CompoundFormWidgetRenderer>;
    /**
     * Edit-form write gate: token → the write-access key that decides whether the widget
     * renders, for compound widgets whose field name is not a real schema path
     * (e.g. `#FormFloorPolygon` → `polygonCoordinates`).
     */
    formWriteAccessKeys?: Record<string, string>;
    /**
     * Widget / linked-sheet tokens → audit `singlePost` hints.
     * Read by the audit drawer (`viewEngine/audit/auditFieldHints.ts`).
     */
    auditSinglePostHints?: Record<string, AuditSinglePostHint>;
};
