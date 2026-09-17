import {resolvePath} from "../../engine/refs.ts";
import type {WidgetProps} from "../../engine/types.ts";
import {wpRecord, wpString, wpText, wpToken} from "../../engine/widgetProps.ts";

export type LinkedSheetTarget = {
    model: string;
    widgetToken: string;
    entityProp: string;
    valueField: string | undefined;
};

/** Reads `linkedSheetModel` / `linkedSheetWidget` / `linkedSheetEntityProp` / `linkedSheetValueField` from one bag. */
export function linkedSheetTargetFrom(bag: WidgetProps): LinkedSheetTarget | null {
    const model = wpString(bag, "linkedSheetModel") ?? "";
    const widgetToken = wpToken(bag, "linkedSheetWidget") ?? "";
    if (!model || !widgetToken) return null;
    return {
        model,
        widgetToken,
        entityProp: wpText(bag, "linkedSheetEntityProp") ?? "project",
        valueField: wpString(bag, "linkedSheetValueField"),
    };
}

/**
 * Resolves a nested sheet target from either static `linkedSheetModel` / `linkedSheetWidget`
 * or polymorphic `linkedSheetByType` + `linkedSheetTypePath` (discriminator on `data`).
 *
 * Example:
 * ```
 * linkedRefPath: "sourceId",
 * linkedSheetTypePath: "sourceType",
 * linkedSheetByType: {
 *   productOrder: {
 *     linkedSheetModel: "productOrders",
 *     linkedSheetWidget: "#ProductOrderSheetView",
 *     linkedSheetEntityProp: "order",
 *   },
 * }
 * ```
 * Types missing from the map (e.g. `checkout` with no panel sheet) simply do not link.
 */
export function resolveLinkedSheetTarget(
    wp: WidgetProps,
    data: Record<string, any> | undefined,
): LinkedSheetTarget | null {
    const byType = wpRecord<Record<string, unknown>>(wp, "linkedSheetByType");
    if (!byType) return linkedSheetTargetFrom(wp);

    if (!data) return null;
    const typeValue = resolvePath(data, wpText(wp, "linkedSheetTypePath") ?? "sourceType");
    if (typeof typeValue !== "string" || typeValue.length === 0) return null;
    const entry = wpRecord<WidgetProps>(byType, typeValue);
    return entry ? linkedSheetTargetFrom(entry) : null;
}
