import DisplayCard from "@coreModule/components/custom/displayValue/displayCard.tsx";
import type {ResolveLanguageKey} from "@baseModule/helpers/hocs/withLanguage.tsx";
import {bootstrapLinkedSheetData, resolvePath} from "../../../engine/refs.ts";
import {iconOrUndefined} from "../../../registry/icons.ts";
import {linkedReferenceSheet} from "../../linkedSheet/linkedSheetHost.tsx";
import {resolveWidget} from "../../../widgetRegistry.ts";

export type ReferenceCompactRowConfig = {
    /** Tabler icon token, e.g. `#ClipboardList`. */
    icon?: string;
    /** Language key for the row label (e.g. `inspection`). */
    label: string;
    valuePath: string[];
    /**
     * Optional parallel list to `valuePath`: when set, that segment is resolved via
     * `resolveLanguageKey(\`${category}.${raw}\`)` (falls back to raw when missing).
     */
    valueLanguageKeyCategories?: (string | null | undefined)[];
    joinSeparator?: string;
    linkedSheetModel: string;
    linkedSheetWidget: string;
    linkedSheetEntityProp: string;
};

/** `valuePath` segments of the stub, translated where a category is given, joined. */
function compactValue(stub: Record<string, any>, config: ReferenceCompactRowConfig, t: ResolveLanguageKey): string | null {
    const parts = config.valuePath
        .map((path, i) => {
            const raw = resolvePath(stub, path);
            if (raw == null || raw === "") return null;
            const category = config.valueLanguageKeyCategories?.[i];
            if (category && typeof raw === "string") {
                const key = `${category}.${raw}`;
                const resolved = t(key);
                return resolved !== key ? resolved : raw;
            }
            return String(raw);
        })
        .filter((v): v is string => v != null && v !== "");
    return parts.length > 0 ? parts.join(config.joinSeparator ?? " ") : null;
}

/** A `#ReferencesRender` stub as one `#DisplayCard` row (compact mode) that opens its sheet. */
export function ReferenceStubCompactRow({
    stub,
    config,
    unitId,
    unitName,
    resolveLanguageKey,
    show,
}: {
    stub: Record<string, any>;
    config: ReferenceCompactRowConfig;
    unitId: string;
    unitName: string;
    resolveLanguageKey: ResolveLanguageKey;
    show: boolean;
}) {
    const id = stub._id as string;
    const label = String(resolveLanguageKey(config.label));
    const sheet =
        typeof id === "string" && id.length > 0 && resolveWidget(config.linkedSheetWidget)
            ? linkedReferenceSheet(config.linkedSheetModel, {
                  widgetToken: config.linkedSheetWidget,
                  fetchId: id,
                  entityProp: config.linkedSheetEntityProp,
                  entity: bootstrapLinkedSheetData(id, stub, typeof stub.name === "string" && stub.name ? stub.name : null),
                  props: {unitId, unitName},
              })
            : undefined;

    return (
        <DisplayCard
            show={show}
            title={label}
            tooltip={label}
            Icon={iconOrUndefined(config.icon)}
            value={compactValue(stub, config, resolveLanguageKey)}
            linkedReferenceSheet={sheet}
        />
    );
}
