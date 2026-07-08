import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {GroupedPermissions} from "armonia/src/modules/core/api/company/private/roles/role.dto.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    PaginationState,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import {Input} from "@coreModule/components/ui/input.tsx";
import {SimpleSelect} from "@coreModule/components/custom/simpleSelect";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@coreModule/components/ui/table/table.tsx";
import {useEffect, useMemo, useState} from "react";
import {Check} from "lucide-react";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import PageController from "@coreModule/components/custom/paginator";
import {Checkbox} from "@coreModule/components/ui/checkbox.tsx";

export type PermissionTableRow = {
    id: string;
    name: string;
    readTags: string[];
    writeTags: string[];
    createTags: string[];
    deleteTags: string[];
    restoreTags: string[];
    readIds: string[];
    writeIds: string[];
    createIds: string[];
    deleteIds: string[];
    restoreIds: string[];
    model: string;
    scope: "self" | "others" | "global";
    groupDisplayName: string;
    read: boolean;
    write: boolean;
    create: boolean;
    delete: boolean;
    restore: boolean;
    readActive: boolean;
    writeActive: boolean;
    createActive: boolean;
    deleteActive: boolean;
    restoreActive: boolean;
};

/**
 * Mirrors buildPermissionTree: extracts action and path from tag.
 * Tag format: ModelKey[action:scope:path] e.g. user[read:self:username]
 */
function parsePermissionTag(tag: string): { action: string; path: string } | null {
    const match = tag.match(/\[(.+?)\]$/);
    if (!match) return null;
    const parts = match[1].split(":");
    const action = parts[0] ?? "";
    const pathRaw = parts.pop();
    const path = pathRaw?.trim() ?? "";
    return {action, path};
}

/**
 * Aggregates permissions by (model, scope, pathRaw). One row per unique group,
 * with read/write/create/delete/restore OR-ed from all permissions in that group.
 */
function flattenPermissionsToRows(
    permissions: GroupedPermissions | null | undefined,
    resolveLanguageKey: WithLanguageType["resolveLanguageKey"]
): PermissionTableRow[] {
    const aggregated = new Map<string, PermissionTableRow>();

    for (const [group, grouped] of Object.entries(permissions ?? {})) {
        for (const scope of ["self", "others"] as const) {
            const perms = grouped?.[scope] ?? [];
            for (const p of perms) {
                const parsed = parsePermissionTag(p.tag);
                if (!parsed) continue;

                const pathRaw = parsed.path;
                const pathKey = pathRaw || group;
                const rowKey = `${group}::${scope}::${pathKey}`;
                const groupDisplayName = pathRaw ? resolveLanguageKey(`permissions.${group}.${pathRaw}`) : resolveLanguageKey(`groups.${group}`);

                const existing = aggregated.get(rowKey);
                if (existing) {
                    if (parsed.action === "read") {
                        existing.read = true;
                        existing.readTags.push(p.tag);
                        existing.readIds.push(p._id);
                        existing.readActive = existing.readActive || !!p.active;
                    } else if (parsed.action === "write") {
                        existing.write = true;
                        existing.writeTags.push(p.tag);
                        existing.writeIds.push(p._id);
                        existing.writeActive = existing.writeActive || !!p.active;
                    } else if (parsed.action === "create") {
                        existing.create = true;
                        existing.createTags.push(p.tag);
                        existing.createIds.push(p._id);
                        existing.createActive = existing.createActive || !!p.active;
                    } else if (parsed.action === "delete") {
                        existing.delete = true;
                        existing.deleteTags.push(p.tag);
                        existing.deleteIds.push(p._id);
                        existing.deleteActive = existing.deleteActive || !!p.active;
                    } else if (parsed.action === "restore") {
                        existing.restore = true;
                        existing.restoreTags.push(p.tag);
                        existing.restoreIds.push(p._id);
                        existing.restoreActive = existing.restoreActive || !!p.active;
                    }
                } else {
                    aggregated.set(rowKey, {
                        id: rowKey,
                        name: groupDisplayName,
                        readTags: parsed.action === "read" ? [p.tag] : [],
                        writeTags: parsed.action === "write" ? [p.tag] : [],
                        createTags: parsed.action === "create" ? [p.tag] : [],
                        deleteTags: parsed.action === "delete" ? [p.tag] : [],
                        restoreTags: parsed.action === "restore" ? [p.tag] : [],
                        readIds: parsed.action === "read" ? [p._id] : [],
                        writeIds: parsed.action === "write" ? [p._id] : [],
                        createIds: parsed.action === "create" ? [p._id] : [],
                        deleteIds: parsed.action === "delete" ? [p._id] : [],
                        restoreIds: parsed.action === "restore" ? [p._id] : [],
                        model: group,
                        scope: p.tag.includes("self:") ? "self" : ( p.tag.includes("others") ? "others" : "global" ),
                        groupDisplayName,
                        read: parsed.action === "read",
                        write: parsed.action === "write",
                        create: parsed.action === "create",
                        delete: parsed.action === "delete",
                        restore: parsed.action === "restore",
                        readActive: parsed.action === "read" ? !!p.active : false,
                        writeActive: parsed.action === "write" ? !!p.active : false,
                        createActive: parsed.action === "create" ? !!p.active : false,
                        deleteActive: parsed.action === "delete" ? !!p.active : false,
                        restoreActive: parsed.action === "restore" ? !!p.active : false,
                    });
                }
            }
        }
    }

    return Array.from(aggregated.values()).sort((a, b) =>
        a.model.localeCompare(b.model) || a.groupDisplayName.localeCompare(b.groupDisplayName)
    );
}

