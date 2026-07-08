import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {UserProfileCard} from "./userProfileCard.tsx";
import UserActions from "@coreModule/clients/panel/private/users/center/actions";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/allUsers.form.response.type.ts";

type UserCardProps = {
    user: CompanyUserType;
    specificUserId?: string;
}

function UserCard({ user, specificUserId }: UserCardProps) {
    const {write} = useAccess("users", !specificUserId ? "self" : "others");
    const editable = !!write;

    return (
        <div className="group relative">
            <UserProfileCard data={user} specificUserId={user._id} />
            {editable && (
                <div className="absolute top-2 right-2 z-10">
                    <UserActions user={user} specificUserId={user._id}/>
                </div>
            )}
        </div>
    );
}

export default compose(
    withDebug(true, true)
)(UserCard);
