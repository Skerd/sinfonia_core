import {createElement} from "react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {resolveIcon} from "../registry/icons.ts";
import {resolveWidget} from "../widgetRegistry.ts";
import {ENGINE_NODE_PROPS} from "./nodeGates.ts";
import type {ViewRendererContext, WidgetProps} from "./types.ts";
import {omitProps, wpText, wpToken} from "./widgetProps.ts";

type PropsTransform = (props: WidgetProps, ctx: ViewRendererContext) => WidgetProps;

const translate = (key: string) => (props: WidgetProps, ctx: ViewRendererContext): WidgetProps =>
    props[key] ? {...props, [key]: ctx.resolveLanguageKey(props[key])} : props;

/**
 * `#SheetGroup` persists its collapse state under the raw title key (stable across locales),
 * namespaced by the sheet model. An explicit `collapseKey` / `collapseStorageKey` wins.
 * `titleIcon` and `titleActions` tokens become elements; unknown tokens are dropped.
 */
const sheetGroup: PropsTransform = (props, ctx) => {
    const out = omitProps(props, "collapseKey");

    const title = wpText(props, "title");
    const storageKey =
        wpText(props, "collapseKey") ??
        wpText(props, "collapseStorageKey") ??
        (title && ctx.sheetModel ? `${ctx.sheetModel}:${title}` : title);
    if (storageKey) out.collapseStorageKey = storageKey;
    if (props.title) out.title = ctx.resolveLanguageKey(props.title);

    const iconToken = wpText(props, "titleIcon");
    if (iconToken) {
        const Icon = resolveIcon(iconToken);
        delete out.titleIcon;
        delete out.titleIconClassName;
        if (Icon) {
            out.titleIcon = createElement(Icon, {className: cn("size-5 shrink-0", wpText(props, "titleIconClassName"))});
        }
    }

    const actionsToken = wpToken(props, "titleActions");
    if (actionsToken) {
        const Actions = resolveWidget(actionsToken);
        if (Actions) {
            out.titleActions = createElement(Actions, {
                key: "sheet-group-title-actions",
                ...(actionsToken === "#ReferencesViewModeToggle" ? {sheetLanguageKey: ctx.resolveLanguageKey} : {}),
            });
        } else {
            delete out.titleActions;
        }
    }
    return out;
};

/** Registry tokens whose `node.props` the engine rewrites before rendering. */
const CONTAINER_PROPS: Record<string, PropsTransform> = {
    "#SheetGroup": sheetGroup,
    "#TitleWithCollapse": translate("title"),
    "#FormAlert": (props, ctx) => (typeof props.message === "string" ? translate("message")(props, ctx) : props),
};

/** `node.props` as the registered component should receive them. */
export function resolveContainerProps(token: string, props: WidgetProps | undefined, ctx: ViewRendererContext): WidgetProps {
    const base = props ?? {};
    const transform = Object.hasOwn(CONTAINER_PROPS, token) ? CONTAINER_PROPS[token] : undefined;
    return transform ? transform(base, ctx) : {...base};
}

/** `node.props` for a plain DOM element, without the engine's own keys. */
export function domProps(props: WidgetProps | undefined): WidgetProps {
    return omitProps(props ?? {}, ...ENGINE_NODE_PROPS);
}
