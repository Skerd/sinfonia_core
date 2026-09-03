import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useEffect, useRef} from "react";
import {compose} from "redux";
import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import UsersInviteDialog from "@coreModule/clients/panel/private/users/inviteUser";
import CreateUsers from "@coreModule/clients/panel/private/users/createUser";
import {type EntityListApi} from "@coreModule/components/custom/cardAndTableView.tsx";
import EntityListPage from "@coreModule/components/entityPage/EntityListPage.tsx";
import {UserCard} from "@coreModule/clients/panel/private/users/center/cardView";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/allUsers.form.response.type.ts";
import EditUser from "@coreModule/clients/panel/private/users/editUser";
import EditUserAction from "@coreModule/clients/panel/private/users/center/actions/edit.tsx";
import {TableUpdateContext} from "@coreModule/components/custom/tableUpdateContext.tsx";

export {useTableUpdate} from "@coreModule/components/custom/tableUpdateContext.tsx";

type UsersProps = WithLanguageType & {
    administration: boolean;
};

function Users({resolveLanguageKey, administration}: UsersProps) {
    const listApiRef = useRef<EntityListApi<CompanyUserType> | null>(null);
    const newUserCreated = useSelector((state: RootState) => state.ui.newUserCreated);

    useEffect(() => {
        if (newUserCreated > 0) {
            listApiRef.current?.refetch?.();
        }
    }, [newUserCreated]);

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
                hideCreate
                selfAccess={false}
                listApiRef={listApiRef}
                buildEditPath={() => ""}
                resolveLanguageKey={resolveLanguageKey}
                headerTitle={resolveLanguageKey(administration ? "administrationTitle" : "title") as string}
                headerDescription={resolveLanguageKey(administration ? "administrationDescription" : "description") as string}
                helpLanguageKey={administration ? "administrationHelp" : "help"}
                headerActions={
                    <>
                        <UsersInviteDialog administration={administration} />
                        <CreateUsers administration={administration} />
                    </>
                }
                extraParams={{administration, fetchAdministrationUsers: true}}
                configurations={{limit: 20}}
                cardViewClassName="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 pe-1"
                rowActionMenu={{
                    hideView: true,
                    hideEdit: true,
                    hideDelete: true,
                    hideRestore: true,
                    allowMenuForCustomChildren: true,
                }}
                renderCard={(user) => <UserCard user={user} specificUserId={user._id} />}
                renderActionMenuChildren={(user) => (
                    <EditUserAction user={user} specificUserId={user._id} />
                )}
            />
            <EditUser />
        </TableUpdateContext.Provider>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/users/index.tsx"),
    withDebug(true, true, "users")
)(Users);
