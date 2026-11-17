import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useRef, useState} from "react";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import UsersInviteDialog from "@coreModule/clients/panel/private/users/inviteUser";
import CreateUsers from "@coreModule/clients/panel/private/users/createUser";
import {type EntityListApi} from "@coreModule/components/entityPage/list/cardAndTableView.tsx";
import EntityListPage, {EntityListHeader} from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import {UserCard} from "@coreModule/clients/panel/private/users/center/cardView";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/companyUser.dto.ts";
import EditUser from "@coreModule/clients/panel/private/users/editUser";
import EditUserAction from "@coreModule/clients/panel/private/users/center/actions/edit.tsx";
import {TableUpdateContext} from "@coreModule/helpers/context/tableUpdateContext.tsx";

export {useTableUpdate} from "@coreModule/helpers/hooks/useTableUpdate.ts";

type UsersProps = WithLanguageType & {
    administration: boolean;
};

function Users({resolveLanguageKey, administration}: UsersProps) {
    const listApiRef = useRef<EntityListApi<CompanyUserType> | null>(null);
    const [editingUser, setEditingUser] = useState<CompanyUserType | null>(null);

    const contextValue = {
        updateRow: (id: any, patch: any) => listApiRef.current?.updateRow?.(id, patch),
        refetch: () => listApiRef.current?.refetch?.(),
    };

    return (
        <TableUpdateContext.Provider value={contextValue}>
            <EntityListPage<CompanyUserType>
                apiUrl="/api/company/users"
                collectionName="users"
                accessModel="users"
                tableConfigKey="users"
                selfAccess={false}
                listApiRef={listApiRef}
                buildEditPath={() => ""}
                resolveLanguageKey={resolveLanguageKey}
                header={(ctx) => (
                    <EntityListHeader
                        ctx={ctx}
                        title={resolveLanguageKey(administration ? "administrationTitle" : "title")}
                        description={resolveLanguageKey(administration ? "administrationDescription" : "description")}
                        helpKey={administration ? "administrationHelp" : "help"}
                    >
                        <UsersInviteDialog administration={administration} />
                        <CreateUsers administration={administration} />
                    </EntityListHeader>
                )}
                extraParams={{administration, fetchAdministrationUsers: true}}
                // The person first; pictures and record dates stay one click away in the column menu (TD-F124).
                configurations={{limit: 20, columnVisibility: {photo: false, cover: false, createdAt: false, updatedAt: false}}}
                cardViewClassName="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 pe-1"
                rowActionMenu={{
                    hideView: true,
                    hideEdit: true,
                    hideDelete: true,
                    hideRestore: true,
                    allowMenuForCustomChildren: true,
                }}
                renderCard={(user) => <UserCard user={user} specificUserId={user._id} onEdit={setEditingUser} />}
                renderActionMenuChildren={(user) => (
                    <EditUserAction user={user} specificUserId={user._id} onEdit={setEditingUser} />
                )}
            />
            <EditUser user={editingUser} onClose={() => setEditingUser(null)} />
        </TableUpdateContext.Provider>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/users/index.tsx"),
    withDebug(true, true, "users")
)(Users);
