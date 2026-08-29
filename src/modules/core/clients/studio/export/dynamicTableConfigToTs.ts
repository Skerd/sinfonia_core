import type {
    TableColumnConfig,
} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators";
import type {Change} from "./changeList.ts";

/**
 * Prints table-config edits as `dynamicTableConfiguration` blocks.
 *
 * Table columns are not an authored object anywhere: `buildTableConfig` derives them from
 * the Mongoose schema at boot, and the only authoring surface is the
 * `dynamicTableConfiguration` option on each schema path (declared in
 * `maestro/modules/core/database/types/mongoose-extensions.d.ts`). So the export target
 * is the schema file, one block per changed path — not a views file.
 */

/** `"enum"` → `"COLUMN_TYPE.ENUM"`, so the emitted code references the enum rather than a string. */
function columnTypeExpression(value: string): string {
    const match = Object.entries(COLUMN_TYPE).find(([, enumValue]) => enumValue === value);
    return match ? `COLUMN_TYPE.${match[0]}` : JSON.stringify(value);
}

/** The `dynamicTableConfiguration` keys the Studio can edit, in declaration order. */
type DynamicTableConfigPatch = {
    filterable?: boolean;
    visible?: boolean;
    sortable?: boolean;
    cellType?: string;
    dtoPath?: string;
    refDisplayKey?: string[];
    maxInlineItems?: number;
    hrefTemplate?: string;
    hideColumn?: boolean;
};

export type ColumnPatch = {
    /** Schema path — also the column `id` and `accessorPath`. */
    path: string;
    patch: DynamicTableConfigPatch;
};

function sameArray(a: string[] | undefined, b: string[] | undefined): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * Compares the served columns with the draft and returns only what differs, so the
 * developer pastes the minimum rather than re-declaring every default.
 */
export function diffTableColumns(
    before: TableColumnConfig[],
    after: TableColumnConfig[],
): ColumnPatch[] {
    const beforeById = new Map(before.map((column) => [column.id, column]));
    const afterById = new Map(after.map((column) => [column.id, column]));
    const patches: ColumnPatch[] = [];

    for (const column of after) {
        const original = beforeById.get(column.id);
        if (!original) continue;

        const patch: DynamicTableConfigPatch = {};
        if (column.visible !== original.visible) patch.visible = column.visible;
        if (column.sortable !== original.sortable) patch.sortable = column.sortable;
        if (column.cellType !== original.cellType) patch.cellType = column.cellType;
        if (column.dtoPath !== original.dtoPath) patch.dtoPath = column.dtoPath;
        if (!sameArray(column.meta?.refDisplayKey, original.meta?.refDisplayKey)) {
            patch.refDisplayKey = column.meta?.refDisplayKey;
        }
        if (column.meta?.maxInlineItems !== original.meta?.maxInlineItems) {
            patch.maxInlineItems = column.meta?.maxInlineItems;
        }
        if (column.meta?.hrefTemplate !== original.meta?.hrefTemplate) {
            patch.hrefTemplate = column.meta?.hrefTemplate;
        }
        /* Dropping `filterConfig` in the editor means "exclude from filter generation",
           which is `filterable: false` on the schema path. */
        if (!!original.filterConfig && !column.filterConfig) patch.filterable = false;
        if (!original.filterConfig && !!column.filterConfig) patch.filterable = true;

        if (Object.keys(patch).length > 0) patches.push({path: column.id, patch});
    }

    /* A column removed in the editor is `hideColumn: true` — it leaves both columns and filters. */
    for (const column of before) {
        if (!afterById.has(column.id)) {
            patches.push({path: column.id, patch: {hideColumn: true}});
        }
    }

    return patches;
}

const KEY_ORDER: (keyof DynamicTableConfigPatch)[] = [
    "filterable",
    "visible",
    "sortable",
    "cellType",
    "dtoPath",
    "refDisplayKey",
    "maxInlineItems",
    "hrefTemplate",
    "hideColumn",
];

function printPatch(patch: DynamicTableConfigPatch): string {
    const lines: string[] = [];
    for (const key of KEY_ORDER) {
        const value = patch[key];
        if (value === undefined) continue;
        const printed = key === "cellType" ? columnTypeExpression(String(value)) : JSON.stringify(value);
        lines.push(`        ${key}: ${printed},`);
    }
    return `    dynamicTableConfiguration: {\n${lines.join("\n")}\n    },`;
}

export function columnOrderChanged(
    before: TableColumnConfig[],
    after: TableColumnConfig[],
): boolean {
    const beforeIds = before.map((column) => column.id);
    const afterIds = after.map((column) => column.id).filter((id) => beforeIds.includes(id));
    const beforeFiltered = beforeIds.filter((id) => after.some((column) => column.id === id));
    return afterIds.join("|") !== beforeFiltered.join("|");
}

export function dynamicTableConfigToTs(
    collection: string,
    before: TableColumnConfig[],
    after: TableColumnConfig[],
): string {
    const patches = diffTableColumns(before, after);

    const header =
        `// ${collection} — paste each block onto the matching field in the Mongoose schema.\n` +
        `// Import: import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators";\n`;

    if (patches.length === 0 && !columnOrderChanged(before, after)) {
        return `${header}\n// No changes.\n`;
    }

    const blocks = patches
        .map(({path, patch}) => `// ${path}\n${printPatch(patch)}`)
        .join("\n\n");

    const orderNote = columnOrderChanged(before, after)
        ? `\n\n/*\n * Column order (top to bottom):\n * ${after
              .map((column) => column.id)
              .join(", ")}\n *\n * Nothing consumes this today. \`buildTableColumnsFromSchema\` accepts a\n * \`columnOrder\` argument, but \`buildTableConfig\` never passes one, so columns\n * follow schema-path order. Wiring it through is a separate Core decision.\n */\n`
        : "\n";

    return `${header}\n${blocks}${orderNote}`;
}

/** Change list entries for the table editor, in the same shape the dialog renders. */
export function tableChangeList(
    before: TableColumnConfig[],
    after: TableColumnConfig[],
): Change[] {
    const changes: Change[] = [];

    for (const {path, patch} of diffTableColumns(before, after)) {
        if (patch.hideColumn) {
            changes.push({kind: "removed", scope: "column", label: path, from: path});
            continue;
        }
        changes.push({
            kind: "changed",
            scope: "column",
            label: path,
            to: path,
            detail: Object.keys(patch)
                .map((key) => `${key}: ${JSON.stringify(patch[key as keyof typeof patch])}`)
                .join(", "),
        });
    }

    if (columnOrderChanged(before, after)) {
        changes.push({
            kind: "moved",
            scope: "column",
            label: "column order",
            from: before.map((column) => column.id).join(", "),
            to: after.map((column) => column.id).join(", "),
        });
    }

    return changes;
}
