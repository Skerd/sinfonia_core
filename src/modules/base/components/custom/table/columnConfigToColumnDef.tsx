/**
 * Maps TableColumnConfig from the table-config API to TanStack Table ColumnDef.
 * Provides a cell renderer registry keyed by cellType.
 *
 * Every multi-value cell goes through {@link InlineItems}: the first
 * `meta.maxInlineItems` entries render inline and the rest collapse behind one
 * "+N more" popover. Before, each cell type hardcoded its own variant of that
 * rule, so an enum column swallowed all three values into "3 Status" while a
 * ref column next to it showed two badges and a counter.
 */

import type {ReactNode} from "react";
import type {ColumnDef, Row} from "@tanstack/react-table";
import type {EnumTone, TableColumnConfig} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type.ts";
import DataTableColumnHeader from "@coreModule/components/ui/table/column-header.tsx";
import TruncatedValue from "@coreModule/components/custom/displayValue/truncatedValue.tsx";
import {formatNumber} from "@baseModule/helpers/general/numbers.ts";
import {findFromLanguage, findFromObject} from "@baseModule/helpers/general/objectPath.ts";
import {TranslationValue} from "@baseModule/helpers/hocs/withLanguage.tsx";
import TableAvatar from "@coreModule/components/custom/avatar/tableAvatar.tsx";
import SingleFile from "@coreModule/components/custom/files/singleFile.tsx";
import {MdiIcon} from "@coreModule/components/custom/mdiIcons/mdiIcon.tsx";
import {IconCheck, IconFileLike, IconFileXFilled, IconX} from "@tabler/icons-react";
import useSelectedLanguage from "@baseModule/helpers/hooks/useSelectedLanguage.ts";
import {accessFieldPathExists} from "@baseModule/helpers/context/accessContext.tsx";
import TooltipDisplayer from "@baseModule/components/custom/tooltipDisplayer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import SheetMediaAvatar from "@baseModule/components/viewEngine/sheet/widgets/sheetMediaAvatar.tsx";
import CountryFlag from "@coreModule/components/custom/countryFlag.tsx";
import {enumLabel} from "@coreModule/components/custom/filterBuilder/filterValueInput.tsx";
import {
    DateCell,
    EmptyCell,
    InlineItems,
    TextBadge,
    TextCell,
} from "@baseModule/components/custom/table/tableCellPrimitives.tsx";
import {
    STATUS_BADGE_DANGER,
    STATUS_BADGE_INFO,
    STATUS_BADGE_NEUTRAL,
    STATUS_BADGE_SUCCESS,
    STATUS_BADGE_WARNING,
} from "@coreModule/components/custom/cards/entityCard.constants.ts";

export type ColumnConfigToColumnDefOptions<T> = {
    fields: TranslationValue;
    /** Render function for the actions column. Receives the row data. */
    renderActions?: (row: T) => ReactNode;
    timezone: string;
    /**
     * The resource's `read` map (from `useAccess`, so debug overrides are included).
     * Columns whose field it does not grant are dropped, matching cards and sheets.
     */
    read?: unknown;
};

/** Cell `meta` this file writes and the table header/body read back. */
type CellMeta = {className?: string; label?: string};

/* ── value access ─────────────────────────────────────────────────────────── */

/** The one place a cell value is read, so every cell type treats a miss the same way. */
function readCell<T>(row: Row<T>, col: TableColumnConfig): unknown {
    if (col.dtoPath) {
        return findFromObject(row.original, col.dtoPath);
    }
    if (!col.accessorPath) {
        return undefined;
    }
    try {
        return row.getValue(col.id);
    } catch {
        /* A column id TanStack does not know (stale config): fall back to the raw document. */
        return findFromObject(row.original, col.accessorPath);
    }
}


/** Non-null plain objects only: an array of ref ids never survives to the label builders. */
function toRecords(value: unknown): Record<string, unknown>[] {
    return (Array.isArray(value) ? value : [value]).filter(
        (item): item is Record<string, unknown> => item != null && typeof item === "object" && !Array.isArray(item),
    );
}

