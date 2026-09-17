import {createElement, type ReactNode} from "react";
import type {FieldBinding, ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {domProps, resolveContainerProps} from "./engine/containerProps.ts";
import {evaluateNodeGates} from "./engine/nodeGates.ts";
import type {ViewRendererContext} from "./engine/types.ts";
import {renderSheetFieldToken} from "./sheet/fields/dispatch.ts";
import {resolveWidget} from "./widgetRegistry.ts";

export type {ViewRendererContext};

type ViewRendererProps = {
    nodes: ViewNode[];
    ctx: ViewRendererContext;
};

/**
 * Renders a server-driven view tree. Each node goes through the visibility gates
 * (`engine/nodeGates.ts`), then:
 * - a `field` node → the form's `renderField` (form mode) or a sheet field renderer (sheet mode);
 * - a `#Token` node → the registered component, with `node.props` resolved (`engine/containerProps.ts`);
 * - anything else → a plain DOM element.
 */
export default function ViewRenderer({nodes, ctx}: ViewRendererProps) {
    return <>{renderNodes(nodes, ctx)}</>;
}

function renderNodes(nodes: ViewNode[], ctx: ViewRendererContext): ReactNode[] {
    return nodes.map((node, i) => renderNode(node, ctx, i));
}

function renderNode(node: ViewNode, ctx: ViewRendererContext, index: number): ReactNode {
    const gate = evaluateNodeGates(node, ctx);
    if (gate === "hide") return null;

    if (node.field && ctx.mode === "form" && ctx.renderField) {
        return ctx.renderField(node, node.field, index);
    }
    if (node.field && ctx.mode === "sheet") {
        const binding = gate === "lock" ? {...node.field, locked: true} : node.field;
        return renderSheetField(node, binding, ctx, index);
    }

    const children = node.children ? renderNodes(node.children, ctx) : undefined;

    if (node.render.startsWith("#")) {
        const Component = resolveWidget(node.render);
        if (!Component) {
            console.warn(`[ViewRenderer] Unknown widget token: ${node.render}`);
            return null;
        }
        return createElement(Component, {...resolveContainerProps(node.render, node.props, ctx), key: index}, children);
    }

    return createElement(node.render, {key: index, ...domProps(node.props)}, children);
}

/** A module or core renderer for the widget, else the widget itself with its `widgetProps`. */
function renderSheetField(node: ViewNode, binding: FieldBinding, ctx: ViewRendererContext, index: number): ReactNode {
    const rendered = renderSheetFieldToken(binding.widget, {node, binding, ctx, index});
    if (rendered !== undefined) return rendered;
    const Component = resolveWidget(binding.widget);
    return Component ? createElement(Component, {...binding.widgetProps, key: index}) : null;
}
