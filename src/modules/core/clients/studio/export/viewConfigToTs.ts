import type {
    FieldBinding,
    ViewConfig,
    ViewNode,
} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";

/**
 * Prints a `ViewConfig` as a TypeScript literal for pasting back into a `*.views.ts`.
 *
 * Deterministic, and ordered the way the real files are written, so the output diffs
 * cleanly against the existing source.
 *
 * It cannot be a full replacement for the file. The Studio only ever sees the evaluated
 * JSON that `GET /api/auxiliary/viewConfigs` returns, so an imported constant
 * (`COUNTRY_NAME_MAX`) prints as its value and a spread fragment (`lifecycleSheetGroup`)
 * prints expanded. Use the change list to apply edits to the real file and this as the
 * reference for what the result should look like.
 */

const INDENT = "    ";

/** Key order taken from how the existing `*.views.ts` files are written. */
const CONFIG_KEY_ORDER: (keyof ViewConfig)[] = [
    "model",
    "viewType",
    "viewMode",
    "accessModel",
    "apiUrl",
    "method",
    "header",
    "nodes",
];

/** Key order from the `ViewNode` interface declaration. */
const NODE_KEY_ORDER: (keyof ViewNode)[] = [
    "render",
    "props",
    "dependent",
    "dependentAny",
    "dependentRuntimeOnly",
    "permissions",
    "field",
    "children",
];

/** Key order from the `FieldBinding` interface declaration. */
const FIELD_KEY_ORDER: (keyof FieldBinding)[] = [
    "name",
    "widget",
    "label",
    "placeholder",
    "required",
    "disabled",
    "skipWriteAccessGate",
    "skipReadAccessGate",
    "renderWhenWriteAny",
    "widgetProps",
];

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function quoteKey(key: string): string {
    return IDENTIFIER.test(key) ? key : JSON.stringify(key);
}

function isEmptyValue(value: unknown): boolean {
    if (value === undefined) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (value !== null && typeof value === "object") return Object.keys(value).length === 0;
    return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function printValue(value: unknown, depth: number): string {
    if (value === null) return "null";
    if (typeof value === "string") return JSON.stringify(value);
    if (typeof value === "number" || typeof value === "boolean") return String(value);

    if (Array.isArray(value)) {
        if (value.length === 0) return "[]";
        const pad = INDENT.repeat(depth + 1);
        const items = value.map((item) => `${pad}${printValue(item, depth + 1)}`);
        return `[\n${items.join(",\n")},\n${INDENT.repeat(depth)}]`;
    }

    if (isPlainObject(value)) {
        return printObject(value, depth, null);
    }

    /* Functions and symbols cannot reach here: a ViewConfig is JSON over the wire. */
    return JSON.stringify(value) ?? "undefined";
}

/**
 * Prints an object, emitting `keyOrder` first (in that order) and any remaining keys
 * afterwards, alphabetically — so an unknown key added by a module still survives.
 *
 * `field` is a FieldBinding on ViewNode, but widget props reuse the same key as a
 * string (`postBodyFromFormField: { field: "project" }`). Only apply FieldBinding
 * key order when the value is actually an object — `'name' in "project"` throws.
 */
function printObject(
    value: Record<string, unknown>,
    depth: number,
    keyOrder: readonly string[] | null,
): string {
    const ordered = keyOrder
        ? [...keyOrder.filter((key) => Object.hasOwn(value, key)), ...Object.keys(value).filter((key) => !keyOrder.includes(key)).sort()]
        : Object.keys(value);

    const entries = ordered.filter((key) => value[key] !== undefined);
    if (entries.length === 0) return "{}";

    const pad = INDENT.repeat(depth + 1);
    const lines = entries.map((key) => {
        const child = value[key];
        const printed =
            (key === "nodes" || key === "children" || key === "badges") && Array.isArray(child)
                ? printNodeArray(child, depth + 1)
                : key === "field" && isPlainObject(child)
                  ? printObject(child, depth + 1, FIELD_KEY_ORDER)
                  : printValue(child, depth + 1);
        return `${pad}${quoteKey(key)}: ${printed}`;
    });

    return `{\n${lines.join(",\n")},\n${INDENT.repeat(depth)}}`;
}

function printNodeArray(nodes: ViewNode[] | undefined, depth: number): string {
    if (!nodes || nodes.length === 0) return "[]";
    const pad = INDENT.repeat(depth + 1);
    const items = nodes.map((node) => `${pad}${printNode(node, depth + 1)}`);
    return `[\n${items.join(",\n")},\n${INDENT.repeat(depth)}]`;
}

function printNode(node: ViewNode, depth: number): string {
    /* Drop empty `children` / `props` the editor may have left behind — the hand-written
       files never carry them, and they would show up as noise in the diff. */
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node)) {
        if (isEmptyValue(value)) continue;
        cleaned[key] = value;
    }
    return printObject(cleaned, depth, NODE_KEY_ORDER);
}

export type ViewConfigTsOptions = {
    /** Exported symbol name, e.g. `countrySheetView`. */
    exportName: string;
};

/**
 * Mongoose collection name → the singular used for file and symbol names
 * (`countries` → `country`, `units` → `unit`). A suggestion, not a rule: irregular
 * plurals are the developer's to correct.
 */
export function singularizeCollection(collection: string): string {
    if (collection.endsWith("ies")) return `${collection.slice(0, -3)}y`;
    if (collection.endsWith("ses")) return collection.slice(0, -2);
    if (collection.endsWith("s")) return collection.slice(0, -1);
    return collection;
}

/** Derives the conventional export name, matching `country.views.ts` and its siblings. */
export function suggestExportName(config: ViewConfig): string {
    const singular = singularizeCollection(config.model);

    if (config.viewType === "sheet") return `${singular}SheetView`;
    if (config.viewMode === "create") return `${singular}CreateFormView`;
    if (config.viewMode === "edit") return `${singular}EditFormView`;
    return `${singular}${config.viewMode ? `${config.viewMode}FormView` : "FormView"}`;
}

export function viewConfigToTs(config: ViewConfig, options: ViewConfigTsOptions): string {
    const body = printObject(config as unknown as Record<string, unknown>, 0, CONFIG_KEY_ORDER);
    return `export const ${options.exportName}: ViewConfig = ${body};\n`;
}
