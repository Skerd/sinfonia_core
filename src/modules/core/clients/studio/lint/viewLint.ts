import type {ViewConfig, ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {WidgetMeta} from "@coreModule/components/viewEngine/widgetMeta.ts";
import {flattenTree} from "../tree/nodeTreeOps.ts";
import {isEditForm, type ViewShape} from "../inspector/fieldRelevance.ts";

/**
 * Static checks for config that will not do what it looks like it does.
 *
 * Every rule here fails silently at runtime: `filterNodes` prunes a node and the section
 * simply never appears, `renderRegisteredComponent` hands children to a component that
 * discards them, an unknown token logs one `console.warn`. None of that is visible while
 * editing, and most of it is invisible on the real page too, because the symptom is an
 * absence. Catching it here is the whole point.
 *
 * Note which mechanism each rule actually describes — they are not interchangeable.
 * `permissions.read` and `dependent` are what maestro prunes on; a `field.name` outside
 * the read allowlist is *not* pruned at all, it is the sheet renderer that locks the
 * value through `hasDisplayCardValueAccess`. Saying "the server removes this" about the
 * second case would send someone looking in the wrong place.
 *
 * Pure by construction: registry and language lookups arrive through {@link LintContext}
 * so the rules can be exercised without mounting the widget registry.
 */

export type LintSeverity = "error" | "warning";

export type LintFinding = {
    /** Stable rule id, for tests and for grouping in the UI. */
    rule: string;
    severity: LintSeverity;
    message: string;
    /** Positional key of the offending node (`pathKey`), so the UI can select it. */
    path: string;
    /** The node in the same shorthand the tree rows use. */
    label: string;
};

export type LintContext = ViewShape & {
    /** Dotted paths the account may read. Empty disables the read-allowlist rule. */
    readPaths: string[];
    /** Dotted paths the account may write. Empty disables the write-allowlist rule. */
    writePaths: string[];
    /** Registry tokens. Empty disables the unknown-token rule. */
    knownTokens: string[];
    getMeta: (token: string) => WidgetMeta | undefined;
    /** True when the token resolves to a real icon. */
    iconResolves: (token: string) => boolean;
    /**
     * True when a language key resolves. Omitted when no language path is set, which
     * disables the language rule rather than reporting every key as missing.
     */
    languageKeyResolves?: (key: string) => boolean;
};

function nodeLabel(node: ViewNode): string {
    if (node.field) return `${node.field.widget}[${node.field.name || "(unbound)"}]`;
    const title = node.props?.title;
    if (typeof title === "string" && title) return `${node.render}("${title}")`;
    return node.render;
}

/**
 * Paths that never appear in an access allowlist because they are not real ACL keys.
 * Mirrors the skip list maestro's `filterNodes` applies before disabling a field.
 */
const NON_ACL_FIELD_NAMES = new Set([
    "_id",
    "__floorPolygon",
    "__unitRefs",
    "__unitPolygon",
    "__unitConnected",
]);

const POLYGON_WIDGETS = new Set(["#FormFloorPolygon", "#FormUnitPolygon"]);

/** `#Field` is a pseudo-token resolved by `node.field`, never by the registry. */
const FIELD_PSEUDO_TOKEN = "#Field";

export function lintViewConfig(config: ViewConfig, ctx: LintContext): LintFinding[] {
    const findings: LintFinding[] = [];
    const isSheet = ctx.viewType === "sheet";
    const isForm = ctx.viewType === "form";
    const editForm = isEditForm(ctx);

    const readSet = new Set(ctx.readPaths);
    const writeSet = new Set(ctx.writePaths);
    const tokenSet = new Set(ctx.knownTokens);
    const checkTokens = tokenSet.size > 0;

    for (const row of flattenTree(config.nodes)) {
        const {node, key} = row;
        const label = nodeLabel(node);
        const add = (rule: string, severity: LintSeverity, message: string) =>
            findings.push({rule, severity, message, path: key, label});

        const renderMeta = ctx.getMeta(node.render);
        const widgetMeta = node.field ? ctx.getMeta(node.field.widget) : undefined;

        // -- structural ---------------------------------------------------
        if (node.children?.length) {
            const isContainer = !node.render.startsWith("#")
                ? true
                : renderMeta
                  ? !!renderMeta.container
                  : true; /* undescribed: assume the author knows */
            if (!isContainer) {
                add(
                    "children-on-non-container",
                    "error",
                    `\`${node.render}\` does not render children — the ${node.children.length} node(s) nested here are passed to the component and discarded.`,
                );
            }
        }

        if (checkTokens && node.render.startsWith("#") && node.render !== FIELD_PSEUDO_TOKEN) {
            if (!tokenSet.has(node.render)) {
                add(
                    "unknown-render-token",
                    "error",
                    `\`${node.render}\` is not in the widget registry — ViewRenderer logs a warning and renders nothing.`,
                );
            }
        }
        if (checkTokens && node.field && !tokenSet.has(node.field.widget)) {
            add(
                "unknown-widget-token",
                "error",
                `\`${node.field.widget}\` is not in the widget registry.`,
            );
        }

        // -- mode fit -----------------------------------------------------
        if (renderMeta && !renderMeta.modes.includes(ctx.viewType) && !node.field) {
            add(
                "widget-mode-mismatch",
                "warning",
                `\`${node.render}\` is documented for ${renderMeta.modes.join(" / ")} views, not ${ctx.viewType}.`,
            );
        }
        if (widgetMeta && !widgetMeta.modes.includes(ctx.viewType)) {
            add(
                "widget-mode-mismatch",
                "warning",
                `\`${node.field!.widget}\` is documented for ${widgetMeta.modes.join(" / ")} views, not ${ctx.viewType}.`,
            );
        }

        // -- sheet vs form binding shape ----------------------------------
        if (node.field && isSheet) {
            if (node.render === FIELD_PSEUDO_TOKEN) {
                add(
                    "sheet-field-pseudo-token",
                    "error",
                    "`#Field` is a form-only pseudo-token. In a sheet the bound node must name the widget in `render`.",
                );
            } else if (node.render !== node.field.widget) {
                add(
                    "sheet-render-widget-mismatch",
                    "error",
                    `Sheet fields resolve through \`render\`, so \`${node.render}\` renders instead of \`${node.field.widget}\`.`,
                );
            }
        }

        // -- required props -----------------------------------------------
        for (const prop of renderMeta?.props ?? []) {
            if (!prop.required) continue;
            const value = node.props?.[prop.name];
            if (value === undefined || value === "") {
                add(
                    "missing-required-prop",
                    "error",
                    `\`${node.render}\` requires \`props.${prop.name}\`.`,
                );
            }
        }
        for (const prop of widgetMeta?.widgetProps ?? []) {
            if (!prop.required) continue;
            const value = node.field?.widgetProps?.[prop.name];
            if (value === undefined || value === "") {
                add(
                    "missing-required-prop",
                    "error",
                    `\`${node.field!.widget}\` requires \`widgetProps.${prop.name}\`.`,
                );
            }
        }

        // -- icons --------------------------------------------------------
        const iconProps: {source: string; value: unknown}[] = [];
        for (const prop of renderMeta?.props ?? []) {
            if (prop.suggest === "icon") {
                iconProps.push({source: `props.${prop.name}`, value: node.props?.[prop.name]});
            }
        }
        for (const prop of widgetMeta?.widgetProps ?? []) {
            if (prop.suggest === "icon") {
                iconProps.push({
                    source: `widgetProps.${prop.name}`,
                    value: node.field?.widgetProps?.[prop.name],
                });
            }
        }
        /* Undescribed widgets still commonly carry `widgetProps.icon`. */
        if (!widgetMeta && node.field?.widgetProps?.icon !== undefined) {
            iconProps.push({source: "widgetProps.icon", value: node.field.widgetProps.icon});
        }
        for (const {source, value} of iconProps) {
            if (typeof value === "string" && value !== "" && !ctx.iconResolves(value)) {
                add(
                    "icon-does-not-resolve",
                    "warning",
                    `\`${value}\` (${source}) does not resolve to a Tabler icon and will be dropped.`,
                );
            }
        }

        // -- inert config -------------------------------------------------
        if (!editForm && (node.permissions?.write || node.permissions?.writeAny?.length)) {
            add(
                "write-permission-inert",
                "error",
                isSheet
                    ? "`permissions.write` is never evaluated on a sheet — the server ignores it and sheets carry no write context."
                    : "`permissions.write` is never evaluated on a create form.",
            );
        }
        if (isForm && node.field?.skipReadAccessGate) {
            add(
                "skip-read-gate-inert",
                "warning",
                "`skipReadAccessGate` is only read by the sheet renderer.",
            );
        }
        if (!editForm && node.field?.skipWriteAccessGate) {
            add(
                "skip-write-gate-inert",
                "warning",
                "The write allowlist is only applied to edit forms, so there is nothing to opt out of.",
            );
        }
        if (!editForm && node.field?.renderWhenWriteAny?.length) {
            add(
                "skip-write-gate-inert",
                "warning",
                "`renderWhenWriteAny` is only read by the edit form renderer.",
            );
        }
        if (node.dependentRuntimeOnly && !node.dependent && !node.dependentAny?.length) {
            add(
                "dependent-runtime-only-inert",
                "warning",
                "`dependentRuntimeOnly` is only read alongside `dependent` / `dependentAny`.",
            );
        }

        // -- access allowlists --------------------------------------------
        const fieldName = node.field?.name;
        const aclExempt =
            !fieldName ||
            NON_ACL_FIELD_NAMES.has(fieldName) ||
            /* `resolveDisplayCardValueAccessSpec` returns null for these outright. */
            fieldName === "statistics" ||
            fieldName.startsWith("statistics.") ||
            POLYGON_WIDGETS.has(node.field!.widget);

        if (isSheet && readSet.size > 0 && !aclExempt && !node.field!.skipReadAccessGate) {
            if (!readSet.has(fieldName)) {
                add(
                    "field-path-not-readable",
                    "warning",
                    `\`${fieldName}\` is not in the read allowlist — the card still renders, but ` +
                        "`hasDisplayCardValueAccess` locks its value. Set `skipReadAccessGate` if " +
                        "this is a computed path rather than a real ACL key.",
                );
            }
        }

        if (
            editForm &&
            writeSet.size > 0 &&
            !aclExempt &&
            !node.field!.skipWriteAccessGate &&
            !node.field!.renderWhenWriteAny?.length &&
            !writeSet.has(fieldName)
        ) {
            add(
                "field-path-not-writable",
                "warning",
                `\`${fieldName}\` is not in the write allowlist — the server ships this field \`disabled\`.`,
            );
        }

        for (const permissionPath of [
            node.permissions?.read,
            ...(node.permissions?.readAny ?? []),
        ]) {
            if (permissionPath && readSet.size > 0 && !readSet.has(permissionPath)) {
                add(
                    "permission-path-not-readable",
                    "error",
                    `\`permissions\` references \`${permissionPath}\`, which is not in the read allowlist — \`filterNodes\` prunes this node server-side, so it never reaches the client.`,
                );
            }
        }

        // -- language keys -------------------------------------------------
        if (ctx.languageKeyResolves) {
            const keys: {source: string; value: string | undefined}[] = [
                {source: "label", value: node.field?.label},
                {source: "placeholder", value: node.field?.placeholder},
            ];
            if (typeof node.props?.title === "string") {
                keys.push({source: "props.title", value: node.props.title});
            }
            for (const {source, value} of keys) {
                if (value && !ctx.languageKeyResolves(value)) {
                    add(
                        "language-key-unresolved",
                        "warning",
                        `\`${value}\` (${source}) does not resolve in the selected language file.`,
                    );
                }
            }
        }
    }

    /* Errors first, then document order, so the list reads the same on every render. */
    const order: LintSeverity[] = ["error", "warning"];
    return findings.sort((a, b) => {
        const bySeverity = order.indexOf(a.severity) - order.indexOf(b.severity);
        if (bySeverity !== 0) return bySeverity;
        return a.path.localeCompare(b.path, undefined, {numeric: true});
    });
}

export function countBySeverity(findings: LintFinding[]): {errors: number; warnings: number} {
    let errors = 0;
    let warnings = 0;
    for (const finding of findings) {
        if (finding.severity === "error") errors++;
        else warnings++;
    }
    return {errors, warnings};
}

/** Findings grouped by node path, for badging tree rows. */
export function findingsByPath(findings: LintFinding[]): Map<string, LintFinding[]> {
    const map = new Map<string, LintFinding[]>();
    for (const finding of findings) {
        const bucket = map.get(finding.path);
        if (bucket) bucket.push(finding);
        else map.set(finding.path, [finding]);
    }
    return map;
}
