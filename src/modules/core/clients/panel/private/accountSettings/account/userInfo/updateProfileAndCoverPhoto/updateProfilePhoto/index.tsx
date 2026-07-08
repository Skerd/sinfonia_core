import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@coreModule/components/ui/dialog.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {useEffect, useState} from "react";
import ProfilePhoto from "@coreModule/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateProfilePhoto/profilePhoto.tsx";
import NewPhoto from "@coreModule/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateProfilePhoto/newPhoto.tsx";
import DeletePhoto from "@coreModule/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateProfilePhoto/deletePhoto.tsx";
import {User} from "lucide-react";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import withHidden from "@coreModule/helpers/hocs/withHidden.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

const avatarSize = "120px";
const dialogAvatarSize = "220px";

const HiddenProfilePhoto = () => {
    return (
        <div className={cn("hover:cursor-pointer flex items-center justify-center bg-gray-400 border-4 border-white absolute bottom-[-25px] left-8 rounded-full")} style={{width: avatarSize, height: avatarSize}}>
            <div className="rounded-full flex grow items-center justify-center h-full w-full">
                <HiddenElement/>
            </div>
        </div>
    )
}

type UpdateProfilePhotoProps = WithLanguageType & {
    specificUserId?: string;
    onPhotoUpdate?: (updates: { photo?: string; cover?: string }) => void;
}
function UpdateProfilePhoto({
    specificUserId,
    resolveLanguageKey,
    onPhotoUpdate,
}: UpdateProfilePhotoProps) {

    const {read, write} = useAccess("users", !specificUserId ? "self" : "others");
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
    const [forceReloadPhoto, setForceReloadPhoto] = useState<number>(0);

    const [forceReset, setForceReset] = useState<number>(0);
    const [open, setOpen] = useState<boolean>(false);
    const [showDelete, setShowDelete] = useState<boolean>(true);
    const [showUpload, setShowUpload] = useState<boolean>(true);

    useEffect(() => {
        if( !open ) {
            setShowDelete(true);
            setForceReset(Date.now());
        }
    }, [open]);

    if( !read.photo ){
        return <HiddenElement />
    }
    if( (!!read.photo && !write.photo) ){
        return (
            <div className={cn("hover:cursor-pointer flex items-center justify-center bg-gray-400 border-4 border-white absolute bottom-[-25px] left-8 rounded-full")} style={{width: avatarSize, height: avatarSize}}>
                <div className="rounded-full flex grow items-center justify-center h-full w-full">
                    <div className="rounded-full flex grow items-center justify-center h-full w-full">
                        <ProfilePhoto
                            specificUserId={specificUserId}
                            photoUrl={photoUrl}
                            forceReloadPhoto={forceReloadPhoto}
                        />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={cn("hover:cursor-pointer flex items-center justify-center bg-gray-400 border-4 border-white absolute bottom-[-25px] left-8 rounded-full")} style={{width: avatarSize, height: avatarSize}}>
            <div className="hover:cursor-pointer w-full h-full rounded-full">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <div className="rounded-full flex grow items-center justify-center h-full w-full">
                            <ProfilePhoto
                                specificUserId={specificUserId}
                                photoUrl={photoUrl}
                                setPhotoUrl={(value: string | null) => {
                                    setPhotoUrl(value);
                                    setCurrentPhotoUrl(value);
                                }}
                                forceReloadPhoto={forceReloadPhoto}
                            />
                        </div>
                    </DialogTrigger>
                    <DialogContent className="md:min-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>{resolveLanguageKey("title")}</DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center justify-center py-4 w-full">
                            <div className="rounded-full flex justify-center items-center bg-gray-400 text-white border-4 border-white " style={{width: dialogAvatarSize, height: dialogAvatarSize}}>
                                {
                                    !currentPhotoUrl ?
                                    <User size="91px"/>
                                    :
                                    <img src={currentPhotoUrl} alt="profilePhoto" className="rounded-full h-full w-full object-cover"/>
                                }
                            </div>
                        </div>
                        {
                            write.photo &&
                            <DialogFooter>
                                <div className={cn("flex items-center justify-between w-full text-sm", showUpload && (showDelete && !!photoUrl) ? "justify-between" : "justify-end")}>
                                    {
                                        showUpload &&
                                        <NewPhoto
                                            specificUserId={specificUserId}
                                            toggleDeleteButton={(value: boolean) => setShowDelete(value)}
                                            forceReset={forceReset}
                                            setCurrentPhotoUrl={(value: string | null) => {
                                                setCurrentPhotoUrl(value || photoUrl);
                                            }}
                                            onSuccess={(photo?: string) => {
                                                setForceReloadPhoto(Date.now());
                                                onPhotoUpdate?.({ photo });
                                            }}
                                        />
                                    }
                                    {
                                        showDelete && !!photoUrl &&
                                        <DeletePhoto
                                            specificUserId={specificUserId}
                                            toggleUploadButton={(value: boolean) => setShowUpload(value)}
                                            forceReset={forceReset}
                                            onDelete={() => {
                                                setPhotoUrl(null);
                                                setCurrentPhotoUrl(null);
                                                onPhotoUpdate?.({ photo: undefined });
                                            }}
                                        />
                                    }
                                </div>
                            </DialogFooter>
                        }
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateProfilePhoto/index.tsx"),
    withHidden(<HiddenProfilePhoto />),
    withDebug(true, true)
)(UpdateProfilePhoto);