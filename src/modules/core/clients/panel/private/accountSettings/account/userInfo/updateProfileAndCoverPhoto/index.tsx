import {compose} from "redux";
import {Card} from "@coreModule/components/ui/card.tsx";
import UpdateProfilePhoto from "@coreModule/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateProfilePhoto";
import UpdateCoverPhoto from "@coreModule/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateCoverPhoto";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import withHidden from "@coreModule/helpers/hocs/withHidden.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";

type AccountProfileAndCoverPhotoProps = {
    specificUserId?: string;
    onPhotoUpdate?: (updates: { photo?: string; cover?: string }) => void;
}
function AccountProfileAndCoverPhoto({
    specificUserId,
    onPhotoUpdate
}: AccountProfileAndCoverPhotoProps) {

    const bannerSize = "150px";
    const {read} = useAccess("users", !specificUserId ? "self" : "others");

    return (
        <Card className="relative p-0 rounded-ee-none gap-0 rounded-es-none mb-10 overflow-visible" style={{height: bannerSize}}>
            <UpdateCoverPhoto hideCondition={!read.cover} specificUserId={specificUserId} onPhotoUpdate={onPhotoUpdate}/>
            <UpdateProfilePhoto hideCondition={!read.photo} specificUserId={specificUserId} onPhotoUpdate={onPhotoUpdate}/>
        </Card>
    )
}

export default compose(
    withHidden(),
    withDebug(true, true)
)(AccountProfileAndCoverPhoto);