import {compose} from "redux";
import {useRef, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import Header from "@coreModule/components/custom/header.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {Button, ButtonTitle} from "@coreModule/components/ui/button.tsx";
import {useNavigate} from "react-router-dom";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import CardAndTableView from "@coreModule/components/custom/cardAndTableView.tsx";
import RoleCard from "@coreModule/clients/panel/private/tenancy/systemSettings/roles/center/cardView/roleCard.tsx";
import {RoleFormType} from "armonia/src/modules/core/api/company/private/roles/role.form.type.ts";
import {CompanyRole as CompanyRoleType} from "armonia/src/modules/core/api/company/private/roles/role.dto.ts";
import {IconUserPlus} from "@tabler/icons-react";
import RoleSheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/roles/center/sheetView/roleSheetView.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import DeleteAction from "@coreModule/components/custom/actions/deleteAction.tsx";
import RestoreAction from "@coreModule/components/custom/actions/restoreAction.tsx";
import type {DeletedData, TableResponse} from "armonia/src/modules/core/types/shared.types.ts";

function roleEditPath(role: CompanyRoleType) {
    const params = new URLSearchParams();
    params.set("roleId", role._id);
    if (role.name) params.set("roleName", role.name);
    return `/tenancy/systemSettings/roles/edit?${params.toString()}`;
}

type RolesProps = WithLanguageType & {};

function Roles({resolveLanguageKey}: RolesProps) {
    const navigate = useNavigate();
    const {create, read} = useAccess("roles");
    const [sheetRole, setSheetRole] = useState<CompanyRoleType | null>(null);
    const [action, setAction] = useState("");

    const listRef = useRef<{
        refetch: () => void;
        updateRow: (id: string | number, patch: Partial<CompanyRoleType>) => void;
    } | null>(null);

    const handleDelete = (r: CompanyRoleType, response?: DeletedData) => {
        if (response?.deletedAt != null || response?.deletedBy != null) {
            listRef.current?.updateRow?.(r._id, {
                deletedAt: response.deletedAt,
                deletedBy: response.deletedBy,
            });
        } else {
            listRef.current?.refetch?.();
        }
    };

    const handleRestore = (r: CompanyRoleType) => {
        listRef.current?.updateRow?.(r._id, {
            deletedAt: undefined,
            deletedBy: undefined,
        });
    };

    return (
        <div className="min-w-0 flex-full gap-4">
            <Header title={resolveLanguageKey("title")} description={resolveLanguageKey("description")}>
                <div className="flex items-center space-x-2">
                    <HiddenElement hideAll={true}>
                        {create && (
                            <Button
                                type="button"
                                onClick={(e) => {
                                    navigate("/tenancy/systemSettings/roles/create");
                                    e.stopPropagation();
                                    e.preventDefault();
                                }}
                            >
                                <IconUserPlus />
                                <ButtonTitle>{resolveLanguageKey("create")}</ButtonTitle>
                            </Button>
                        )}
                    </HiddenElement>
                </div>
            </Header>

            <HiddenElement hideAll={true}>
                {read && (
                    <CardAndTableView<TableResponse<CompanyRoleType>, RoleFormType>
                        url="/api/company/roles"
                        tableConfigKey="roles"
                        access="roles"
                        tableConfigOptions={{
                            filterConfig: {
                                placeholder: resolveLanguageKey("searchPlaceholder"),
                                fields: resolveLanguageKey("fields"),
                            },
                        }}
                        configurations={{limit: 20}}
                        containersClassName={{
                            cardViewClassName: "grid grid-cols-1 gap-3 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 pe-1",
                            scrollRootClassName: "flex-full",
                        }}
                        listRef={listRef}
                        renderFunctions={{
                            cardRender: (role) => (
                                <RoleCard
                                    role={role}
                                    onDelete={(row: CompanyRoleType | undefined, response?: DeletedData) =>
                                        handleDelete(row ?? role, response)
                                    }
                                    onRestore={() => handleRestore(role)}
                                />
                            ),
                            action: (role) => (
                                <ActionMenu
                                    accessModel="roles"
                                    deletedData={role}
                                    onAction={(a: string) => {
                                        setAction(a);
                                        setSheetRole(role);
                                    }}
                                    editPath={roleEditPath(role)}
                                    hideView={true}
                                    hideEdit={!role.canEdit}
                                    hideDelete={!role.canDelete}
                                />
                            ),
                        }}
                    />
                )}
            </HiddenElement>

            {!!action && !!sheetRole && (
                <>
                    {action === "view" && (
                        <RoleSheetView
                            open={action === "view"}
                            onOpenChange={() => {
                                setAction("");
                                setSheetRole(null);
                            }}
                            role={sheetRole}
                            onDelete={(data?: DeletedData) => handleDelete(sheetRole, data)}
                            onRestore={() => handleRestore(sheetRole)}
                        />
                    )}
                    {action === "delete" && (
                        <DeleteAction
                            accessModel="roles"
                            deleteId={sheetRole._id}
                            openAlert={action === "delete"}
                            name={read?.name && sheetRole.name}
                            confirmName={read?.name && sheetRole.name}
                            onSuccess={(data: DeletedData) => handleDelete(sheetRole, data)}
                            onCancel={() => {
                                setAction("");
                                setSheetRole(null);
                            }}
                            url="/api/company/roles"
                        />
                    )}
                    {action === "restore" && (
                        <RestoreAction
                            accessModel="roles"
                            deleteId={sheetRole._id}
                            openAlert={action === "restore"}
                            name={read?.name && sheetRole.name}
                            confirmName={read?.name && sheetRole.name}
                            onSuccess={() => handleRestore(sheetRole)}
                            onCancel={() => {
                                setAction("");
                                setSheetRole(null);
                            }}
                            url="/api/company/roles/restore"
                        />
                    )}
                </>
            )}
        </div>
    );
}

const RolesPage = compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/roles/index.tsx"),
    withDebug(true, true)
)(Roles);

export default RolesPage;
export {RolesPage};
