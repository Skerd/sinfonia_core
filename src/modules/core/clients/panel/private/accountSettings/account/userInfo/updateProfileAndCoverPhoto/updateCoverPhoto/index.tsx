import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@coreModule/components/ui/dialog.tsx";
import {useEffect, useState} from "react";
import CoverPhoto from "@coreModule/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateCoverPhoto/coverPhoto.tsx";
import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import NewPhoto from "@coreModule/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateCoverPhoto/newPhoto.tsx";
import DeletePhoto from "@coreModule/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateCoverPhoto/deletePhoto.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import withHidden from "@coreModule/helpers/hocs/withHidden.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";


const HiddenCoverPhoto = () => {
    return (
        <div className="flex items-center justify-center w-full min-h-[150px]">
            <HiddenElement/>
        </div>
    )
}


type UpdateCoverPhotoProps = WithLanguageType & {
    bannerSize: string,
    specificUserId?: string;
    onPhotoUpdate?: (updates: { photo?: string; cover?: string }) => void;
}
function UpdateCoverPhoto({
    specificUserId,
    bannerSize = "170px",
    resolveLanguageKey,
    onPhotoUpdate,
}: UpdateCoverPhotoProps) {

    const {read, write} = useAccess("users", !specificUserId ? "self" : "others");
    const company = useSelector((state: RootState) => state.authentication?.user?.company);

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

    if( !read.cover ){
        return <HiddenCoverPhoto />
    }
    if( (!!read.cover && !write.cover) ){
        return (
            <div className="">
                <CoverPhoto
                    specificUserId={specificUserId}
                    photoUrl={photoUrl}
                    forceReloadPhoto={forceReloadPhoto}
                />
            </div>
        )
    }

    return (
        <>
            <div className="hover:cursor-pointer">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <div className="h-full">
                            <CoverPhoto
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
                        <div className="flex grow items-center justify-center h-full w-full" style={{height: bannerSize}}>
                            {
                                !currentPhotoUrl ?
                                <h3 className="text-muted-foreground font-bold text-xl">
                                    {company?.name || ""}
                                </h3>
                                :
                                <img src={currentPhotoUrl} alt="profilePhoto" className="rounded-lg rounded-ee-none rounded-es-none h-full w-full object-cover"/>
                            }
                        </div>
                        {
                            write.cover &&
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
                                            onSuccess={(cover?: string) => {
                                                setForceReloadPhoto(Date.now());
                                                onPhotoUpdate?.({ cover });
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
                                                onPhotoUpdate?.({ cover: undefined });
                                            }}
                                        />
                                    }
                                </div>
                            </DialogFooter>
                        }
                    </DialogContent>
                </Dialog>
            </div>
        </>
    )

}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateCoverPhoto/index.tsx"),
    withHidden(<HiddenCoverPhoto />),
    withDebug(true, true)
)(UpdateCoverPhoto);