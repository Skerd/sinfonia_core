import type {FieldBinding, SheetHeaderConfig, ViewConfig, ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {getAuditSinglePostHint} from "./widgetRegistry.ts";

/**
 * How to present persisted values in audit diffs for fields that are not plain scalars.
 *
 * - `media`: file / gallery / avatar fields (single id, `Media` stub, or id array).
 * - `singlePost`: resolve display text via `POST url` with `{ _id }` (linked sheets, tenancy cards).
 * - `apiSelect`: same idea by replacing `…/select` with `…/single` when possible.
 */
export type AuditFieldHint =
    | {kind: "primitive"}
    | {kind: "media"}
    | {kind: "singlePost"; url: string; labelFields: string[]}
    | {kind: "apiSelect"; selectUrl: string};

const DEFAULT_PRIMITIVE_HINT: AuditFieldHint = {kind: "primitive"};

const MEDIA_WIDGETS = new Set([
    "#SheetMediaFilesStrip",
    "#SheetMediaAvatar",
    "#GalleryCarousel",
    "#FilePicker",
    "#MediaField",
    "#FormEditMediaField",
    "#FormMultiLocalFileField",
]);

function rankHint(kind: AuditFieldHint["kind"]): number {
    switch (kind) {
        case "primitive":
            return 0;
        case "apiSelect":
            return 1;
        case "singlePost":
            return 2;
        case "media":
            return 3;
        default:
            return 0;
    }
}

function mergeFieldHint(target: Record<string, AuditFieldHint>, fieldName: string, next: AuditFieldHint): void {
    const prev = target[fieldName];
    if (!prev || rankHint(next.kind) > rankHint(prev.kind)) {
        target[fieldName] = next;
    }
}

function hintForBinding(binding: FieldBinding): AuditFieldHint | null {
    const w = binding.widget;
    const wp = binding.widgetProps ?? {};
    if (MEDIA_WIDGETS.has(w)) {
        return {kind: "media"};
    }

    if (w === "#ApiSelect" && typeof wp.apiUrl === "string" && wp.apiUrl.trim().length > 0) {
        return {kind: "apiSelect", selectUrl: wp.apiUrl.trim()};
    }

    const direct = getAuditSinglePostHint(w);
    if (direct) {
        return {kind: "singlePost", url: direct.url, labelFields: direct.labelFields};
    }

    if (w === "#SmallInfoCard") {
        const linkedPath = typeof wp.linkedRefPath === "string" ? wp.linkedRefPath.trim() : "";
        const linkedToken = typeof wp.linkedSheetWidget === "string" ? wp.linkedSheetWidget : "";
        const linkedHint = linkedToken ? getAuditSinglePostHint(linkedToken) : undefined;

        if (wp.valueType === "linkedObjectRefCardList" && linkedHint) {
            return {kind: "singlePost", url: linkedHint.url, labelFields: linkedHint.labelFields};
        }

        /** Linked ref on the persisted path (often `linkedRefPath`) while UI field name may be e.g. `project.name`. */
        if (linkedPath && linkedHint) {
            return {kind: "singlePost", url: linkedHint.url, labelFields: linkedHint.labelFields};
        }
    }

    return null;
}

function mergeHintForPersistedPaths(
    out: Record<string, AuditFieldHint>,
    binding: FieldBinding,
    hint: AuditFieldHint,
): void {
    const fieldName = binding.name;
    const wp = binding.widgetProps ?? {};
    mergeFieldHint(out, fieldName, hint);

    if (binding.widget === "#SmallInfoCard" && hint.kind === "singlePost") {
        const linkedPath = typeof wp.linkedRefPath === "string" ? wp.linkedRefPath.trim() : "";
        if (linkedPath && linkedPath !== fieldName) {
            mergeFieldHint(out, linkedPath, hint);
        }
    }
}

function walkApplyFieldVisitors(
    list: ViewNode[] | undefined,
    visit: (node: ViewNode) => void,
): void {
    if (!list?.length) {
        return;
    }
    const walk = (nodes: ViewNode[]) => {
        for (const n of nodes) {
            visit(n);
            if (n.children?.length) {
                walk(n.children);
            }
        }
    };
    walk(list);
}

/**
 * Walks sheet view nodes (optional header badges) for audit / activity hints.
 */
export function collectAuditFieldHintsFromViewNodes(
    nodes: ViewNode[] | undefined,
    header?: SheetHeaderConfig,
): Record<string, AuditFieldHint> {
    const out: Record<string, AuditFieldHint> = {};

    const visit = (n: ViewNode) => {
        if (!n.field) {
            return;
        }
        const binding = n.field;

        const hinted = hintForBinding(binding);
        if (hinted) {
            mergeHintForPersistedPaths(out, binding, hinted);
        }

        if (binding.widget === "#SheetMediaFilesStrip") {
            const wp = binding.widgetProps ?? {};
            const combined = wp.combineFromFields;
            if (Array.isArray(combined)) {
                for (const path of combined) {
                    if (typeof path === "string" && path.length > 0) {
                        mergeFieldHint(out, path, {kind: "media"});
                    }
                }
            }
        }
    };

    walkApplyFieldVisitors(nodes, visit);
    walkApplyFieldVisitors(header?.badges, visit);

    return out;
}

export function auditHintOrPrimitive(
    fieldPath: string,
    hints: Record<string, AuditFieldHint> | undefined,
): AuditFieldHint {
    return hints?.[fieldPath] ?? DEFAULT_PRIMITIVE_HINT;
}

/**
 * Walks sheet (or form) view nodes (+ optional sheet header badges). Collects `field.name` → `field.label` keys.
 */
export function collectFieldLabelsFromViewNodes(
    nodes: ViewNode[] | undefined,
    header?: SheetHeaderConfig,
): Record<string, string> {
    const out: Record<string, string> = {};

    const visit = (n: ViewNode) => {
        const name = n.field?.name;
        const label = n.field?.label;
        const widget = n.field?.widget;
        const wp = n.field?.widgetProps ?? {};
        if (!name || !label || typeof label !== "string") {
            return;
        }
        out[name] = label;
        /** Audit diffs keys are schema paths (`project`), while labels often sit on dotted display paths (`project.name`). */
        if (widget === "#SmallInfoCard") {
            const linkedPath = typeof wp.linkedRefPath === "string" ? wp.linkedRefPath.trim() : "";
            if (linkedPath.length > 0 && linkedPath !== name) {
                out[linkedPath] = label;
            }
        }
    };

    walkApplyFieldVisitors(nodes, visit);
    walkApplyFieldVisitors(header?.badges, visit);

    return out;
}

/** Merges sheet + optional edit form nodes from the same {@link ViewConfig.model} when both are present. */
export function collectFieldLabelsFromViewConfigs(cfgs: Partial<ViewConfig | null | undefined>[]): Record<string, string> {
    const out: Record<string, string> = {};
    for (const c of cfgs) {
        if (c == null) continue;
        if ((c.nodes?.length ?? 0) > 0 || (c.header?.badges?.length ?? 0) > 0) {
            Object.assign(out, collectFieldLabelsFromViewNodes(c.nodes, c.header));
        }
    }
    return out;
}

/** Stronger hints win when merging multiple configs (e.g. sheet + form). */
export function collectAuditFieldHintsFromViewConfigs(cfgs: Partial<ViewConfig | null | undefined>[]): Record<string, AuditFieldHint> {
    const out: Record<string, AuditFieldHint> = {};
    for (const c of cfgs) {
        if (c == null) continue;
        if ((c.nodes?.length ?? 0) > 0 || (c.header?.badges?.length ?? 0) > 0) {
            const slice = collectAuditFieldHintsFromViewNodes(c.nodes, c.header);
            for (const [k, h] of Object.entries(slice)) {
                mergeFieldHint(out, k, h);
            }
        }
    }
    return out;
}
