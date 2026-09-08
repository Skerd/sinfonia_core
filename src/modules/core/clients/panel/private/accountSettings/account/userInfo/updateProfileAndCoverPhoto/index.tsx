import {compose} from "redux";
import {Card} from "@coreModule/components/ui/card.tsx";
import UpdateProfilePhoto from "@coreModule/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateProfilePhoto";
import UpdateCoverPhoto from "@coreModule/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateCoverPhoto";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/context/accessContext.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

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
            {read.cover ? (
                <UpdateCoverPhoto specificUserId={specificUserId} onPhotoUpdate={onPhotoUpdate}/>
            ) : (
                <div className="flex items-center justify-center w-full min-h-[150px]">
                    <HiddenElement />
                </div>
            )}
            {read.photo ? (
                <UpdateProfilePhoto specificUserId={specificUserId} onPhotoUpdate={onPhotoUpdate}/>
            ) : (
                <div className="hover:cursor-pointer flex items-center justify-center bg-muted-foreground border-4 border-background absolute bottom-[-25px] left-8 rounded-full" style={{width: "120px", height: "120px"}}>
                    <div className="rounded-full flex grow items-center justify-center h-full w-full">
                        <HiddenElement />
                    </div>
                </div>
            )}
        </Card>
    )
}

export default compose(
    withDebug(true, true, "users")
)(AccountProfileAndCoverPhoto);