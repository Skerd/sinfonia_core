import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {CompanyRole as CompanyRoleType} from "armonia/src/modules/core/api/company/private/roles/role.dto.ts";
import {DeleteResponse} from "armonia/src/modules/core/types/shared.types.ts";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@coreModule/components/ui/sheet.tsx";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useMemo, useState} from "react";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import PermissionsTable from "@coreModule/clients/panel/private/tenancy/systemSettings/roles/permissionsTable.tsx";

export type RoleSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    role: CompanyRoleType;
    hideActions?: boolean;
    onDelete?: (response?: DeleteResponse) => void;
    onRestore?: () => void;
    isRestored?: boolean;
};

function roleEditPath(role: CompanyRoleType) {
    const params = new URLSearchParams();
    params.set("roleId", role._id);
    if (role.name) params.set("roleName", role.name);
    return `/tenancy/systemSettings/roles/edit?${params.toString()}`;
}

function RoleSheetView({
    open,
    onOpenChange,
    role,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    isRestored = false,
}: RoleSheetViewOwnProps & WithLanguageType) {
    const {read} = useAccess("roles");
    const [action, setAction] = useState("");

    const permissionsTable = useMemo(() => {
        if (!role.permissions || !read?.permissions) return null;
        return <PermissionsTable permissions={role.permissions} />;
    }, [role.permissions, read?.permissions]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="max-w-[95vw] lg:max-w-[60vw] min-w-[40vw] overflow-y-auto pb-[200px]">
                <SheetHeader className="flex p-0 group hover:cursor-pointer shadow-sm">
                    <div className="relative flex w-full items-stretch">
                        {(read?.deletedBy || read?.deletedAt) && (
                            <div className="h-full flex rounded-br-full items-stretch overflow-hidden">
                                <DeletedInfo
                                    restored={isRestored}
                                    deletedAt={role.deletedAt}
                                    deletedBy={role.deletedBy}
                                />
                            </div>
                        )}
                        <div className="flex items-start justify-between gap-2 p-2 w-full">
                            <div className="min-w-0 flex-1 space-y-1">
                                <SheetTitle>
                                    <HiddenElement>
                                        {read?.name && !!role.name && <span className="truncate">{role.name}</span>}
                                    </HiddenElement>
                                </SheetTitle>
                                <SheetDescription>
                                    <HiddenElement>
                                        {read?.slug && role.slug && <span className="text-sm">{role.slug}</span>}
                                    </HiddenElement>
                                </SheetDescription>
                            </div>
                            <div className="shrink-0">
                                {!hideActions && (
                                    <ActionMenu
                                        accessModel="roles"
                                        deletedData={role}
                                        onAction={(a: string) => setAction(a)}
                                        editPath={roleEditPath(role)}
                                        hideView={true}
                                        hideEdit={!role.canEdit}
                                        hideDelete={!role.canDelete}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </SheetHeader>

                <div className="px-4 pb-6 mt-4 space-y-6">
                    <HiddenElement>
                        {read?.permissions && permissionsTable && (
                            <div className="space-y-2">
                                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                    {resolveLanguageKey("permissions")}
                                </p>
                                <div className="rounded-lg border border-border/50 bg-muted/20 p-2">{permissionsTable}</div>
                            </div>
                        )}
                    </HiddenElement>
                </div>
            </SheetContent>

            {!!action && (
                <>
                    {action === "delete" && (
                        <DeleteAction
                            accessModel="roles"
                            deleteId={role._id}
                            openAlert={action === "delete"}
                            name={read?.name && role.name}
                            confirmName={read?.name && role.name}
                            onSuccess={onDelete}
                            onCancel={() => setAction("")}
                            url="/api/company/roles"
                        />
                    )}
                    {action === "restore" && (
                        <RestoreAction
                            accessModel="roles"
                            deleteId={role._id}
                            openAlert={action === "restore"}
                            name={read?.name && role.name}
                            confirmName={read?.name && role.name}
                            onSuccess={onRestore}
                            onCancel={() => setAction("")}
                            url="/api/company/roles/restore"
                        />
                    )}
                </>
            )}
        </Sheet>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/roles/center/sheetView/roleSheetView.tsx"),
    withDebug(true, true)
)(RoleSheetView);
