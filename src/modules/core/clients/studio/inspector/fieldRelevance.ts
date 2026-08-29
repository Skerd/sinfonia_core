import type {ViewMode, ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";

/**
 * Which inspector controls actually do something for the view being edited.
 *
 * Every rule here is read off the engine rather than inferred from a name, because a
 * control that looks meaningful and is silently ignored is exactly the thing this
 * module exists to stop:
 *
 *  - `permissions.read` / `readAny` — maestro's `filterNodes` runs for every view type,
 *    so these prune server-side in sheets *and* forms. `ViewRenderer` additionally gates
 *    on them client-side, but only under `ctx.mode === "sheet"`.
 *  - `permissions.write` / `writeAny` — maestro never reads them. `ViewRenderer` checks
 *    them only when `ctx.writeAccess` is set, and the only renderer that sets it is
 *    `EditFormViewRenderer`. They are inert in a sheet and in a create form.
 *  - `field.required` / `placeholder` / `disabled` — `ViewRenderer.tsx`, which owns sheet
 *    field rendering, never reads any of them.
 *  - `field.skipWriteAccessGate` / `renderWhenWriteAny` — the write allowlist becomes
 *    `disabled` only when `viewType === "form" && viewMode !== "create"`, so opting out
 *    of it means nothing anywhere else.
 *  - `field.skipReadAccessGate` — consumed by `resolveDisplayCardValueAccessSpec`, a
 *    sheet-only path.
 *  - `dependentRuntimeOnly` — `filterNodes` consults it only alongside `dependent` /
 *    `dependentAny`.
 *
 * Legacy forms carry no `viewMode`; maestro treats those as edit ("write-allowlist →
 * disabled only applies to edit (and legacy forms without viewMode)"), and so does this.
 */

export type ViewShape = {
    viewType: "sheet" | "form";
    viewMode?: ViewMode;
};

/**
 * `primary` renders inline, `advanced` hides behind a per-section disclosure, and
 * `inapplicable` is dropped — unless the node already carries a value for it, which the
 * inspector surfaces separately rather than hiding editable data.
 */
export type RelevanceState = "primary" | "advanced" | "inapplicable";

export type Relevance = {
    state: RelevanceState;
    /** Why it is not primary. Shown verbatim in the UI, so it is written for a reader. */
    reason?: string;
};

export type InspectorKey =
    | "render"
    | "props"
    | "dependent"
    | "dependentAny"
    | "dependentRuntimeOnly"
    | "permissions.read"
    | "permissions.readAny"
    | "permissions.write"
    | "permissions.writeAny"
    | "field.name"
    | "field.widget"
    | "field.label"
    | "field.placeholder"
    | "field.required"
    | "field.disabled"
    | "field.skipWriteAccessGate"
    | "field.skipReadAccessGate"
    | "field.renderWhenWriteAny"
    | "field.widgetProps";

/** Every key this module knows about, in inspector order. Drives the dead-config sweep. */
export const INSPECTOR_KEYS: InspectorKey[] = [
    "render",
    "props",
    "dependent",
    "dependentAny",
    "dependentRuntimeOnly",
    "permissions.read",
    "permissions.readAny",
    "permissions.write",
    "permissions.writeAny",
    "field.name",
    "field.widget",
    "field.label",
    "field.placeholder",
    "field.required",
    "field.disabled",
    "field.skipWriteAccessGate",
    "field.skipReadAccessGate",
    "field.renderWhenWriteAny",
    "field.widgetProps",
];

const PRIMARY: Relevance = {state: "primary"};

/** Edit forms, plus legacy forms with no `viewMode` — mirrors maestro's own predicate. */
export function isEditForm(shape: ViewShape): boolean {
    return shape.viewType === "form" && shape.viewMode !== "create";
}

export function relevanceFor(key: InspectorKey, shape: ViewShape, node: ViewNode): Relevance {
    const isForm = shape.viewType === "form";
    const isSheet = shape.viewType === "sheet";

    switch (key) {
        /* Structural: always meaningful. */
        case "render":
        case "props":
        case "dependent":
        case "field.name":
        case "field.widget":
        case "field.widgetProps":
            return PRIMARY;

        /* `label` is read by form fields and by sheet `#DisplayCard` alike. */
        case "field.label":
            return PRIMARY;

        case "dependentAny":
            /* Mutually exclusive with `dependent` in practice; keep the unused one out of
               the way rather than inviting a config that sets both. */
            return node.dependent
                ? {state: "advanced", reason: "`dependent` is already set; these are alternatives."}
                : PRIMARY;

        case "dependentRuntimeOnly":
            return node.dependent || node.dependentAny?.length
                ? PRIMARY
                : {
                      state: "inapplicable",
                      reason: "Only read alongside `dependent` / `dependentAny`, which are unset.",
                  };

        /* Read gating prunes server-side for every view type. */
        case "permissions.read":
            return PRIMARY;

        case "permissions.readAny":
            return node.permissions?.read
                ? {state: "advanced", reason: "`read` is already set; `readAny` overrides it."}
                : {state: "advanced"};

        case "permissions.write":
        case "permissions.writeAny":
            return isEditForm(shape)
                ? key === "permissions.write"
                    ? PRIMARY
                    : {state: "advanced"}
                : {
                      state: "inapplicable",
                      reason: isSheet
                          ? "Write permissions are only evaluated on edit forms — the server ignores them and sheets have no write context."
                          : "Create forms have no write allowlist, so write permissions are never evaluated.",
                  };

        case "field.placeholder":
        case "field.required":
        case "field.disabled":
            return isForm
                ? PRIMARY
                : {
                      state: "inapplicable",
                      reason: "Sheet fields render as display values; this is only read by form widgets.",
                  };

        case "field.skipWriteAccessGate":
        case "field.renderWhenWriteAny":
            return isEditForm(shape)
                ? {state: "advanced"}
                : {
                      state: "inapplicable",
                      reason: isSheet
                          ? "The write allowlist is only applied to edit forms, so there is nothing to opt out of here."
                          : "Create forms show every field regardless of the write allowlist.",
                  };

        case "field.skipReadAccessGate":
            return isSheet
                ? {state: "advanced"}
                : {
                      state: "inapplicable",
                      reason: "Only the sheet renderer gates display values on read access.",
                  };
    }
}

// ---------------------------------------------------------------------------
// Reading and clearing a key, for the dead-config strip
// ---------------------------------------------------------------------------

/**
 * Whether a value counts as authored. `false` and `""` are what the inspector writes
 * when a control is cleared (every setter coerces to `undefined` via `prune`), so
 * treating them as set would keep no-op entries permanently in the dead-config strip.
 */
export function isValueSet(value: unknown): boolean {
    if (value === undefined || value === null || value === false || value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value as object).length > 0;
    return true;
}

export function inspectorValue(node: ViewNode, key: InspectorKey): unknown {
    if (key.startsWith("permissions.")) {
        const leaf = key.slice("permissions.".length) as keyof NonNullable<ViewNode["permissions"]>;
        return node.permissions?.[leaf];
    }
    if (key.startsWith("field.")) {
        const leaf = key.slice("field.".length);
        return node.field?.[leaf as keyof NonNullable<ViewNode["field"]>];
    }
    return node[key as keyof ViewNode];
}

/** Removes one key, dropping `permissions` / `field` entirely once they are empty. */
export function clearInspectorKey(node: ViewNode, key: InspectorKey): ViewNode {
    if (key.startsWith("permissions.")) {
        const leaf = key.slice("permissions.".length);
        const permissions = {...(node.permissions ?? {})} as Record<string, unknown>;
        delete permissions[leaf];
        return {
            ...node,
            permissions: Object.keys(permissions).length > 0
                ? (permissions as NonNullable<ViewNode["permissions"]>)
                : undefined,
        };
    }
    if (key.startsWith("field.")) {
        if (!node.field) return node;
        const leaf = key.slice("field.".length);
        const field = {...node.field} as Record<string, unknown>;
        delete field[leaf];
        /* Only optional keys are ever cleared here — `name` and `widget` are never
           `inapplicable` — but `delete` on a keyof loses that, hence the widening. */
        return {...node, field: field as unknown as NonNullable<ViewNode["field"]>};
    }
    const next = {...node} as Record<string, unknown>;
    delete next[key];
    return next as unknown as ViewNode;
}

export type DeadConfigEntry = {
    key: InspectorKey;
    value: unknown;
    reason: string;
};

/**
 * Keys this view type ignores that the node nonetheless sets.
 *
 * These are why `inapplicable` hides a control instead of the inspector simply dropping
 * it: the value is still in the config, still exported, and still needs a way to be seen
 * and removed.
 */
export function deadConfigEntries(node: ViewNode, shape: ViewShape): DeadConfigEntry[] {
    const entries: DeadConfigEntry[] = [];
    for (const key of INSPECTOR_KEYS) {
        const relevance = relevanceFor(key, shape, node);
        if (relevance.state !== "inapplicable") continue;
        const value = inspectorValue(node, key);
        if (!isValueSet(value)) continue;
        entries.push({key, value, reason: relevance.reason ?? "Not read by this view type."});
    }
    return entries;
}
