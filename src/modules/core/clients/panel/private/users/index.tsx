import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useEffect, useRef} from "react";
import {compose} from "redux";
import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Header from "@coreModule/components/custom/header.tsx";
import UsersInviteDialog from "@coreModule/clients/panel/private/users/inviteUser";
import CreateUsers from "@coreModule/clients/panel/private/users/createUser";
import CardAndTableView from "@coreModule/components/custom/cardAndTableView.tsx";
import {UserCard} from "@coreModule/clients/panel/private/users/center/cardView";
import {AllUsersFormResponseType, CompanyUserType} from "armonia/src/modules/core/api/company/private/users/allUsers.form.response.type.ts";
import {AllUsersFormType} from "armonia/src/modules/core/api/company/private/users/allUsers.form.type.ts";
import EditUser from "@coreModule/clients/panel/private/users/editUser";
import UserActions from "@coreModule/clients/panel/private/users/center/actions";
import {TableUpdateContext} from "@coreModule/components/custom/tableUpdateContext.tsx";

export {useTableUpdate} from "@coreModule/components/custom/tableUpdateContext.tsx";

type UsersProps = WithLanguageType & {
    administration: boolean;
};

function Users({resolveLanguageKey, administration}: UsersProps) {

    const listApiRef = useRef<{
        refetch: () => void;
        updateRow: (id: string | number, patch: Partial<CompanyUserType>) => void;
    } | null>(null);

    const newUserCreated = useSelector((state: RootState) => state.ui.newUserCreated);

    useEffect(() => {
        if (newUserCreated > 0) {
            listApiRef.current?.refetch?.();
        }
    }, [newUserCreated]);

    const contextValue = {
        updateRow: (id: any, patch: any) => {
            return listApiRef.current?.updateRow?.(id, patch)
        },
        refetch: () => listApiRef.current?.refetch?.(),
    };

    return (
        <TableUpdateContext.Provider value={contextValue}>
            <div className="min-w-0 flex-full gap-4">
                <Header
                    title={resolveLanguageKey(administration ? "administrationTitle" : "title")}
                    description={resolveLanguageKey(administration ? "administrationDescription" : "description")}
                >
                    <div className="flex items-center space-x-2">
                        <UsersInviteDialog administration={administration} />
                        <CreateUsers administration={administration} />
                    </div>
                </Header>

                <CardAndTableView<AllUsersFormResponseType, AllUsersFormType>
                    url="/api/company/users"
                    tableConfigKey="users"
                    access="users"
                    selfAccess={false}
                    tableConfigOptions={{
                        filterConfig: {
                            placeholder: resolveLanguageKey("searchPlaceholder"),
                            fields: resolveLanguageKey("fields"),
                        },
                    }}
                    extraParams={{ administration, fetchAdministrationUsers: true }}
                    configurations={{ limit: 20 }}
                    containersClassName={{
                        cardViewClassName: "grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 pe-1",
                        scrollRootClassName: "flex-full",
                    }}
                    listRef={listApiRef}
                    renderFunctions={{
                        cardRender: (user) => <UserCard user={user} specificUserId={user._id}/>,
                        action: (user) => {
                            return (
                                <UserActions user={user} />
                            )
                        }
                    }}
                />
                <EditUser />
            </div>
        </TableUpdateContext.Provider>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/users/index.tsx"),
    withDebug(true, true)
)(Users);