type ActionCellProps = {
    hasPermission: boolean;
    checked: boolean;
    tags: string[];
    ids: string[];
    editable?: boolean;
    parentLoading?: boolean;
    onPermissionSelect?: (permissionId: string, selected: boolean) => void;
};

function ActionCell({hasPermission, checked, tags, ids, editable, parentLoading, onPermissionSelect}: ActionCellProps) {
    if (!hasPermission) return <span className="text-muted-foreground">—</span>;
    if (editable && ids.length > 0 && onPermissionSelect) {
        return (
            <div className="flex items-center" style={{border: "0px solid red"}}>
                <Checkbox
                    disabled={parentLoading}
                    checked={Boolean(checked)}
                    onCheckedChange={(e) => {
                        const selected = !!e;
                        ids.forEach((id) => onPermissionSelect(id, selected));
                    }}
                    aria-label={tags.length ? tags.join(", ") : undefined}
                />
            </div>
        );
    }
    if (!checked) return <span className="text-muted-foreground">—</span>;
    const content = (
        <div className="size-5 flex items-center justify-center">
            <Check className="size-5 text-green-600" aria-label="yes" />
        </div>
    );
    if (!tags.length) return content;
    return (
        <TooltipDisplayer tooltip={tags.join("\n")}>
            <span className="inline-flex cursor-default">{content}</span>
        </TooltipDisplayer>
    );
}

export type PermissionsTableProps = WithLanguageType & {
    permissions: GroupedPermissions | null | undefined;
    editable?: boolean;
    parentLoading?: boolean;
    forNewRole?: boolean;
    onPermissionSelect?: (permissionId: string, selected: boolean) => void;
};

