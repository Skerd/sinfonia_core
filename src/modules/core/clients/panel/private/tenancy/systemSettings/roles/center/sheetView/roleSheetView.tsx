import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess, accessFieldPathExists} from "@coreModule/helpers/hocs/withAccess.tsx";
import {CompanyRole as CompanyRoleType} from "armonia/src/modules/core/api/company/private/roles/role.dto.ts";
import {DeleteResponse} from "armonia/src/modules/core/types/shared.types.ts";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@coreModule/components/ui/sheet.tsx";
import {OverlayPortalContainer} from "@coreModule/components/ui/drawer.tsx";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useMemo, useState} from "react";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import PermissionsTable from "@coreModule/clients/panel/private/tenancy/systemSettings/roles/permissionsTable.tsx";
import DisplayCard from "@coreModule/components/custom/displayValue/displayCard.tsx";
import AccessFields from "@coreModule/components/custom/displayValue/accessFields.tsx";
import {SheetGroup} from "@coreModule/components/custom/renderEngine/layout/sheet/group.tsx";
import {SheetGrid} from "@coreModule/components/custom/renderEngine/layout/sheet/grid.tsx";
import {IconCalendar, IconUser} from "@tabler/icons-react";

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

    const showCreatedAt = accessFieldPathExists(read, "createdAt");
    const showUpdatedAt = accessFieldPathExists(read, "updatedAt");
    const showCreatedBy = accessFieldPathExists(read, "createdBy");
    const showDeletedAt = accessFieldPathExists(read, "deletedAt") && !!role.deletedAt;
    const showDeletedBy = accessFieldPathExists(read, "deletedBy") && !!role.deletedBy;
    const showLifecycle = showCreatedAt || showUpdatedAt || showCreatedBy || showDeletedAt || showDeletedBy;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="max-w-[95vw] lg:max-w-[60vw] min-w-[40vw] overflow-hidden p-0">
                <OverlayPortalContainer className="flex h-full min-h-0 flex-col overflow-hidden">
                <AccessFields read={read}>
                <SheetHeader className="flex shrink-0 p-0 group hover:cursor-pointer shadow-sm">
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
                            <div className="min-w-0 flex-1 gap-y-1">
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
                                {!!role.description && (
                                    <HiddenElement>
                                        {read?.description && (
                                            <p className="mt-1 text-sm leading-snug text-muted-foreground">
                                                {role.description}
                                            </p>
                                        )}
                                    </HiddenElement>
                                )}
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

                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pb-[200px] mt-4 gap-y-6">
                    <HiddenElement>
                        {read?.permissions && permissionsTable && (
                            <div className="flex flex-col gap-y-2">
                                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                    {resolveLanguageKey("permissions")}
                                </p>
                                <div className="rounded-lg border border-border/50 bg-muted/20 p-2">{permissionsTable}</div>
                            </div>
                        )}
                    </HiddenElement>
                    {showLifecycle && (
                        <SheetGroup
                            title="lifecycle"
                            resolveLanguageKey={resolveLanguageKey}
                            collapseStorageKey="roles-lifecycle"
                            defaultOpen={true}
                        >
                            <SheetGrid columns={3}>
                                {showCreatedAt && (
                                    <DisplayCard
                                        path="createdAt"
                                        type="dateTime"
                                        title={String(resolveLanguageKey("createdAt"))}
                                        tooltip={String(resolveLanguageKey("createdAt"))}
                                        Icon={IconCalendar}
                                        value={role.createdAt}
                                    />
                                )}
                                {showUpdatedAt && (
                                    <DisplayCard
                                        path="updatedAt"
                                        type="dateTime"
                                        title={String(resolveLanguageKey("updatedAt"))}
                                        tooltip={String(resolveLanguageKey("updatedAt"))}
                                        Icon={IconCalendar}
                                        value={role.updatedAt}
                                    />
                                )}
                                {showCreatedBy && (
                                    <DisplayCard
                                        path="createdBy"
                                        type="user"
                                        title={String(resolveLanguageKey("createdBy"))}
                                        tooltip={String(resolveLanguageKey("createdBy"))}
                                        Icon={IconUser}
                                        value={role.createdBy}
                                    />
                                )}
                                {showDeletedAt && (
                                    <DisplayCard
                                        path="deletedAt"
                                        type="dateTime"
                                        title={String(resolveLanguageKey("deletedAt"))}
                                        tooltip={String(resolveLanguageKey("deletedAt"))}
                                        Icon={IconCalendar}
                                        value={role.deletedAt}
                                    />
                                )}
                                {showDeletedBy && (
                                    <DisplayCard
                                        path="deletedBy"
                                        type="user"
                                        title={String(resolveLanguageKey("deletedBy"))}
                                        tooltip={String(resolveLanguageKey("deletedBy"))}
                                        Icon={IconUser}
                                        value={role.deletedBy}
                                    />
                                )}
                            </SheetGrid>
                        </SheetGroup>
                    )}
                </div>
                </AccessFields>
                </OverlayPortalContainer>
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
    withDebug(true, true, "roles")
)(RoleSheetView);
