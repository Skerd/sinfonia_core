import type {
    TableColumnConfig,
} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators";
import {columnDeadEntries} from "../table/columnRelevance.ts";
import type {LintFinding, LintSeverity} from "./viewLint.ts";

/**
 * Static checks for table column config, mirroring `viewLint` for the view side.
 *
 * The failures here are quieter than a view's: a column with no derived filter never
 * appears in the Filter Builder, and an `objectId` column with no `refDisplayKey` renders
 * blank cells wherever the referenced document has no `name`. Both look like data problems
 * from the outside, which is why they cost time.
 *
 * `path` carries the column id rather than a node path, so the panel can select the column.
 */

export type TableLintContext = {
    /** Dotted paths the account may read; empty disables the coverage-shaped rule. */
    readPaths: string[];
};

export function lintTableColumns(
    columns: TableColumnConfig[],
    ctx: TableLintContext,
): LintFinding[] {
    const findings: LintFinding[] = [];
    const readSet = new Set(ctx.readPaths);

    for (const column of columns) {
        const add = (rule: string, severity: LintSeverity, message: string) =>
            findings.push({rule, severity, message, path: column.id, label: column.id});

        /* Meta the renderer will never read — the column inspector's dead-config strip,
           promoted to a finding so it is visible without selecting the column. */
        for (const entry of columnDeadEntries(column)) {
            add(
                "column-meta-dead",
                "error",
                `\`${entry.key}\` = ${JSON.stringify(entry.value)} — ${entry.reason}`,
            );
        }

        if (!column.filterConfig) {
            add(
                "column-not-filterable",
                "warning",
                "No derived filter config, so `tableConfigToFilterConfig` drops it and this column never reaches the Filter Builder.",
            );
        } else if (column.filterConfig.type !== column.cellType) {
            /* The cell renders per `cellType`, the filter builds per `filterConfig.type`. */
            add(
                "celltype-filter-mismatch",
                "warning",
                `Renders as \`${column.cellType}\` but filters as \`${column.filterConfig.type}\` — the cell and its filter will disagree.`,
            );
        }

        if (column.cellType === COLUMN_TYPE.OBJECT_ID && !column.meta?.refDisplayKey?.length) {
            add(
                "objectid-without-refdisplaykey",
                "warning",
                'Falls back to `["name"]`; if the referenced document has no `name`, every cell renders blank.',
            );
        }

        if (!column.visible && !column.filterConfig) {
            add(
                "column-unreachable",
                "warning",
                "Hidden by default and not filterable — nothing in the UI surfaces this column.",
            );
        }

        if (readSet.size > 0 && !readSet.has(column.id) && !column.dtoPath) {
            add(
                "column-path-not-readable",
                "warning",
                `\`${column.id}\` is not in the read allowlist, so the server omits its value and cells render empty.`,
            );
        }
    }

    const order: LintSeverity[] = ["error", "warning"];
    return findings.sort((a, b) => {
        const bySeverity = order.indexOf(a.severity) - order.indexOf(b.severity);
        if (bySeverity !== 0) return bySeverity;
        return a.path.localeCompare(b.path);
    });
}
