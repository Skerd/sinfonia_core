import {createElement, type ReactNode} from "react";
import type {FieldBinding} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {SheetFieldRenderer} from "@coreModule/clients/panel/moduleContributions/widgetContribution.types.ts";
import {resolvePath} from "../../engine/refs.ts";
import type {ViewRendererContext, WidgetProps} from "../../engine/types.ts";
import {wpCount, wpRecord, wpText, wpToken} from "../../engine/widgetProps.ts";
import {getReferencesDefaultItemProp, resolveWidget} from "../../widgetRegistry.ts";
import {useReferencesViewModeOptional} from "../widgets/references/referencesViewModeContext.tsx";
import SheetPaginatedReferenceCardList, {type ReferenceStub} from "../widgets/references/sheetPaginatedReferenceCardList.tsx";
import type {ReferenceCompactRowConfig} from "../widgets/references/referenceStubCompactRow.tsx";

/**
 * Resolves which card widget and prop name to use for `#ReferencesRender`.
 * Prefers `cardWidget` + optional `itemDataProp`; falls back to legacy `referenceKind`.
 * Module contributions register default prop names via `referencesDefaultItemProps`.
 */
export function resolveReferencesCardBinding(wp: WidgetProps): {cardToken: string; itemDataProp: string} {
    const cardToken = wpToken(wp, "cardWidget");
    if (cardToken) {
        return {
            cardToken,
            itemDataProp: wpText(wp, "itemDataProp") ?? getReferencesDefaultItemProp(cardToken) ?? "item",
        };
    }
    return wp.referenceKind === "modificationRequest"
        ? {cardToken: "#ModificationRequestCard", itemDataProp: "request"}
        : {cardToken: "#InspectionCard", itemDataProp: "inspection"};
}

const hasStringId = (x: unknown): x is ReferenceStub =>
    x != null && typeof x === "object" && typeof (x as {_id?: unknown})._id === "string";

/** Stubs at `field.name`: objects with an `_id`, or an unpopulated id string (unit `sale` / `reservation`). */
function referenceStubs(raw: unknown): ReferenceStub[] {
    if (Array.isArray(raw)) return raw.filter(hasStringId);
    if (hasStringId(raw)) return [raw];
    if (typeof raw === "string" && raw.trim().length > 0) return [{_id: raw}];
    return [];
}

/** Unit id / name for the cards: explicit ctx override, then `data.unit`, then the row itself. */
function unitContext(ctx: ViewRendererContext, data: Record<string, any>): {unitId: string; unitName: string} {
    const refCtx = ctx.referenceCardUnitContext;
    const unit = data.unit;
    const firstText = (...values: unknown[]) => values.find((v): v is string => typeof v === "string" && v.length > 0);
    const unitId = firstText(refCtx?.unitId, unit?._id, data._id) ?? "";
    const unitName = firstText(refCtx?.unitName, unit?.name, unit?.unitNumber, data.name, data.unitNumber) ?? unitId;
    return {unitId, unitName};
}

function ReferencesRenderHost({binding, ctx}: {binding: FieldBinding; ctx: ViewRendererContext}): ReactNode {
    const viewMode = useReferencesViewModeOptional()?.mode ?? "cards";
    const {data} = ctx;
    if (!data) return null;

    const wp = binding.widgetProps ?? {};
    const {cardToken, itemDataProp} = resolveReferencesCardBinding(wp);
    const Card = resolveWidget(cardToken);
    if (!Card) {
        console.warn(`[ViewRenderer] Unknown references card widget: ${cardToken}`);
        return null;
    }

    const compactRow = wpRecord<ReferenceCompactRowConfig>(wp, "compactRow");
    const displayMode = viewMode === "compact" && compactRow ? "compact" : "cards";

    return createElement(SheetPaginatedReferenceCardList, {
        Card,
        itemDataProp,
        items: referenceStubs(resolvePath(data, binding.name)),
        ...unitContext(ctx, data),
        pageSize: wpCount(wp, "pageSize"),
        cardProps: wpRecord(wp, "cardProps"),
        hideActions: wp.hideActions === true,
        listClassName: wpText(wp, "listClassName"),
        displayMode,
        compactRow: displayMode === "compact" ? compactRow : undefined,
        sheetLanguageKey: ctx.resolveLanguageKey,
    });
}

export const referencesRenderer: SheetFieldRenderer = ({binding, ctx, index}) =>
    createElement(ReferencesRenderHost, {key: index, binding, ctx});
