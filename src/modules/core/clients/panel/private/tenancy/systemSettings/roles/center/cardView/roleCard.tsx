import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {CompanyRole as CompanyRoleType} from "armonia/src/modules/core/api/company/private/roles/role.dto.ts";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@coreModule/components/ui/card.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import PermissionsTable from "@coreModule/clients/panel/private/tenancy/systemSettings/roles/permissionsTable.tsx";
import React, {useEffect, useMemo, useState} from "react";
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
    const [action, setAction] = useState("");
    const [role, setRole] = useState<CompanyRoleType>(roleProp);
    const [hideAfterDeletion, setHideAfterDeletion] = useState(false);

    const {read, restore} = useAccess("roles");

    const memoizedPermissionsTable = useMemo(() => {
        if (!role.permissions || !read?.permissions) return undefined;
        return <PermissionsTable permissions={role.permissions} />;
    }, [role.permissions, read?.permissions]);

    const onDelete = (data: DeletedData) => {
        if (!data.deletedBy && !data.deletedAt) {
            setHideAfterDeletion(true);
        } else if (onDeleteProp) {
            onDeleteProp(role, data);
        } else {
            setRole({...role, ...data});
        }
    };

    const onRestore = () => {
        if (onRestoreProp) {
            onRestoreProp();
        } else {
            setRole({
                ...role,
                deletedAt: undefined,
                deletedBy: undefined,
            });
        }
    };

    useEffect(() => {
        setRole(roleProp);
    }, [roleProp]);

    if (hideAfterDeletion || !restore) {
        return <></>;
    }
    if (!read || !Object.keys(read).length) {
        return <HiddenElement />;
    }

    return (
        <div className="rounded-xl relative overflow-hidden transition-all hover:shadow-md cursor-pointer flex w-full items-stretch">
            {(read.deletedBy || read.deletedAt) && (
                <DeletedInfo deletedAt={role.deletedAt} deletedBy={role.deletedBy} />
            )}

            <Card className="p-0 bg-muted/50 flex-1 min-w-0">
                <CardHeader className="group pt-3 pb-2">
                    <div className="flex items-center space-x-1 gap-2">
                        <div className="grow min-w-0">
                            <HiddenElement showLock randomLength={0}>
                                {read?.name && (
                                    <>
                                        {role.name ? <CardTitle>{role.name}</CardTitle> : <ValueNotSet />}
                                    </>
                                )}
                            </HiddenElement>
                            <HiddenElement showLock randomLength={0}>
                                {read?.slug && (
                                    <>
                                        {role.slug ? <CardDescription>{role.slug}</CardDescription> : <ValueNotSet />}
                                    </>
                                )}
                            </HiddenElement>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                            <ActionMenu
                                accessModel="roles"
                                deletedData={role}
                                onAction={(a: string) => setAction(a)}
                                editPath={roleEditPath(role)}
                                hideEdit={!role.canEdit}
                                hideDelete={!role.canDelete}
                            />
                        </div>
                        <Button variant="outline" size="icon-sm" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
                            {open ? <ChevronUp /> : <ChevronDown />}
                        </Button>
                    </div>

                    <Collapsible open={open} onOpenChange={setOpen} className="w-full">
                        <CollapsibleContent className="p-0">
                            <CardContent className="space-y-2 text-sm px-0 pt-0">
                                <HiddenElement>
                                    {read?.permissions && memoizedPermissionsTable}
                                </HiddenElement>
                            </CardContent>
                        </CollapsibleContent>
                    </Collapsible>
                </CardHeader>
            </Card>

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
        </div>
    );
});

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/roles/center/cardView/roleCard.tsx"),
    withDebug(true, true)
)(RoleCard);
