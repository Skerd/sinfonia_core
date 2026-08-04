import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {CompanyRole as CompanyRoleType} from "armonia/src/modules/core/api/company/private/roles/role.dto.ts";
import {CardContent} from "@coreModule/components/ui/card.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import PermissionsTable from "@coreModule/clients/panel/private/tenancy/systemSettings/roles/permissionsTable.tsx";
import React, {useMemo, useState} from "react";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import DeletedInfo from "@coreModule/components/custom/deletedInfo";
import {ChevronDown, ChevronUp} from "lucide-react";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Collapsible, CollapsibleContent} from "@coreModule/components/ui/collapsible.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import RoleSheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/roles/center/sheetView/roleSheetView.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import {useEntityCard} from "@coreModule/helpers/hooks/useEntityCard.ts";
import {EntityCardShell} from "@coreModule/components/custom/cards/EntityCardShell.tsx";
import {EntityTextCardHeader} from "@coreModule/components/custom/cards/EntityTextCardHeader.tsx";

function roleEditPath(role: CompanyRoleType) {
    const params = new URLSearchParams();
    params.set("roleId", role._id);
    if (role.name) params.set("roleName", role.name);
    return `/tenancy/systemSettings/roles/edit?${params.toString()}`;
}

type RoleCardProps = WithLanguageType & {
    role: CompanyRoleType;
    onDelete?: (deletedRole?: CompanyRoleType, response?: DeletedData) => void;
    onRestore?: () => void;
};

const RoleCard = React.memo(function RoleCard({
    role: roleProp,
    onDelete: onDeleteProp,
    onRestore: onRestoreProp,
    resolveLanguageKey: _resolveLanguageKey,
}: RoleCardProps) {
    const [open, setOpen] = useState(false);
    const {
        action,
        setAction,
        entity: role,
        hideAfterDeletion,
        onDelete,
        onRestore,
    } = useEntityCard({
        entityProp: roleProp,
        onDeleteProp,
        onRestoreProp,
    });

    const {read, restore} = useAccess("roles");

    const memoizedPermissionsTable = useMemo(() => {
        if (!role.permissions || !read?.permissions) return undefined;
        return <PermissionsTable permissions={role.permissions} />;
    }, [role.permissions, read?.permissions]);

    if (hideAfterDeletion || !restore) {
        return <></>;
    }
    if (!read || !Object.keys(read).length) {
        return <HiddenElement />;
    }

    return (
        <>
            <EntityCardShell onClick={() => setAction("view")} className="bg-muted/50">
                <div className="flex w-full items-stretch">
                    {(read.deletedBy || read.deletedAt) && (
                        <DeletedInfo deletedAt={role.deletedAt} deletedBy={role.deletedBy} />
                    )}
                    <div className="w-full min-w-0">
                        <EntityTextCardHeader
                            title={role.name ? role.name : <ValueNotSet />}
                            subtitle={role.slug ? role.slug : undefined}
                            showTitle={!!read?.name}
                            showSubtitle={!!read?.slug}
                            actionMenu={
                                <div className="flex items-center gap-1">
                                    <ActionMenu
                                        accessModel="roles"
                                        deletedData={role}
                                        onAction={(a: string) => setAction(a)}
                                        editPath={roleEditPath(role)}
                                        hideEdit={!role.canEdit}
                                        hideDelete={!role.canDelete}
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpen(!open);
                                        }}
                                    >
                                        {open ? <ChevronUp /> : <ChevronDown />}
                                    </Button>
                                </div>
                            }
                        />
                        <Collapsible open={open} onOpenChange={setOpen} className="w-full">
                            <CollapsibleContent className="p-0">
                                <CardContent className="flex flex-col gap-y-2 text-sm px-2 pt-0 pb-2">
                                    <HiddenElement>
                                        {read?.permissions && memoizedPermissionsTable}
                                    </HiddenElement>
                                </CardContent>
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </div>
            </EntityCardShell>

            {!!action && (
                <>
                    {action === "view" && (
                        <RoleSheetView
                            open={action === "view"}
                            onOpenChange={() => setAction("")}
                            role={role}
                            onDelete={onDelete}
                            onRestore={onRestore}
                        />
                    )}
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
        </>
    );
});

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/roles/center/cardView/roleCard.tsx"),
    withDebug(true, true)
)(RoleCard);