function PermissionsTable({
    permissions,
    resolveLanguageKey,
    editable = false,
    parentLoading = false,
    forNewRole = false,
    onPermissionSelect
}: PermissionsTableProps) {
    const {read, create} = useAccess("roles");
    const [modelFilter, setModelFilter] = useState<string[]>([]);
    const [groupFilter, setGroupFilter] = useState("");
    const [targetFilter, setTargetFilter] = useState<"" | "self" | "others" | "all" | "global">("");
    const [sorting, setSorting] = useState<SortingState>([]);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });


    const data = useMemo(
        () => flattenPermissionsToRows(permissions, resolveLanguageKey),
        [permissions, resolveLanguageKey]
    );

    const modelOptions = useMemo(() => {
        const models = Array.from(new Set(data.map((row) => row.model))).sort();
        return models.map((model) => ({
            value: model,
            label: String(resolveLanguageKey(`groups.${model}`)),
        }));
    }, [data, resolveLanguageKey]);

    const filteredData = useMemo(() => {
        return data.filter((row) => {
            const modelMatch = modelFilter.length === 0 || modelFilter.includes(row.model);
            const groupMatch = !groupFilter || row.groupDisplayName.toLowerCase().includes(groupFilter.toLowerCase());
            const scopeMatch = !targetFilter || targetFilter === "all" ? true : row.scope === targetFilter;
            return modelMatch && groupMatch && scopeMatch;
        });
    }, [data, modelFilter, groupFilter, targetFilter]);

    useEffect(() => {
        const maxPage = Math.max(0, Math.ceil(filteredData.length / pagination.pageSize) - 1);
        if (pagination.pageIndex > maxPage) {
            setPagination((p) => ({ ...p, pageIndex: maxPage }));
        }
    }, [filteredData.length, pagination.pageSize, pagination.pageIndex]);

    const columns = useMemo<ColumnDef<PermissionTableRow>[]>(
        () => [
            {
                accessorKey: "model",
                header: () => resolveLanguageKey("model"),
                cell: ({row}) => row.original.model,
            },
            {
                accessorKey: "groupDisplayName",
                header: () => resolveLanguageKey("group"),
                cell: ({row}) => row.original.groupDisplayName,
            },
            {
                accessorKey: "scope",
                header: () => resolveLanguageKey("target"),
                cell: ({row}) => resolveLanguageKey(row.original.scope),
            },
            {
                accessorKey: "read",
                header: () => resolveLanguageKey("read"),
                cell: ({row}) => (
                    <ActionCell
                        hasPermission={row.original.read}
                        checked={row.original.readActive}
                        tags={row.original.readTags}
                        ids={row.original.readIds}
                        editable={editable}
                        parentLoading={parentLoading}
                        onPermissionSelect={onPermissionSelect}
                    />
                ),
            },
            {
                accessorKey: "write",
                header: () => resolveLanguageKey("write"),
                cell: ({row}) => (
                    <ActionCell
                        hasPermission={row.original.write}
                        checked={row.original.writeActive}
                        tags={row.original.writeTags}
                        ids={row.original.writeIds}
                        editable={editable}
                        parentLoading={parentLoading}
                        onPermissionSelect={onPermissionSelect}
                    />
                ),
            },
            {
                accessorKey: "create",
                header: () => resolveLanguageKey("create"),
                cell: ({row}) => (
                    <ActionCell
                        hasPermission={row.original.create}
                        checked={row.original.createActive}
                        tags={row.original.createTags}
                        ids={row.original.createIds}
                        editable={editable}
                        parentLoading={parentLoading}
                        onPermissionSelect={onPermissionSelect}
                    />
                ),
            },
            {
                accessorKey: "delete",
                header: () => resolveLanguageKey("delete"),
                cell: ({row}) => (
                    <ActionCell
                        hasPermission={row.original.delete}
                        checked={row.original.deleteActive}
                        tags={row.original.deleteTags}
                        ids={row.original.deleteIds}
                        editable={editable}
                        parentLoading={parentLoading}
                        onPermissionSelect={onPermissionSelect}
                    />
                ),
            },
            {
                accessorKey: "restore",
                header: () => resolveLanguageKey("restore"),
                cell: ({row}) => (
                    <ActionCell
                        hasPermission={row.original.restore}
                        checked={row.original.restoreActive}
                        tags={row.original.restoreTags}
                        ids={row.original.restoreIds}
                        editable={editable}
                        parentLoading={parentLoading}
                        onPermissionSelect={onPermissionSelect}
                    />
                ),
            },
        ],
        [resolveLanguageKey, editable, parentLoading]
    );

    const table = useReactTable({
        data: filteredData,
        columns,
        getRowId: (row) => row.id,
        state: {sorting, pagination},
        onSortingChange: setSorting,
        onPaginationChange: (updater) => {
            const next = typeof updater === "function" ? updater(pagination) : updater;
            setPagination(next);
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: false,
    });

    if ((forNewRole && !create) || !read?.permissions) {
        return <HiddenElement />;
    }

    const totalRows = filteredData.length;

    return (
        <div className="space-y-2 mt-2">
            <div className="flex flex-wrap items-center justify-between gap-2" style={{border: "0px solid red"}}>
                <div className="flex grow flex-wrap gap-2" style={{border: "0px solid red"}}>

                    <div className="min-w-[180px]">
                        <SimpleSelect
                            options={modelOptions}
                            value={modelFilter}
                            onValueChange={(v: string | string[]) => setModelFilter(Array.isArray(v) ? v : [])}
                            multiple
                            placeholder={String(resolveLanguageKey("filterByModel"))}
                        />
                    </div>
                    <Input
                        placeholder={resolveLanguageKey("filterByGroup")}
                        value={groupFilter}
                        onChange={(e) => setGroupFilter(e.target.value)}
                        className="max-w-[180px]"
                    />
                    <div className="min-w-[180px]">
                        <SimpleSelect
                            options={[
                                { value: "global", label: String(resolveLanguageKey("global")) },
                                { value: "self", label: String(resolveLanguageKey("self")) },
                                { value: "others", label: String(resolveLanguageKey("others")) },
                            ]}
                            value={targetFilter}
                            onValueChange={(v: string) => {
                                if (v === targetFilter) {
                                    setTargetFilter("");
                                } else {
                                    setTargetFilter((v as "" | "self" | "others" | "all" | "global") || "");
                                }
                            }}
                            placeholder={String(resolveLanguageKey("target"))}
                        />
                    </div>

                </div>

                <div>
                    <PageController
                        total={totalRows}
                        limit={pagination.pageSize}
                        loading={false}
                        setOffset={(offset: number) => setPagination((p) => ({ ...p, pageIndex: Math.floor(offset / p.pageSize) }))}
                        setLimit={(limit: number) => setPagination((p) => ({ ...p, pageSize: limit, pageIndex: 0 }))}
                    />
                </div>
            </div>
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        {
                            table.getHeaderGroups().map((headerGroup) => {
                                return (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id} className="whitespace-nowrap">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                )
                            })
                        }
                    </TableHeader>
                    <TableBody>
                        {
                            table.getRowModel().rows.length === 0 ?
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-16 text-center text-muted-foreground"
                                >
                                    {resolveLanguageKey("noData")}
                                </TableCell>
                            </TableRow>
                            :
                            table.getRowModel().rows.map((row) => {
                                return (
                                    <TableRow key={row.id}>
                                        {
                                            row.getVisibleCells().map((cell) => {
                                                return (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                )
                                            })
                                        }
                                    </TableRow>
                                )
                            })
                        }
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/roles/permissionsTable.tsx"),
    withDebug(true, true)
)(PermissionsTable);
