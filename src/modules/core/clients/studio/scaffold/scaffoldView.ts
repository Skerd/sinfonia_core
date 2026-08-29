import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators";
import type {CoveragePath} from "../coverage/viewCoverage.ts";

/**
 * Builds view nodes from access paths, using the schema-derived column metadata to pick
 * a widget that fits the data.
 *
 * The interesting part is not the type table — it is that `filterConfig` already carries
 * the ref target, the `/select` URL and the enum values, derived server-side from the
 * Mongoose SchemaType. Wiring an `#ApiSelect` by hand means finding that URL; here it is
 * already in the payload.
 */

/** How many fields to put in one group before starting another. */
const GROUP_SIZE = 12;

export type ScaffoldMode = "sheet" | "form";

const SHEET_WIDGETS: Partial<Record<COLUMN_TYPE, string>> = {
    [COLUMN_TYPE.FILE]: "#SheetMediaFilesStrip",
    [COLUMN_TYPE.AVATAR]: "#SheetMediaAvatar",
    [COLUMN_TYPE.ADDRESS]: "#EmbeddedAddressCard",
};

const FORM_WIDGETS: Partial<Record<COLUMN_TYPE, string>> = {
    [COLUMN_TYPE.STRING]: "#Input",
    [COLUMN_TYPE.NUMBER]: "#Input",
    [COLUMN_TYPE.PERCENTAGE]: "#Input",
    [COLUMN_TYPE.BOOLEAN]: "#Switch",
    [COLUMN_TYPE.DATE]: "#DateInput",
    [COLUMN_TYPE.DATETIME]: "#DateInput",
    [COLUMN_TYPE.ENUM]: "#SimpleSelect",
    [COLUMN_TYPE.OBJECT_ID]: "#ApiSelect",
    [COLUMN_TYPE.FILE]: "#MediaField",
    [COLUMN_TYPE.AVATAR]: "#MediaField",
    [COLUMN_TYPE.ADDRESS]: "#FormAddressWithMap",
    [COLUMN_TYPE.ARRAY]: "#StringArrayField",
    [COLUMN_TYPE.MDIICON]: "#IconPicker",
};

/**
 * Widget for a path. Sheets default to `#DisplayCard`, which renders any scalar; forms
 * default to `#Input`, which is the safe thing to correct by hand.
 */
export function widgetForPath(entry: CoveragePath, mode: ScaffoldMode): string {
    const table = mode === "sheet" ? SHEET_WIDGETS : FORM_WIDGETS;
    const byType = entry.cellType ? table[entry.cellType] : undefined;
    if (byType) return byType;
    return mode === "sheet" ? "#DisplayCard" : "#Input";
}

/** Seeds the widget options the column metadata already answers. */
export function widgetPropsForPath(
    entry: CoveragePath,
    mode: ScaffoldMode,
): Record<string, unknown> | undefined {
    if (mode !== "form") return undefined;

    if (entry.cellType === COLUMN_TYPE.OBJECT_ID && entry.apiUrl) {
        return {apiUrl: entry.apiUrl, method: "POST", pageSize: 50};
    }
    if (entry.cellType === COLUMN_TYPE.ENUM && entry.enumValues?.length) {
        return {options: entry.enumValues.map((value) => ({value, label: value}))};
    }
    return undefined;
}

/** A single bound node, shaped correctly for the mode. */
export function scaffoldNode(entry: CoveragePath, mode: ScaffoldMode): ViewNode {
    const widget = widgetForPath(entry, mode);
    const widgetProps = widgetPropsForPath(entry, mode);
    return {
        render: mode === "form" ? "#Field" : widget,
        field: {
            name: entry.path,
            widget,
            /* Language keys are a per-page dictionary decision the config cannot know;
               the path is the honest placeholder and reads correctly in the preview. */
            label: entry.path,
            ...(widgetProps ? {widgetProps} : {}),
        },
    };
}

/**
 * A whole view body: grouped sections of bound fields.
 *
 * Nothing here is final — it is the boilerplate pass, so that hand-editing starts from
 * every field being present rather than from an empty tree.
 */
export function scaffoldNodes(
    entries: CoveragePath[],
    mode: ScaffoldMode,
    options: {groupTitle?: string} = {},
): ViewNode[] {
    const fields = entries.filter((entry) => entry.leaf);
    if (fields.length === 0) return [];

    const groups: ViewNode[] = [];
    for (let start = 0; start < fields.length; start += GROUP_SIZE) {
        const slice = fields.slice(start, start + GROUP_SIZE);
        const children = slice.map((entry) => scaffoldNode(entry, mode));
        const title = options.groupTitle
            ? groups.length === 0
                ? options.groupTitle
                : `${options.groupTitle}${groups.length + 1}`
            : `section${groups.length + 1}`;

        groups.push(
            mode === "sheet"
                ? {
                      render: "#SheetGroup",
                      props: {title},
                      children: [{render: "#SheetGrid", props: {columns: 3}, children}],
                  }
                : {
                      render: "#TitleWithCollapse",
                      props: {title},
                      children: [{render: "#FormGrid", props: {columns: 2}, children}],
                  },
        );
    }

    return groups;
}