/* ── labels ───────────────────────────────────────────────────────────────── */

/**
 * `findFromLanguage` returns the key itself when the dictionary has no entry, so a
 * plain `?? fallback` never fires. Every lookup in this file goes through here.
 */
function translate(dictionary: TranslationValue, key: string, fallback: string): string {
    if (dictionary == null) return fallback;
    const value = findFromLanguage(dictionary, key);
    return typeof value === "string" && value !== key ? value : fallback;
}

/** `submissionDeadline` → `Submission Deadline`; the last resort when nothing is translated. */
function humanize(key: string): string {
    const leaf = key.split(".").pop() ?? key;
    return leaf
        .replace(/[_-]+/g, " ")
        .replace(/([a-z\d])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim()
        /* Title-cases every word, so the fallback reads right on its own rather than
           leaning on a `capitalize` class the popover copy of the badge might not have. */
        .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function labelFromFields(fields: TranslationValue, labelKey: string): string {
    return translate(fields, labelKey, humanize(labelKey));
}

/** Icons are stored as `mdiHomeVariant` / `mdi-home-variant`; the prefix is noise next to the glyph. */
function iconLabel(iconName: string): string {
    return humanize(iconName.replace(/^mdi[-_]?/i, "")) || iconName;
}

/* ── enum tone ────────────────────────────────────────────────────────────── */

/**
 * The client owns the palette and nothing else. Which *values* are a success or a
 * danger is a property of each schema's enum, so it is declared per field on
 * `dynamicTableConfiguration.enumTones` and arrives on `col.meta.enumTones` — a
 * list of every status string in the product has no business living in this file,
 * and would go stale the moment a module adds an enum.
 *
 * A value with no declared tone renders as a plain outline badge.
 */
const TONE_CLASSES: Record<EnumTone, string> = {
    success: STATUS_BADGE_SUCCESS,
    warning: STATUS_BADGE_WARNING,
    danger: STATUS_BADGE_DANGER,
    info: STATUS_BADGE_INFO,
    neutral: STATUS_BADGE_NEUTRAL,
};

/** Exported so cards and sheets can paint the same value the same way the table does. */
export function toneClass(tone: EnumTone | undefined): string | undefined {
    return tone ? TONE_CLASSES[tone] : undefined;
}

/* ── column widths ────────────────────────────────────────────────────────── */

/**
 * The table renders with `table-layout: fixed`, so these are what decide column
 * widths — nothing is measured from cell content. That is deliberate: the
 * virtualized table swaps its rows as you scroll, and under the default auto
 * layout each swap re-measures the columns and makes them jump.
 *
 * Numbers are px and only need to be about right; a column that does not fit
 * truncates with the value on `title`, and the table scrolls horizontally once
 * the total exceeds the container.
 */
const CELL_WIDTHS: Record<string, number> = {
    boolean: 90,
    avatar: 100,
    percentage: 110,
    number: 120,
    file: 140,
    date: 150,
    enum: 170,
    mdiicon: 170,
    datetime: 190,
    delete_status: 200,
    mixed: 200,
    array: 210,
    objectId: 220,
    address: 280,
};

/** Wide enough for a sortable header's label and its sort control. */
const DEFAULT_CELL_WIDTH = 220;
const ACTIONS_CELL_WIDTH = 64;

/* ── scalar formatting ────────────────────────────────────────────────────── */

const validatedTimeZones = new Map<string, string>();

/** An unknown IANA zone makes `Intl` throw on every single date cell, so check it once. */
function safeTimeZone(timezone: string | undefined): string {
    const candidate = timezone && timezone.trim() !== "" ? timezone : "UTC";
    const cached = validatedTimeZones.get(candidate);
    if (cached) return cached;
    let resolved = "UTC";
    try {
        new Intl.DateTimeFormat(undefined, {timeZone: candidate});
        resolved = candidate;
    } catch {
        resolved = "UTC";
    }
    validatedTimeZones.set(candidate, resolved);
    return resolved;
}

function toDate(raw: unknown): Date | null {
    if (raw == null || raw === "") return null;
    if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw;
    if (typeof raw !== "string" && typeof raw !== "number") return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * `useGrouping: "min2"` only groups from five digits up, so a year stays `2026`
 * instead of turning into `2,026`.
 */
function formatCellNumber(raw: unknown): string {
    const value = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(value)) return typeof raw === "string" ? raw : "";
    return formatNumber(value, {maximumFractionDigits: 4, useGrouping: "min2"});
}

function safeStringify(value: unknown): string {
    try {
        const json = JSON.stringify(value);
        return json ?? String(value);
    } catch {
        /* Circular documents (Mongoose `Mixed`) would otherwise take the whole table down. */
        return "{…}";
    }
}

/** Plain scalars only; anything structural is JSON so a cell never throws on an object child. */
function toText(value: unknown): string {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (value instanceof Date) return value.toISOString();
    return safeStringify(value);
}

/* ── column building ──────────────────────────────────────────────────────── */

/**
 * Drops the columns whose field the session cannot read, so a denied field leaves the table the
 * same way it leaves a card or a sheet. `true` is an allow-all grant, and `undefined` means the
 * caller is not gating yet (the access map has not loaded).
 */
function readableColumns(columns: TableColumnConfig[], read: unknown): TableColumnConfig[] {
    if (read === true || read == null) {
        return [...columns];
    }
    return columns.filter((col) => !col.accessorPath || accessFieldPathExists(read, col.accessorPath));
}

export function columnConfigToColumnDef<T>(columns: TableColumnConfig[], options: ColumnConfigToColumnDefOptions<T>): ColumnDef<T>[] {
    const {fields, renderActions, timezone, read} = options;

    /*
     * The one hook in this function: it must stay unconditional and at the top, because
     * the caller invokes `columnConfigToColumnDef` inline during its own render.
     */
    const {currentLanguage} = useSelectedLanguage("src/modules/core/helpers/mappers/columnConfigToColumnDef.tsx");

    const moreLabel = translate(currentLanguage, "more", "more");
    const yesLabel = translate(currentLanguage, "yes", "Yes");
    const noLabel = translate(currentLanguage, "no", "No");
    const timeZone = safeTimeZone(timezone);

    /* A field the session cannot read must not surface as a column either. */
    const allColumns = readableColumns(columns, read).map((col) => {
        const label = labelFromFields(fields, col.labelKey);
        const cellType = col.cellType as string;
        const isNumeric = cellType === "number" || cellType === "percentage";
        const maxInlineItems = col.meta?.maxInlineItems && col.meta.maxInlineItems > 0 ? col.meta.maxInlineItems : 2;
        const meta: CellMeta = {
            className: cn(col.meta?.className, isNumeric && "tabular-nums text-right") || undefined,
            label,
        };

        const base: ColumnDef<T> = {
            id: col.id,
            accessorKey: col.accessorPath,
            header: ({column}) => (
                <DataTableColumnHeader
                    column={column}
                    title={label}
                    className={isNumeric ? "justify-end text-right" : undefined}
                />
            ),
            meta,
            enableSorting: col.sortable,
            size: CELL_WIDTHS[cellType] ?? DEFAULT_CELL_WIDTH,
            minSize: 64,
        };

        if (cellType === "objectId") {
            const colMeta = col.meta;
            const displayFields = colMeta?.refDisplayKey ?? ["name"];
            const hrefTemplate = typeof colMeta?.hrefTemplate === "string" ? colMeta.hrefTemplate : "";
            const avatarPath = typeof colMeta?.avatarPath === "string" ? colMeta.avatarPath : "";
            const flagCodePath = typeof colMeta?.flagCodePath === "string" ? colMeta.flagCodePath : "";
            const toDisplayLabel = (item: Record<string, unknown>): string => {
                const hasLiteral = displayFields.some((f) => f.startsWith("!"));
                const parts = displayFields.map((f) => {
                    if (f.startsWith("!")) return f.slice(1);
                    const x = findFromObject(item, f);
                    return x == null || typeof x === "object" ? "" : String(x).trim();
                });
                return parts.filter((p) => p !== "").join(hasLiteral ? "" : " ");
            };
            /* A media id on the ref itself (`createdBy.photo`), populated or not. */
            const resolveMediaId = (item: Record<string, unknown>): string | null => {
                if (!avatarPath) return null;
                const raw = findFromObject(item, avatarPath);
                if (typeof raw === "string" && raw !== "") return raw;
                const id = (raw as {_id?: unknown} | null)?._id;
                return id != null && id !== "" ? String(id) : null;
            };
            /* An ISO code on the ref (`country.code`), which stands in for a photo. */
            const resolveFlagCode = (item: Record<string, unknown>): string | null => {
                if (!flagCodePath) return null;
                const raw = findFromObject(item, flagCodePath);
                return typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null;
            };
            const resolveHref = (item: Record<string, unknown>): string | null => {
                const id = item._id != null ? String(item._id) : "";
                if (!hrefTemplate || !id) return null;
                return hrefTemplate.replaceAll("{_id}", id);
            };
            return {
                ...base,
                cell: ({row}) => {
                    const items = toRecords(readCell(row, col))
                        .map((item, index) => ({
                            key: item._id != null ? String(item._id) : `ref-${index}`,
                            /* A ref with no display field still has to be clickable, so it borrows the column label. */
                            label: toDisplayLabel(item) || label,
                            href: resolveHref(item),
                            mediaId: resolveMediaId(item),
                            flagCode: resolveFlagCode(item),
                        }))
                        .filter(({label: text, href}) => text !== "" || !!href)
                        .map(({key, label: text, href, mediaId, flagCode}) => ({
                            key,
                            node: (
                                <TextBadge
                                    label={text}
                                    href={href}
                                    /* `Badge` is a fixed `h-5` pill that clips its overflow, so an
                                       avatar bigger than that gets its top and bottom shaved. Grow
                                       the pill instead and seat the photo flush inside it. */
                                    className={cn(mediaId && "h-7 gap-1.5 pl-0.5 pr-2.5")}
                                >
                                    {mediaId ? (
                                        <SheetMediaAvatar mediaId={mediaId} name={text} className="size-6 border-0 shadow-none" />
                                    ) : (
                                        /* A flag is a rectangle, so it needs no pill-growing. */
                                        flagCode && <CountryFlag code={flagCode} width={18} height={14} />
                                    )}
                                </TextBadge>
                            ),
                        }));
                    return <InlineItems items={items} max={maxInlineItems} moreLabel={moreLabel} />;
                },
            } as ColumnDef<T>;
        }

        if (cellType === "file") {
            return {
                ...base,
                cell: ({row}) => {
                    const raw = readCell(row, col);
                    const items = (Array.isArray(raw) ? raw : [raw])
                        .map((entry) => {
                            /* An unpopulated ref is a bare id string; `{_id: undefined}` used to reach the media URL. */
                            if (typeof entry === "string" && entry !== "") return {_id: entry} as Record<string, unknown>;
                            if (entry && typeof entry === "object" && (entry as {_id?: unknown})._id != null) {
                                return entry as Record<string, unknown>;
                            }
                            return null;
                        })
                        .filter((entry): entry is Record<string, unknown> => entry != null)
                        .map((media, index) => ({
                            key: String(media._id ?? index),
                            node: <SingleFile file={{_id: media._id, file: media}} isBig={false} table={true} />,
                        }));
                    return <InlineItems items={items} max={maxInlineItems} moreLabel={moreLabel} />;
                },
            } as ColumnDef<T>;
        }

        if (cellType === "mdiicon") {
            return {
                ...base,
                cell: ({row}) => {
                    const raw = readCell(row, col);
                    const items = (Array.isArray(raw) ? raw : [raw])
                        .filter((icon): icon is string => typeof icon === "string" && icon.trim() !== "")
                        .map((icon, index) => ({
                            key: `${icon}-${index}`,
                            node: (
                                <TextBadge label={iconLabel(icon)}>
                                    <MdiIcon icon={icon} size={0.9} showFallback />
                                </TextBadge>
                            ),
                        }));
                    return <InlineItems items={items} max={maxInlineItems} moreLabel={moreLabel} />;
                },
            } as ColumnDef<T>;
        }

        if (cellType === "avatar") {
            return {
                ...base,
                cell: ({row}) => {
                    const raw = readCell(row, col);
                    const items = (Array.isArray(raw) ? raw : [raw])
                        .map((entry) => {
                            if (typeof entry === "string" && entry !== "") return entry;
                            const id = (entry as {_id?: unknown} | null)?._id;
                            return id != null && id !== "" ? String(id) : null;
                        })
                        .filter((id): id is string => id != null)
                        .map((id) => ({key: id, node: <TableAvatar mediaId={id} />}));
                    return <InlineItems items={items} max={maxInlineItems} moreLabel={moreLabel} />;
                },
            } as ColumnDef<T>;
        }

        if (cellType === "boolean") {
            return {
                ...base,
                cell: ({row}) => {
                    const value = readCell(row, col);
                    if (value == null || value === "") return <EmptyCell />;
                    /*
                     * A read-only flag used to render as a disabled `Switch`, which reads as a
                     * control someone has taken away rather than as a value.
                     */
                    const on = value === true || value === 1 || value === "true";
                    /* The wrapper carries `title`/`role`: a `title` attribute on an inline
                       `<svg>` renders no tooltip — SVG wants a `<title>` child element. */
                    return (
                        <span role="img" aria-label={on ? yesLabel : noLabel} title={on ? yesLabel : noLabel}>
                            {on ? (
                                <IconCheck className="size-4 text-success" aria-hidden />
                            ) : (
                                <IconX className="size-4 text-muted-foreground" aria-hidden />
                            )}
                        </span>
                    );
                },
            } as ColumnDef<T>;
        }

        if (cellType === "date" || cellType === "datetime") {
            const withTime = cellType === "datetime";
            return {
                ...base,
                cell: ({row}) => {
                    const date = toDate(readCell(row, col));
                    if (!date) return <EmptyCell />;
                    return <DateCell date={date} timeZone={timeZone} withTime={withTime} />;
                },
            } as ColumnDef<T>;
        }

        if (cellType === "enum") {
            const enumTones = col.meta?.enumTones;
            return {
                ...base,
                cell: ({row}) => {
                    const raw = readCell(row, col);
                    const items = (Array.isArray(raw) ? raw : [raw])
                        .filter((value): value is string => typeof value === "string" && value !== "")
                        .map((value, index) => {
                            const translated = enumLabel(fields, col.id, value);
                            return {
                                key: `${value}-${index}`,
                                /* An untranslated value shows as `In Progress`, never as `!enums.status.in_progress`. */
                                node: (
                                    <TextBadge
                                        label={translated === value ? humanize(value) : translated}
                                        className={cn("capitalize", toneClass(enumTones?.[value]))}
                                    />
                                ),
                            };
                        });
                    return <InlineItems items={items} max={maxInlineItems} moreLabel={moreLabel} />;
                },
            } as ColumnDef<T>;
        }

        if (cellType === "array") {
            return {
                ...base,
                cell: ({row}) => {
                    const raw = readCell(row, col);
                    if (!Array.isArray(raw)) return <EmptyCell />;
                    const items = raw
                        .map((value) => toText(value))
                        .filter((text) => text !== "")
                        .map((text, index) => ({
                            key: `${text}-${index}`,
                            node: <TextBadge label={text} variant="secondary" />,
                        }));
                    return <InlineItems items={items} max={maxInlineItems} moreLabel={moreLabel} />;
                },
            } as ColumnDef<T>;
        }

        if (cellType === "mixed") {
            return {
                ...base,
                cell: ({row}) => {
                    const value = readCell(row, col);
                    if (value == null || value === "") return <EmptyCell />;
                    return (
                        <TruncatedValue preview="popover" className="max-w-48 font-mono text-xs">
                            {typeof value === "string" ? value : safeStringify(value)}
                        </TruncatedValue>
                    );
                },
            } as ColumnDef<T>;
        }

        if (cellType === "number" || cellType === "percentage") {
            const suffix = cellType === "percentage" ? "%" : "";
            return {
                ...base,
                cell: ({row}) => {
                    const raw = readCell(row, col);
                    if (raw == null || raw === "") return <EmptyCell />;
                    const values = (Array.isArray(raw) ? raw : [raw]).filter((value) => value != null && value !== "");
                    if (values.length === 0) return <EmptyCell />;
                    if (values.length === 1) {
                        return <span className="tabular-nums">{`${formatCellNumber(values[0])}${suffix}`}</span>;
                    }
                    const items = values.map((value, index) => ({
                        key: `${String(value)}-${index}`,
                        node: <TextBadge label={`${formatCellNumber(value)}${suffix}`} className="tabular-nums" />,
                    }));
                    return (
                        <div className="flex justify-end">
                            <InlineItems items={items} max={maxInlineItems} moreLabel={moreLabel} />
                        </div>
                    );
                },
            } as ColumnDef<T>;
        }

        if (cellType === "address") {
            const displayFields = col.meta?.refDisplayKey ?? ["street", "city.name", "state.name", "country.name", "postalCode"];
            const toDisplayLabel = (item: Record<string, unknown>): string =>
                displayFields
                    .map((f) => {
                        const x = findFromObject(item, f);
                        return x == null || typeof x === "object" ? "" : String(x).trim();
                    })
                    .filter(Boolean)
                    .join(", ");
            return {
                ...base,
                cell: ({row}) => {
                    const items = toRecords(readCell(row, col))
                        .map((item, index) => ({key: item._id != null ? String(item._id) : `address-${index}`, label: toDisplayLabel(item)}))
                        .filter(({label: text}) => text !== "")
                        .map(({key, label: text}) => ({key, node: <TextBadge label={text} />}));
                    return <InlineItems items={items} max={maxInlineItems} moreLabel={moreLabel} />;
                },
            } as ColumnDef<T>;
        }

        if (cellType === "delete_status") {
            return {
                ...base,
                cell: ({row}) => {
                    const deletedAt = toDate(readCell(row, col));
                    const tooltip = translate(currentLanguage, deletedAt ? "deleted" : "active", deletedAt ? "Deleted" : "Active");
                    return (
                        <TooltipDisplayer tooltip={tooltip}>
                            {deletedAt ? (
                                <div className="flex items-center gap-x-1">
                                    <IconFileXFilled className="size-4 shrink-0 text-destructive" aria-hidden />
                                    <DateCell date={deletedAt} timeZone={timeZone} withTime />
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <IconFileLike className="size-4 shrink-0 text-success" aria-hidden />
                                </div>
                            )}
                        </TooltipDisplayer>
                    );
                },
            } as ColumnDef<T>;
        }

        // string, unknown and anything a newer server sends that this client does not model yet
        return {
            ...base,
            cell: ({row}) => {
                const text = toText(readCell(row, col));
                if (text.trim() === "") return <EmptyCell />;
                return <TextCell value={text} />;
            },
        } as ColumnDef<T>;
    });

    if (renderActions) {
        allColumns.push({
            id: "actions",
            /*
             * No `meta.className`: the header and the body already pin `id === "actions"`
             * themselves, and the copy here fought them (`w-fit` against `w-[1%]`, `z-10`
             * against the header's `z-20`).
             */
            enableSorting: false,
            enableHiding: false,
            size: ACTIONS_CELL_WIDTH,
            minSize: ACTIONS_CELL_WIDTH,
            cell: ({row}) => renderActions(row.original),
        });
    }

    return allColumns;
}
