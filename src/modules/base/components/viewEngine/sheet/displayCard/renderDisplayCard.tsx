import {createElement} from "react";
import type {SheetFieldRenderer} from "@coreModule/clients/panel/moduleContributions/widgetContribution.types.ts";
import {hasDisplayCardValueAccess} from "../../engine/access.ts";
import {wpNumber, wpText} from "../../engine/widgetProps.ts";
import {iconOrUndefined} from "../../registry/icons.ts";
import {renderSheetFieldToken} from "../fields/dispatch.ts";
import {resolveDisplayCardValue} from "./displayValue.tsx";
import {cardLinkedSheet, cardLinks, cardVariant, headerActions, iconSlot} from "./decorations.tsx";
import {renderLinkedRefCardList} from "./linkedRefCardList.tsx";

/**
 * `#DisplayCard`: one labelled value tile. A card whose value the account cannot read still
 * renders, locked, unless `widgetProps.show` forces the value through.
 */
export const displayCardRenderer: SheetFieldRenderer = (args) => {
    const {node, binding, ctx, index, Component: Card} = args;
    if (!Card) return null;
    const wp = binding.widgetProps ?? {};

    if (wp.valueType === "linkedObjectRefCardList") {
        return renderLinkedRefCardList(Card, binding, ctx, index);
    }

    const {value, type} = resolveDisplayCardValue(binding, ctx, (token) =>
        renderSheetFieldToken(token, {node, binding, ctx, index}),
    );

    const t = ctx.resolveLanguageKey;
    const label = binding.label ? String(t(binding.label)) : binding.name;
    const locked = binding.locked === true || !hasDisplayCardValueAccess(ctx.access, binding);
    const forceShow = wp.show === true;
    const {externalHref, internalHref} = cardLinks(wp, binding, ctx.data, value);

    return createElement(Card, {
        key: index,
        title: label,
        tooltip: wp.tooltip ? String(t(wp.tooltip)) : label,
        show: forceShow || !locked,
        locked: locked && !forceShow,
        path: binding.name,
        type,
        languageKeyCategory: wpText(wp, "languageKeyCategory"),
        size: wpNumber(wp, "size"),
        Icon: iconOrUndefined(wp.icon),
        ...iconSlot(wp, ctx, value, label),
        value,
        variant: cardVariant(wp, binding, ctx.data),
        dontRenderValue: !!wp.dontRenderValue || !!externalHref,
        externalHref,
        internalHref,
        linkedReferenceSheet: cardLinkedSheet(wp, ctx, value),
        expandable: wp.expandable === true,
        maxLength: wpNumber(wp, "maxLength"),
        headerActions: headerActions(wp, ctx),
    });
};
