import {compose} from "redux";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import EditUserAction from "@coreModule/clients/panel/private/users/center/actions/edit.tsx";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/allUsers.form.response.type.ts";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";

const emptyDeleted: DeletedData = {};

type UserActionsProps = {
    specificUserId?: string;
    user: CompanyUserType;
}

function UserActions({user, specificUserId}: UserActionsProps) {
    const {read, write} = useAccess("users", !specificUserId ? "self" : "others");

    if (!read && !write) return <HiddenElement />;

    return (
        <ActionMenu
            accessModel="users"
            deletedData={emptyDeleted}
            editPath=""
            hideView
            hideEdit
            hideDelete
            hideRestore
            allowMenuForCustomChildren
        >
            <EditUserAction user={user} specificUserId={user._id}/>
        </ActionMenu>
    );
}

export default compose(withDebug(true, true, "users"))(UserActions);
