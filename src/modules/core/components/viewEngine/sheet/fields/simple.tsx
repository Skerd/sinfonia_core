import {createElement, type ReactNode} from "react";
import type {SheetFieldRenderer} from "@coreModule/helpers/types/widgetContribution.types.ts";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import {resolvePath} from "../../engine/refs.ts";
import type {WidgetProps} from "../../engine/types.ts";
import {omitProps, wpText} from "../../engine/widgetProps.ts";

/** `Q: …\nA: …` blocks from `[{question, answer}]`, or `null` when every entry is empty. */
function faqText(entries: {question?: unknown; answer?: unknown}[]): string | null {
    const blocks = entries
        .map((entry) => {
            const q = String(entry.question ?? "").trim();
            const a = String(entry.answer ?? "").trim();
            return [q && `Q: ${q}`, a && `A: ${a}`].filter(Boolean).join("\n");
        })
        .filter((block) => block.length > 0);
    return blocks.length > 0 ? blocks.join("\n\n") : null;
}

/** The text an `#ExpandableText` shows for a raw field value. */
function expandableText(value: unknown, wp: WidgetProps): ReactNode {
    if (wp.valueType === "faqBlock" && Array.isArray(value) && value.length > 0) {
        return faqText(value);
    }
    if (Array.isArray(value) && value.length > 0 && value.every((x) => typeof x === "string")) {
        return value.map((line) => `• ${line}`).join("\n");
    }
    if (wp.format === "json" && value != null && typeof value === "object") {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return null;
        }
    }
    return value as ReactNode;
}

const expandable: SheetFieldRenderer = ({binding, ctx, index, Component}) => {
    if (!Component) return null;
    const wp = binding.widgetProps ?? {};
    const value = ctx.data ? resolvePath(ctx.data, binding.name) : null;
    return createElement(
        Component,
        {...omitProps(wp, "valueType", "format"), key: index, show: true},
        expandableText(value, wp),
    );
};

/** `widgetProps.addressField` (default `address`); `"."` means the row itself carries lat/lng. */
const locationMap: SheetFieldRenderer = ({binding, ctx, index, Component}) => {
    if (!Component || !ctx.data) return null;
    const wp = binding.widgetProps ?? {};
    const addressField = wp.addressField ?? "address";
    const address = addressField === "." ? ctx.data : resolvePath(ctx.data, addressField);
    if (!address) return null;
    return createElement(Component, {...wp, key: index, address});
};

/** The ISO code from the field, else `widgetProps.code`. */
const countryFlag: SheetFieldRenderer = ({binding, ctx, index, Component}) => {
    if (!Component) return null;
    const wp = binding.widgetProps ?? {};
    const fromField = ctx.data ? resolvePath(ctx.data, binding.name) : undefined;
    const code = (typeof fromField === "string" && fromField) || wpText(wp, "code");
    if (!code) return createElement(ValueNotSet, {key: index});
    return createElement(Component, {...wp, key: index, code});
};

/** A fixed `widgetProps.children` label wins over the field's scalar value. */
const badge: SheetFieldRenderer = ({binding, ctx, index, Component}) => {
    if (!Component) return null;
    const wp = binding.widgetProps ?? {};
    const raw = ctx.data ? resolvePath(ctx.data, binding.name) : undefined;
    const fromField = raw != null && raw !== "" && typeof raw !== "object" ? String(raw) : "";
    const label = (typeof wp.children === "string" ? wp.children : "") || fromField;
    if (!label) return createElement(ValueNotSet, {key: index});
    return createElement(Component, {...omitProps(wp, "children"), key: index}, label);
};

/** Rows `{dayOfWeek, startTime, endTime}` at `field.name`; `widgetProps.placePath` names a row field shown beside its hours,
 * `widgetProps.closedKey` the sheet language key for a day without hours (default `closed`). */
const weeklyHours: SheetFieldRenderer = ({binding, ctx, index, Component}) => {
    if (!Component || !ctx.data) return null;
    const wp = binding.widgetProps ?? {};
    const raw = resolvePath(ctx.data, binding.name);
    const placePath = wpText(wp, "placePath");
    const rows = (Array.isArray(raw) ? raw : [])
        .filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
        .filter((row) => typeof row.dayOfWeek === "number" && typeof row.startTime === "string" && typeof row.endTime === "string")
        .map((row) => {
            const place = placePath ? resolvePath(row, placePath) : undefined;
            return {dayOfWeek: row.dayOfWeek, startTime: row.startTime, endTime: row.endTime, place: typeof place === "string" ? place : undefined};
        });
    return createElement(Component, {key: index, rows, closedLabel: String(ctx.resolveLanguageKey(wpText(wp, "closedKey") ?? "closed"))});
};

export const simpleRenderers: Record<string, SheetFieldRenderer> = {
    "#WeeklyHours": weeklyHours,
    "#ExpandableText": expandable,
    "#SheetLocationMap": locationMap,
    "#CountryFlag": countryFlag,
    "#Badge": badge,
};
