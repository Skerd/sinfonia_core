/**
 * Maps TableColumnConfig from the table-config API to TanStack Table ColumnDef.
 * Provides a cell renderer registry keyed by cellType.
 */

import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { TableColumnConfig } from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type.ts";
import DataTableColumnHeader from "@coreModule/components/ui/table/column-header.tsx";
import { LongText } from "@coreModule/components/custom/longText.tsx";
import {findFromLanguage, findFromObject, formatDate} from "@coreModule/helpers/general";
import {TranslationValue} from "@coreModule/helpers/hocs/withLanguage.tsx";
import TableAvatar from "@coreModule/components/custom/avatar/tableAvatar.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Switch} from "@coreModule/components/ui/switch.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import SingleFile from "@coreModule/components/custom/files/singleFile.tsx";
import { MdiIcon } from "@coreModule/components/custom/mdiIcons/mdiIcon.tsx";
import {IconFileLike, IconFileXFilled} from "@tabler/icons-react";
import useSelectedLanguage from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";

export type ColumnConfigToColumnDefOptions<T> = {
    fields: TranslationValue;
    /** Render function for the actions column. Receives the row data. */
    renderActions?: (row: T) => ReactNode;
    timezone: string;
};

export function columnConfigToColumnDef<T>(columns: TableColumnConfig[], options: ColumnConfigToColumnDefOptions<T>): ColumnDef<T>[] {
    const { fields, renderActions, timezone } = options;

    const whatToLoad = "src/modules/core/helpers/mappers/columnConfigToColumnDef.tsx";
    const {currentLanguage} = useSelectedLanguage(whatToLoad.replaceAll("/", "_"), whatToLoad);

    let allColumns = columns.map((col) => {
        const base: ColumnDef<T> = {
            id: col.id,
            accessorKey: col.accessorPath,
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column}
                    title={findFromLanguage(fields, col.labelKey)}
                />
            ),
            meta: {
                ...(col.meta?.className && { className: col.meta.className }),
                ...(col.labelKey && { label: findFromLanguage(fields, col.labelKey) }),
            },
            enableSorting: col.sortable,
        };

        // if (col.cellType === "avatar" || col.cellType === "photo") {
        //     return {
        //         ...base,
        //         cell: ({ row }) => (
        //             <div className="flex items-center justify-center">
        //                 <CustomAvatar
        //                     user={row.original as Parameters<typeof CustomAvatar>[0]["user"]}
        //                     avatarClassName="size-8"
        //                 />
        //             </div>
        //         ),
        //     } as ColumnDef<T>;
        // }
        //
        // if (col.cellType === "fullName") {
        //     return {
        //         ...base,
        //         cell: ({ row }) => (
        //             <LongText className="max-w-48">
        //                 {getName(row.original as Parameters<typeof getName>[0])}
        //             </LongText>
        //         ),
        //     } as ColumnDef<T>;
        // }
        //
        // if (col.cellType === "emailWithVerification") {
        //     return {
        //         ...base,
        //         cell: ({ row }) => {
        //             const data = row.original as T & {
        //                 username?: string;
        //                 unverifiedEmail?: string;
        //                 status?: string;
        //                 verified?: boolean;
        //             };
        //             const email = data.username || data.unverifiedEmail;
        //             return (
        //                 <LongText className="max-w-48">
        //                     <div className="flex items-center gap-2">
        //                         <TooltipDisplayer
        //                             tooltipRender={() => (
        //                                 <>
        //                                     {data.status === "invited" ? (
        //                                         <p>
        //                                             {resolveLanguageKey("invitedUser")}:{" "}
        //                                             <span className="font-semibold">
        //                                                 {data.username || data.unverifiedEmail || ""}
        //                                             </span>
        //                                         </p>
        //                                     ) : data.verified && !data.unverifiedEmail ? (
        //                                         <p>
        //                                             {resolveLanguageKey("emailVerified")}:{" "}
        //                                             <span className="font-semibold">{data.username}</span>
        //                                         </p>
        //                                     ) : (
        //                                         <div>
        //                                             <p>
        //                                                 {resolveLanguageKey("emailVerified")}:{" "}
        //                                                 <span className="font-semibold">{data.username}</span>
        //                                             </p>
        //                                             <p>
        //                                                 {resolveLanguageKey("emailNotVerified")}:{" "}
        //                                                 <span className="font-semibold">{data.unverifiedEmail}</span>
        //                                             </p>
        //                                         </div>
        //                                     )}
        //                                 </>
        //                             )}
        //                         >
        //                             {data.verified && !data.unverifiedEmail ? (
        //                                 <BadgeCheck size={18} className="text-blue-500 shrink-0" />
        //                             ) : (
        //                                 <BadgeAlert size={18} className="text-red-500 shrink-0" />
        //                             )}
        //                         </TooltipDisplayer>
        //                         {email ? (
        //                             <LongText className="max-w-full">
        //                                 <a className="hover:underline" href={`mailto:${email}`}>
        //                                     {email}
        //                                 </a>
        //                             </LongText>
        //                         ) : (
        //                             ""
        //                         )}
        //                     </div>
        //                 </LongText>
        //             );
        //         },
        //     } as ColumnDef<T>;
        // }
        //
        // if (col.cellType === "badge") {
        //     const badgeMapping = col.meta?.badgeMapping ?? {};
        //     return {
        //         ...base,
        //         cell: ({ row }) => {
        //             const value = row.getValue(col.accessorPath) as string | undefined;
        //             const badgeClass = statusBadgeClasses[value ?? ""] ?? "";
        //             const labelKey = badgeMapping[value ?? ""] ?? `statuses.${value}`;
        //             return (
        //                 <Badge variant="outline" className={`capitalize ${badgeClass}`}>
        //                     {resolveLanguageKey(labelKey)}
        //                 </Badge>
        //             );
        //         },
        //     } as ColumnDef<T>;
        // }
        //
        // if (col.cellType === "badgeMulti") {
        //     return {
        //         ...base,
        //         cell: ({ row }) => {
        //             const roles = row.getValue(col.accessorPath) as Array<{ name?: string }> | undefined;
        //             return (
        //                 <div className="flex flex-wrap gap-1">
        //                     {roles?.map((r, i) => (
        //                         <Badge key={i} variant="outline" className="capitalize">
        //                             {r.name}
        //                         </Badge>
        //                     )) ?? "—"}
        //                 </div>
        //             );
        //         },
        //     } as ColumnDef<T>;
        // }
        //

        if( col.cellType === "objectId" ){
            const displayFields = (col.meta as { refDisplayKey?: string[] } | undefined)?.refDisplayKey ?? ["name"];
            const getByPath = (obj: Record<string, unknown>, path: string): unknown =>
                path.split(".").reduce((a, k) => (a as Record<string, unknown>)?.[k], obj);
            const toDisplayLabel = (item: Record<string, unknown>): string => {
                const parts = displayFields.map((f: string) => {
                    const x = getByPath(item, f);
                    return x == null || typeof x === "object" ? "" : String(x).trim();
                });
                return parts.filter(Boolean).join(" ") || "";
            };
            return {
                ...base,
                cell: ({ row }) => {
                    let value = (col.dtoPath ? findFromObject(row.original, col.dtoPath) : row.getValue(col.accessorPath)) as Record<string, unknown> | Record<string, unknown>[] | undefined;
                    if( !value ) return <></>;
                    const items = Array.isArray(value) ? value : [value];
                    if (items.length > 2) {
                        return (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                                        {items.length} {findFromLanguage(fields, col.labelKey)}
                                    </Badge>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-auto max-w-lg px-2">
                                    <div className="max-h-60 w-fit overflow-y-auto flex flex-col gap-1.5">
                                        {items.map((item, i) => (
                                            <Badge variant="outline" key={i} className="text-sm">{toDisplayLabel(item)}</Badge>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        );
                    }
                    return (
                        <div className="flex items-center gap-1 flex-wrap">
                            {items.map((item, i) => (
                                <Badge key={i} variant="outline">{toDisplayLabel(item)}</Badge>
                            ))}
                        </div>
                    );
                },
            } as ColumnDef<T>;
        }

        if( col.cellType === "file" ){
            return {
                ...base,
                cell: ({ row }) => {
                    const value = (col.dtoPath ? findFromObject(row.original, col.dtoPath) : row.getValue(col.accessorPath)) as string | string[] | any | undefined;
                    if (!value) return "";
                    const ids = Array.isArray(value) ? value.filter(Boolean) : [value];
                    if (ids.length === 0) return "";
                    const fileBadge = (file: any) => (
                        <SingleFile
                            file={{_id: file._id, file: file}}
                            isBig={false}
                            table={true}
                        />
                        // <Badge key={i} variant="outline" className="text-sm font-normal">[FILE]</Badge>
                    );
                    if (ids.length > 2) {
                        return (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                                        {ids.length} {findFromLanguage(fields, col.labelKey)}
                                    </Badge>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-auto max-w-2xl ps-2 pe-1">
                                    <div className="min-h-[500px] max-h-[500px] w-fit overflow-y-auto flex flex-col gap-1.5 pe-1">
                                        {ids.map((id) => fileBadge(id))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        );
                    }
                    return (
                        <div className="flex items-center gap-1 flex-wrap">
                            {ids.map((id) => fileBadge(id))}
                        </div>
                    );
                },
            } as ColumnDef<T>;
        }

        if ((col.cellType as string) === "mdiicon") {
            return {
                ...base,
                cell: ({ row }) => {
                    const value = (col.dtoPath ? findFromObject(row.original, col.dtoPath) : row.getValue(col.accessorPath)) as string | string[] | undefined;
                    if (!value) return "";
                    const icons = (Array.isArray(value) ? value : [value]).filter(Boolean);
                    if (icons.length === 0) return "";
                    const iconBadge = (iconName: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-sm font-normal capitalize">
                            <MdiIcon icon={iconName} size={0.9} showFallback />
                            <span className="ms-1">{iconName}</span>
                        </Badge>
                    );
                    if (icons.length > 2) {
                        return (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                                        {icons.length} {findFromLanguage(fields, col.labelKey)}
                                    </Badge>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-auto max-w-2xl ps-2 pe-1">
                                    <div className="max-h-[500px] w-fit overflow-y-auto flex flex-col gap-1.5 pe-1">
                                        {icons.map((iconName, i) => iconBadge(iconName, i))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        );
                    }
                    return (
                        <div className="flex items-center gap-1 flex-wrap">
                            {icons.map((iconName, i) => iconBadge(iconName, i))}
                        </div>
                    );
                },
            } as ColumnDef<T>;
        }

        if( col.cellType === "avatar" ){
            return {
                ...base,
                cell: ({ row }) => {
                    const value = (col.dtoPath ? findFromObject(row.original, col.dtoPath) : row.getValue(col.accessorPath)) as string | string[] | {_id: string} | undefined;
                    if (!value) return "";
                    const ids = Array.isArray(value) ? value.filter(Boolean) : [value];
                    if (ids.length === 0) return "";
                    if (ids.length > 2) {
                        return (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                                        {ids.length} {findFromLanguage(fields, col.labelKey)}
                                    </Badge>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-auto max-w-lg px-2">
                                    <div className="max-h-60 w-fit overflow-y-auto flex flex-col gap-1.5">
                                        {
                                            ids.map((id, i) => (<TableAvatar key={i} mediaId={typeof id === "string" ? id : id._id} />))
                                        }
                                    </div>
                                </PopoverContent>
                            </Popover>
                        );
                    }
                    return (
                        <div className="flex items-center gap-1">
                            {
                                ids.map((id, i) => (<TableAvatar key={i} mediaId={typeof id === "string" ? id : id._id} />))
                            }
                        </div>
                    );
                },
            } as ColumnDef<T>;
        }

        if( col.cellType === "boolean" ){
            return {
                ...base,
                cell: ({ row }) => {
                    const value = (col.dtoPath ? findFromObject(row.original, col.dtoPath) : row.getValue(col.accessorPath)) as boolean | undefined;
                    return (
                        <div className="flex items-center" style={{border: "0px solid red"}}>
                            {/*<Badge variant="outline" className={cn("capitalize", value ? "bg-green-500" : "bg-red-500")}>*/}
                            {/*    <Check />*/}
                            {/*    <CircleSlash />*/}
                            {/*</Badge>*/}
                            <Switch disabled={false} checked={value}/>

                            {/*<Checkbox*/}
                            {/*    id={col.id}*/}
                            {/*    name={col.accessorPath}*/}
                            {/*    defaultChecked={!value}*/}
                            {/*    disabled={true}*/}
                            {/*    className="size-4"*/}
                            {/*/>*/}
                        </div>

                    )
                },
            } as ColumnDef<T>;
        }

        if (col.cellType === "date" || col.cellType === "datetime") {
            const isDateTime = col.cellType === "datetime";
            return {
                ...base,
                cell: ({ row }) => {
                    const date = (col.dtoPath ? findFromObject(row.original, col.dtoPath) : row.getValue(col.accessorPath)) as Date | string | undefined;
                    if (!date) return "";
                    try {
                        return formatDate(new Date(date), {
                            timeZone: timezone ?? "UTC",
                            format: isDateTime
                                ? { dateStyle: "long", timeStyle: "medium" }
                                : { dateStyle: "long" },
                        });
                    } catch {
                        return "";
                    }
                },
            } as ColumnDef<T>;
        }

        if (col.cellType === "enum") {
            return {
                ...base,
                cell: ({ row }) => {
                    const raw = (col.dtoPath ? findFromObject(row.original, col.dtoPath) : row.getValue(col.accessorPath)) as string | string[] | undefined;
                    if (raw == null || raw === "") return "";
                    const values = Array.isArray(raw) ? raw : [raw];
                    if (values.length > 2) {
                        return (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                                        {values.length} {findFromLanguage(fields, col.labelKey)}
                                    </Badge>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-auto max-w-lg px-2">
                                    <div className="max-h-60 w-fit overflow-y-auto flex flex-col gap-1.5">
                                        {values.map((v, i) => (
                                            <Badge key={i} variant="outline" className="text-sm capitalize font-normal">
                                                {findFromLanguage(fields, "!enums." + col.id + "." + v) ?? v}
                                            </Badge>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        );
                    }
                    return (
                        <div className="flex flex-wrap gap-1">
                            {values.map((v, i) => (
                                <Badge key={i} variant="outline" className="capitalize1xs font-normal">
                                    {findFromLanguage(fields, "!enums." + col.id + "." + v) ?? v}
                                </Badge>
                            ))}
                        </div>
                    );
                },
            } as ColumnDef<T>;
        }

        const cellType = col.cellType as string;
        if (cellType === "array") {
            return {
                ...base,
                cell: ({ row }) => {
                    const raw = (col.dtoPath ? findFromObject(row.original, col.dtoPath) : row.getValue(col.accessorPath)) as unknown[] | undefined;
                    if (raw == null || !Array.isArray(raw)) return "";
                    const parts = raw.map((v) => (v == null || typeof v === "object" ? JSON.stringify(v) : String(v)));
                    if (parts.length > 2) {
                        return (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Badge variant="secondary" className="cursor-pointer hover:bg-accent font-normal">
                                        {parts.length} {findFromLanguage(fields, col.labelKey)}
                                    </Badge>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-auto max-w-lg px-2">
                                    <div className="max-h-60 w-fit overflow-y-auto flex flex-col gap-1.5">
                                        {parts.map((p, i) => (
                                            <Badge key={i} variant="secondary" className="text-sm font-normal">
                                                {p}
                                            </Badge>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        );
                    }
                    return (
                        <div className="flex flex-wrap gap-1">
                            {parts.map((p, i) => (
                                <Badge key={i} variant="secondary" className="font-normal">
                                    {p}
                                </Badge>
                            ))}
                        </div>
                    );
                },
            } as ColumnDef<T>;
        }

        if (cellType === "mixed") {
            return {
                ...base,
                cell: ({ row }) => {
                    const value = (col.dtoPath ? findFromObject(row.original, col.dtoPath) : row.getValue(col.accessorPath)) as unknown;
                    if (value == null) return "";
                    return (
                        <LongText className="max-w-48 font-mono text-xs">
                            {typeof value === "object" ? JSON.stringify(value) : JSON.stringify(value)}
                        </LongText>
                    );
                },
            } as ColumnDef<T>;
        }

        if (col.cellType === "number") {
            return {
                ...base,
                cell: ({ row }) => {
                    const value = (col.dtoPath ? findFromObject(row.original, col.dtoPath) : row.getValue(col.accessorPath)) as number | number[] | undefined;
                    if (value == null) return <div />;
                    const items = Array.isArray(value) ? value : [value];
                    if (items.length > 2) {
                        return (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                                        {items.length} {findFromLanguage(fields, col.labelKey)}
                                    </Badge>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-auto max-w-lg px-2">
                                    <div className="max-h-60 w-fit overflow-y-auto flex flex-col gap-1.5">
                                        {items.map((v, i) => (
                                            <Badge key={i} variant="outline" className="text-sm">
                                                {String(v ?? "")}
                                            </Badge>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        );
                    }
                    if (items.length > 1) {
                        return (
                            <div className="flex items-center gap-1 flex-wrap">
                                {items.map((v, i) => (
                                    <Badge key={i} variant="outline">{String(v ?? "")}</Badge>
                                ))}
                            </div>
                        );
                    }
                    return <div>{String(items[0] ?? "")}</div>;
                },
            } as ColumnDef<T>;
        }

        if (col.cellType === "percentage") {
            return {
                ...base,
                cell: ({ row }) => {
                    const value = (col.dtoPath ? findFromObject(row.original, col.dtoPath) : row.getValue(col.accessorPath)) as number | number[] | undefined;
                    if (value == null) return <div />;
                    const items = Array.isArray(value) ? value : [value];
                    if (items.length > 2) {
                        return (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                                        {items.length} {findFromLanguage(fields, col.labelKey)}
                                    </Badge>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-auto max-w-lg px-2">
                                    <div className="max-h-60 w-fit overflow-y-auto flex flex-col gap-1.5">
                                        {items.map((v, i) => (
                                            <Badge key={i} variant="outline" className="text-sm">
                                                {String(v ?? "")}%
                                            </Badge>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        );
                    }
                    if (items.length > 1) {
                        return (
                            <div className="flex items-center gap-1 flex-wrap">
                                {items.map((v, i) => (
                                    <Badge key={i} variant="outline">{String(v ?? "")}%</Badge>
                                ))}
                            </div>
                        );
                    }
                    return <div>{String(items[0] ?? "")}%</div>;
                },
            } as ColumnDef<T>;
        }

        if (col.cellType === "address") {
            const displayFields = (col.meta as { refDisplayKey?: string[] } | undefined)?.refDisplayKey ?? ["street", "city.name", "state.name", "country.name", "postalCode"];
            const getByPath = (obj: Record<string, unknown>, path: string): unknown => path.split(".").reduce((a, k) => (a as Record<string, unknown>)?.[k], obj);
            const toDisplayLabel = (item: Record<string, unknown>): string => {
                const parts = displayFields.map((f: string) => {
                    const x = getByPath(item, f);
                    return x == null || typeof x === "object" ? "" : String(x).trim();
                });
                return parts.filter(Boolean).join(", ") || "";
            };
            return {
                ...base,
                cell: ({ row }) => {
                    let value = (col.dtoPath ? findFromObject(row.original, col.dtoPath) : row.getValue(col.accessorPath)) as Record<string, unknown> | Record<string, unknown>[] | undefined;
                    if (!value) return <></>;
                    const items = Array.isArray(value) ? value : [value];
                    if (items.length > 2) {
                        return (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                                        {items.length} {findFromLanguage(fields, col.labelKey)}
                                    </Badge>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-auto max-w-lg px-2">
                                    <div className="max-h-60 w-fit overflow-y-auto flex flex-col gap-1.5">
                                        {
                                            items.map((item, i) => (
                                            <Badge variant="outline" key={i} className="text-sm">{toDisplayLabel(item)}</Badge>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        );
                    }
                    return (
                        <div className="flex items-center gap-1 flex-wrap">
                            {items.map((item, i) => (
                                <Badge key={i} variant="outline">{toDisplayLabel(item)}</Badge>
                            ))}
                        </div>
                    );
                },
            } as ColumnDef<T>;
        }

        if( col.cellType === "delete_status"){
            return {
                ...base,
                cell: ({ row }) => {
                    const value = (col.dtoPath ? findFromObject(row.original, col.dtoPath) : row.getValue(col.accessorPath)) as string | undefined;
                    return (
                        <TooltipDisplayer tooltip={(currentLanguage ? currentLanguage[ !!value ? "deleted" : "active" ] : "") as TranslationValue}>
                            {
                                !!value ?
                                    <div className="flex items-center space-x-1">
                                        <IconFileXFilled className="text-red-500" />
                                        <p>{formatDate(new Date(value), {
                                            timeZone: timezone ?? "UTC",
                                            format: { dateStyle: "long", timeStyle: "medium" }
                                        })}</p>
                                    </div>
                                    :
                                    <IconFileLike className="text-green-400" />
                            }
                        </TooltipDisplayer>
                    )
                },
            } as ColumnDef<T>;
        }

        // text, longText, email, link
        return {
            ...base,
            cell: ({ row }) => {
                const value = (col.dtoPath ? findFromObject(row.original, col.dtoPath) : row.getValue(col.accessorPath)) as string | undefined;
                return (
                    <LongText className="max-w-48">
                       {value}
                    </LongText>
                )
            },
        } as ColumnDef<T>;
    });

    if( !!renderActions ){
        allColumns.push({
            id: "actions",
            meta: { className: "w-fit text-right pr-3" },
            cell: ({ row }) => renderActions(row.original),
        })
    }

    return allColumns;

}
