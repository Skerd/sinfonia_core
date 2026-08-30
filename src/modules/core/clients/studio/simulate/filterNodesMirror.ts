import type {ViewConfig, ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";

/**
 * Client-side port of maestro's view-config prune.
 *
 * SOURCE OF TRUTH: `maestro/modules/core/api/auxiliary/private/viewConfigs.ts`
 * (`filterViewConfig` / `filterNodes` / `hasField`). This file exists only so the Studio
 * can show what a narrower account would see without signing in as one; the server's copy
 * is the one that runs in production. Any change there must be mirrored here, and
 * `filterNodesMirror.test.ts` encodes the server's branch behaviour so a drift shows up
 * as a failing test rather than a quietly wrong preview.
 *
 * The one deliberate difference is the shape of the allowlist. Maestro walks a nested
 * `SanitizedFields` tree; the client already has that tree flattened into dotted paths by
 * `collectAccessPaths`, which emits an entry for every level. Membership in that set is
 * therefore equivalent to the server's nested walk, and much cheaper to toggle in a UI.
 */

export type SimulationAllowlists = {
    read: ReadonlySet<string>;
    write: ReadonlySet<string>;
};

export type SimulationResult = {
    nodes: ViewNode[];
    /** Nodes removed, counting a pruned subtree as one. */
    pruned: number;
    /** Fields the write allowlist forced to `disabled`. */
    disabled: number;
    /** Sheet cards kept but locked, rather than pruned. */
    locked: number;
};

/**
 * Virtual compound fields that gate permissions inside the widget. Copied from the
 * server's own skip list — see `filterNodes`.
 */
const WRITE_GATE_SKIP_NAMES = new Set([
    "_id",
    "__floorPolygon",
    "__unitRefs",
    "__unitPolygon",
    "__unitConnected",
]);

const WRITE_GATE_SKIP_WIDGETS = new Set(["#FormFloorPolygon", "#FormUnitPolygon"]);

/** Mirrors maestro's `filterViewConfig`: create forms ignore the write allowlist. */
export function appliesWriteAllowlist(config: Pick<ViewConfig, "viewType" | "viewMode">): boolean {
    return config.viewType === "form" && config.viewMode !== "create";
}

/** Mirrors the server's `lockCardInstead`: a sheet card is locked, not dropped. */
function lockCardInstead(node: ViewNode, lockUnreadableCards: boolean): ViewNode | null {
    if (!lockUnreadableCards || node.render !== "#DisplayCard" || !node.field) return null;
    return {...node, field: {...node.field, locked: true}, children: undefined};
}

export function filterNodesMirror(
    nodes: ViewNode[],
    allowlists: SimulationAllowlists,
    applyWriteAllowlistAsDisabled: boolean,
    lockUnreadableCards = false,
): SimulationResult {
    let pruned = 0;
    let disabled = 0;
    let locked = 0;

    const walk = (list: ViewNode[]): ViewNode[] => {
        const result: ViewNode[] = [];

        for (const node of list) {
            const readDenied = node.permissions?.readAny?.length
                ? !node.permissions.readAny.some((key) => allowlists.read.has(key))
                : !!node.permissions?.read && !allowlists.read.has(node.permissions.read);
            if (readDenied) {
                const lockedNode = lockCardInstead(node, lockUnreadableCards);
                if (lockedNode) {
                    locked++;
                    result.push(lockedNode);
                } else {
                    pruned++;
                }
                continue;
            }

            if (node.dependentAny?.length) {
                if (
                    !node.dependentRuntimeOnly &&
                    !node.dependentAny.some((path) => allowlists.read.has(path))
                ) {
                    pruned++;
                    continue;
                }
            } else if (
                node.dependent &&
                !node.dependentRuntimeOnly &&
                !allowlists.read.has(node.dependent)
            ) {
                pruned++;
                continue;
            }

            let processed: ViewNode = {...node};

            if (processed.field && applyWriteAllowlistAsDisabled) {
                const fieldName = processed.field.name;
                const skip =
                    WRITE_GATE_SKIP_NAMES.has(fieldName) ||
                    !!processed.field.skipWriteAccessGate ||
                    WRITE_GATE_SKIP_WIDGETS.has(processed.field.widget);
                if (!skip && !allowlists.write.has(fieldName)) {
                    processed = {...processed, field: {...processed.field, disabled: true}};
                    disabled++;
                }
            }

            if (processed.children) {
                processed = {...processed, children: walk(processed.children)};
            }

            result.push(processed);
        }

        return result;
    };

    const filtered = walk(nodes);
    return {nodes: filtered, pruned, disabled, locked};
}

/**
 * Whole-config simulation.
 *
 * Note that maestro drops a view entirely when every node is pruned (`filterViewConfig`
 * returns `null`); the Studio keeps the empty config so the editor still has something to
 * render, and reports the count instead.
 */
export function simulateViewConfig(
    config: ViewConfig,
    allowlists: SimulationAllowlists,
): SimulationResult & {wouldBeDropped: boolean} {
    const result = filterNodesMirror(
        config.nodes,
        allowlists,
        appliesWriteAllowlist(config),
        config.viewType === "sheet",
    );
    return {...result, wouldBeDropped: result.nodes.length === 0 && config.nodes.length > 0};
}
