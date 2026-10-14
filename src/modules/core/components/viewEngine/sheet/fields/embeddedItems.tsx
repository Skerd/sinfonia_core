import {createElement, type ReactNode} from "react";
import type {FieldBinding} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {SheetFieldRenderer} from "@coreModule/helpers/types/widgetContribution.types.ts";
import {resolvePath} from "../../engine/refs.ts";
import type {ViewRendererContext} from "../../engine/types.ts";
import {wpCount, wpString, wpText, wpTextList} from "../../engine/widgetProps.ts";
import {useReferencesViewModeOptional} from "../widgets/references/referencesViewModeContext.tsx";
import SheetEmbeddedItemsList, {type EmbeddedItemFieldConfig} from "../widgets/embeddedItems/sheetEmbeddedItemsList.tsx";

function SheetEmbeddedItemsListHost({binding, ctx}: {binding: FieldBinding; ctx: ViewRendererContext}): ReactNode {
    const displayMode = useReferencesViewModeOptional()?.mode ?? "cards";
    if (!ctx.data) return null;

    const wp = binding.widgetProps ?? {};
    const raw = resolvePath(ctx.data, binding.name);
    const cardColumns = wpCount(wp, "cardColumns", 2);
    const columns = wpCount(wp, "columns", 1);

    return createElement(SheetEmbeddedItemsList, {
        items: Array.isArray(raw) ? raw : [],
        fields: (wp.fields ?? []) as EmbeddedItemFieldConfig[],
        compactSummaryField: wpString(wp, "compactSummaryField"),
        compactSummaryFields: wpTextList(wp, "compactSummaryFields"),
        compactSummaryJoinSeparator: wpString(wp, "compactSummaryJoinSeparator"),
        displayMode,
        cardColumns: cardColumns === undefined ? undefined : Math.min(4, cardColumns),
        entityCards: wp.entityCards === true,
        columns: columns === undefined ? undefined : Math.min(4, columns),
        pageSize: wpCount(wp, "pageSize"),
        listClassName: wpText(wp, "listClassName"),
        className: wpText(wp, "className"),
        sortField: wpText(wp, "sortField"),
        sortDescending: wp.sortDescending !== false,
        access: ctx.access,
        listPath: binding.name,
        sheetLanguageKey: ctx.resolveLanguageKey,
    });
}

/** `#SheetEmbeddedItemsList`: also used as a `#DisplayCard` `bodyWidget`. */
export const embeddedItemsRenderer: SheetFieldRenderer = ({binding, ctx, index}) =>
    createElement(SheetEmbeddedItemsListHost, {key: index, binding, ctx});
