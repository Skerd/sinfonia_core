import {createElement, type ComponentType, type ReactNode} from "react";
import type {FieldBinding} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {cn} from "@coreModule/components/lib/utils.ts";
import {bootstrapLinkedSheetData, normalizeObjectIdRef, resolvePath} from "../../engine/refs.ts";
import type {ViewRendererContext} from "../../engine/types.ts";
import {wpString, wpText} from "../../engine/widgetProps.ts";
import {iconOrUndefined} from "../../registry/icons.ts";
import {resolveWidget} from "../../widgetRegistry.ts";
import {linkedReferenceSheet, unitContextProps} from "../linkedSheet/linkedSheetHost.tsx";
import {linkedSheetTargetFrom} from "../linkedSheet/resolveLinkedSheetTarget.ts";

/**
 * `linkedRefListLayout` presets. Class names must appear as string literals in source so
 * Tailwind emits them; a raw `listClassName` from the server is not scanned and its
 * utilities may be missing from the CSS.
 */
const LIST_LAYOUTS: Record<string, string> = {
    /** 1 col → 2 (md) → 3 (lg) → 4 (xl). */
    responsive4: "grid w-full min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2",
    /** Fixed 4 columns. */
    grid4: "grid w-full min-w-0 grid-cols-4 gap-2",
};

/**
 * `valueType: "linkedObjectRefCardList"`: one `#DisplayCard` per ref in `field.name`, each
 * opening its entity in the configured linked sheet. Deleting from a nested sheet removes that
 * entry via `ctx.unlinkEmbeddedListRefItem(listPath, index)` (`linkedRefListPath`, default `field.name`).
 */
export function renderLinkedRefCardList(
    Card: ComponentType<any>,
    binding: FieldBinding,
    ctx: ViewRendererContext,
    index: number,
): ReactNode {
    const wp = binding.widgetProps ?? {};
    const target = linkedSheetTargetFrom(wp);
    if (!target || !resolveWidget(target.widgetToken)) {
        console.warn("[ViewRenderer] linkedObjectRefCardList requires linkedSheetModel and linkedSheetWidget");
        return null;
    }

    const t = ctx.resolveLanguageKey;
    const Icon = iconOrUndefined(wp.icon);
    const tooltip = (fallback: string) => (wp.tooltip ? String(t(wp.tooltip)) : fallback);
    const listPath = wpText(wp, "linkedRefListPath") ?? binding.name;
    const labelField = wpString(wp, "labelField") ?? "name";

    const rawList = ctx.data ? resolvePath(ctx.data, binding.name) : null;
    const cards: ReactNode[] = [];
    (Array.isArray(rawList) ? rawList : []).forEach((rawItem: unknown, rowIndex: number) => {
        const ref = normalizeObjectIdRef(rawItem);
        const stub = ref?.stub as Record<string, any> | undefined;
        const id = typeof stub?._id === "string" ? stub._id : undefined;
        if (!stub || !id) return;

        const label = resolvePath(stub, labelField);
        const title = label != null && label !== "" ? String(label) : typeof stub.name === "string" ? stub.name : id;

        cards.push(
            createElement(Card, {
                key: `${id}-${rowIndex}`,
                title,
                tooltip: tooltip(title),
                show: true,
                Icon,
                value: null,
                variant: wp.variant,
                dontRenderValue: true,
                linkedReferenceSheet: linkedReferenceSheet(target.model, {
                    widgetToken: target.widgetToken,
                    fetchId: id,
                    entityProp: target.entityProp,
                    entity: bootstrapLinkedSheetData(id, rawItem, title, target.valueField),
                    props: unitContextProps(ctx.referenceCardUnitContext),
                    onDelete: () => ctx.unlinkEmbeddedListRefItem?.(listPath, rowIndex),
                }),
            }),
        );
    });

    if (cards.length === 0) {
        const title = binding.label ? String(t(binding.label)) : binding.name;
        return createElement(Card, {
            key: index,
            title,
            tooltip: tooltip(title),
            show: true,
            Icon,
            value: null,
            variant: wp.variant,
            dontRenderValue: false,
        });
    }

    const preset = wpText(wp, "linkedRefListLayout");
    const layout =
        (preset && Object.hasOwn(LIST_LAYOUTS, preset) ? LIST_LAYOUTS[preset] : undefined) ??
        wpText(wp, "listClassName") ??
        "flex flex-col gap-2";
    return (
        <div key={index} className={cn(layout)}>
            {cards}
        </div>
    );
}
