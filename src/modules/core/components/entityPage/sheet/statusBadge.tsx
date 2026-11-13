import {cn} from "@coreModule/components/lib/utils.ts";
import {TextBadge} from "@coreModule/components/entityPage/list/table/tableCellPrimitives.tsx";
import {toneClass} from "@coreModule/components/entityPage/list/table/columnConfigToColumnDef.tsx";
import {useEnumTones} from "@coreModule/helpers/hooks/useEnumTones.ts";

type Props = {
    /** The list's table config key, whose column carries the model's `enumTones`. */
    tableConfigKey: string;
    /** The column id: a top-level field, or a dotted one inside an embedded list (`installments.status`). */
    field: string;
    value: string | undefined;
    label: string;
};

/** A status as a tone-coloured badge on cards and sheet headers, painted the way its table cell is (UX-02). */
export default function StatusBadge({tableConfigKey, field, value, label}: Props) {
    const tones = useEnumTones(tableConfigKey, field);
    if (!value) return null;
    const tone = tones?.[value];
    // Labels come translated in sentence case, so no `capitalize` (the table adds it only for raw codes).
    return <TextBadge label={label} className={cn("whitespace-nowrap", toneClass(tone))} />;
}
