import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {hasAccessPath, hasAnyAccessPath} from "./access.ts";
import {resolvePath} from "./refs.ts";
import type {AccessMap, ViewRendererContext} from "./types.ts";

/**
 * - `render`: render normally.
 * - `hide`: render nothing.
 * - `lock`: render a `#DisplayCard` with its value locked (sheet read gate, see below).
 */
export type NodeGateResult = "render" | "hide" | "lock";

/** `node.props` keys the engine reads itself; they are never forwarded to the DOM. */
export const ENGINE_NODE_PROPS = ["skipRenderWhenFormExtraTruthy", "skipRenderWhenFormExtraNotTruthy"] as const;

type Permissions = ViewNode["permissions"];

function skippedByFormExtras(node: ViewNode, formExtras: Record<string, unknown> | undefined): boolean {
    const whenTruthy = node.props?.skipRenderWhenFormExtraTruthy as string | undefined;
    if (whenTruthy && formExtras?.[whenTruthy]) return true;
    const whenNotTruthy = node.props?.skipRenderWhenFormExtraNotTruthy as string | undefined;
    return !!whenNotTruthy && !formExtras?.[whenNotTruthy];
}

function readDenied(permissions: Permissions, access: AccessMap): boolean {
    if (permissions?.readAny?.length) return !hasAnyAccessPath(access, permissions.readAny);
    return !!permissions?.read && !hasAccessPath(access, permissions.read);
}

function writeDenied(permissions: Permissions, writeAccess: AccessMap): boolean {
    if (permissions?.writeAny?.length) return !hasAnyAccessPath(writeAccess, permissions.writeAny);
    return !!permissions?.write && !hasAccessPath(writeAccess, permissions.write);
}

/** True when a `dependent` value should hide the subtree: empty, or an object of only null/empty-array values. */
export function dependentValueAbsent(value: unknown): boolean {
    if (value == null || value === false || value === "") return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value !== "object") return false;
    return Object.values(value).every((v) => v == null || (Array.isArray(v) && v.length === 0));
}

function dependentsMissing(node: ViewNode, data: Record<string, any>): boolean {
    if (node.dependentAny?.length) {
        return node.dependentAny.every((dep) => dependentValueAbsent(resolvePath(data, dep)));
    }
    return !!node.dependent && dependentValueAbsent(resolvePath(data, node.dependent));
}

/**
 * Every visibility rule a node goes through before it renders, in order.
 *
 * The sheet read gate mirrors maestro's `filterNodes`: a card the account cannot read
 * renders locked rather than vanishing, because a missing card says "no such data" when the
 * truth is "not yours to see". Anything else with no place to put a lock goes.
 */
export function evaluateNodeGates(node: ViewNode, ctx: ViewRendererContext): NodeGateResult {
    if (skippedByFormExtras(node, ctx.formExtras)) return "hide";

    let locked = false;
    if (ctx.mode === "sheet" && ctx.access && readDenied(node.permissions, ctx.access)) {
        if (node.render !== "#DisplayCard" || !node.field) return "hide";
        locked = true;
    }

    if (ctx.data && dependentsMissing(node, ctx.data)) return "hide";
    if (ctx.writeAccess && writeDenied(node.permissions, ctx.writeAccess)) return "hide";

    return locked ? "lock" : "render";
}

/**
 * Read gate for sheet field renderers. `ViewRenderer` has already applied it before a
 * renderer runs, so this only matters for callers outside the engine.
 */
export function sheetFieldVisible(
    node: {permissions?: Permissions},
    ctx: {access?: AccessMap},
): boolean {
    return !ctx.access || !readDenied(node.permissions, ctx.access);
}
