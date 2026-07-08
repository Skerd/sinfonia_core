import { createElement, type ComponentType } from "react";
import SmallInfoCard, {
    type SmallInfoCardLinkedSheetOuterProps,
} from "@coreModule/components/custom/smallInfoCard.tsx";
import { resolveIcon, resolveWidget } from "./widgetRegistry.ts";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";

function resolveDotPath(obj: Record<string, any>, path: string): unknown {
    return path.split(".").reduce<any>((acc, key) => acc?.[key], obj);
}

export type ReferenceCompactRowConfig = {
    /** Tabler icon token, e.g. `#ClipboardList`. */
    icon?: string;
    /** Language key for the row label (e.g. `inspection`). */
    label: string;
    valuePath: string[];
    joinSeparator?: string;
    linkedSheetModel: string;
    linkedSheetWidget: string;
    linkedSheetEntityProp: string;
};

function bootstrapStub(stub: Record<string, any>, linkedId: string): Record<string, unknown> {
    if (stub && typeof stub === "object" && Object.keys(stub).length > 1) {
        return { ...stub };
    }
    const nm = typeof stub.name === "string" ? stub.name : "";
    const base: Record<string, unknown> = { _id: linkedId };
    if (nm) base.name = nm;
    return base;
}

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
    const Icon = config.icon ? resolveIcon(config.icon) : null;

    let displayValue: unknown = null;
    if (config.valuePath.length > 0) {
        const parts = config.valuePath
            .map((p) => resolveDotPath(stub, p))
            .filter((v) => v != null && v !== "")
            .map((v) => String(v));
        displayValue = parts.length > 0 ? parts.join(config.joinSeparator ?? " ") : null;
    }

    const LinkedWidget = resolveWidget(config.linkedSheetWidget) as ComponentType<any> | null;
    const entityProp = config.linkedSheetEntityProp;
    const bootstrap = bootstrapStub(stub, id);

    let linkedReferenceSheet:
        | { resourceId: string; LinkedSheet: ComponentType<SmallInfoCardLinkedSheetOuterProps> }
        | undefined;

    if (LinkedWidget && typeof id === "string" && id.length > 0) {
        const Bound: ComponentType<SmallInfoCardLinkedSheetOuterProps> = (sheetProps) => {
            const { onLinkedDeleted: _omit, ...rest } = sheetProps;
            const sheetPropsOut: Record<string, unknown> = {
                ...rest,
                fetchId: id,
                unitId,
                unitName,
            };
            sheetPropsOut[entityProp] = bootstrap;
            return createElement(LinkedWidget as ComponentType<any>, sheetPropsOut);
        };
        linkedReferenceSheet = {
            resourceId: config.linkedSheetModel,
            LinkedSheet: Bound,
        };
    }

    const label = String(resolveLanguageKey(config.label));

    return (
        <SmallInfoCard
            show={show}
            title={label}
            tooltip={label}
            Icon={Icon ?? undefined}
            value={displayValue}
            linkedReferenceSheet={linkedReferenceSheet}
        />
    );
}
