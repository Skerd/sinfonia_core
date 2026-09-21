import {createElement} from "react";
import type {DisplayCardLinkedSheetOuterProps} from "@coreModule/components/viewEngine/widgets/display/displayCard.tsx";
import {resolveWidget} from "../../widgetRegistry.ts";

/** What a `#DisplayCard` needs to open a nested entity sheet. */
export type LinkedSheetBinding = {
    /** Registry token of the sheet (`#ProjectSheetView`). */
    widgetToken: string;
    fetchId: string;
    /** Prop the sheet reads its entity from (`project`), seeded with {@link entity} while it loads. */
    entityProp: string;
    entity: Record<string, unknown>;
    /** Extra props for the sheet (e.g. `unitId` / `unitName`). */
    props?: Record<string, unknown>;
    /**
     * Runs when the entity is deleted from the nested sheet, before the card closes it.
     * When omitted the sheet keeps its own `onDelete` and the card is not notified.
     */
    onDelete?: () => void;
};

type LinkedSheetHostProps = DisplayCardLinkedSheetOuterProps & {binding: LinkedSheetBinding};

/**
 * The one component every linked card mounts. It is defined once at module level on purpose:
 * a component created during render is a new type on every render, and React remounts the
 * open nested sheet each time the parent re-renders (losing its state and refetching).
 */
export function LinkedSheetHost({binding, onLinkedDeleted, ...outer}: LinkedSheetHostProps) {
    const Sheet = resolveWidget(binding.widgetToken);
    if (!Sheet) return null;
    const props: Record<string, unknown> = {
        ...outer,
        ...binding.props,
        fetchId: binding.fetchId,
        [binding.entityProp]: binding.entity,
    };
    if (binding.onDelete) {
        const onDelete = binding.onDelete;
        props.onDelete = () => {
            onDelete();
            onLinkedDeleted?.();
        };
    }
    return createElement(Sheet, props);
}

export type LinkedReferenceSheet = {
    resourceId: string;
    LinkedSheet: typeof LinkedSheetHost;
    linkedSheetProps: {binding: LinkedSheetBinding};
};

/** `DisplayCard.linkedReferenceSheet` for a binding; `resourceId` drives the card's access check. */
export function linkedReferenceSheet(resourceId: string, binding: LinkedSheetBinding): LinkedReferenceSheet {
    return {resourceId, LinkedSheet: LinkedSheetHost, linkedSheetProps: {binding}};
}

/** Unit context the PM reference sheets expect, from `ctx.referenceCardUnitContext`. */
export function unitContextProps(
    unit: {unitId?: string; unitName?: string} | undefined,
): Record<string, unknown> | undefined {
    if (!unit) return undefined;
    const out: Record<string, unknown> = {};
    if (unit.unitId) out.unitId = unit.unitId;
    if (unit.unitName !== undefined) out.unitName = unit.unitName;
    return out;
}
