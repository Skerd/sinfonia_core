import {IconRotate, IconUser} from "@tabler/icons-react";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {compose} from "redux";
import {Tooltip, TooltipContent, TooltipTrigger} from "@coreModule/components/ui/tooltip.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useEffect, useState} from "react";
import {Media} from "armonia/src/modules/core/types";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader/loader.tsx";

type ProfilePhotoProps = WithLanguageType & WithAxiosType<Media> & {
    photoUrl: string | null;
    setPhotoUrl: Function;
    forceReloadPhoto: number;
}

function ProfilePhoto({
    resolveLanguageKey,
    onFilterChange,
    data,
    error,
    loading,
    photoUrl,
    setPhotoUrl,
    forceReloadPhoto
}: ProfilePhotoProps) {

    const [previewPhoto, setPreviewPhoto] = useState<string | null>(photoUrl);
    const [forceRefresh, setForceRefresh] = useState<number>(1);
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        onFilterChange({});
    }, [forceRefresh, forceReloadPhoto]);
    useEffect(() => {
        if( !!data?._id ){
            setPreviewPhoto("/api/auxiliary/media/" + data._id);
            setPhotoUrl?.("/api/auxiliary/media/" + data._id);
        }
    }, [data]);
    useEffect(() => {
        setPreviewPhoto(photoUrl);
    }, [photoUrl]);
    useEffect(() => {
        setImageFailed(false);
    }, [previewPhoto]);

    const absent = imageFailed || error?.error_code === "media_not_found" || error?.error_code === "file_not_found";
    const showPhoto = !absent && !!data && !!previewPhoto;

    return (
        <div className="text-background rounded-full flex grow items-center justify-center h-full w-full">
            {
                loading ?
                <Loader className="border-0"/>
                :
                error && !absent ?
                <Tooltip>
                    <TooltipTrigger asChild>
                        <IconRotate color={"red"} className="rotate-45 hover:-rotate-45 transition-all duration-300" onClick={(e) => {e.preventDefault(); e.stopPropagation(); setForceRefresh(Date.now());}}/>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{resolveLanguageKey("tooltipTitle")}</p>
                    </TooltipContent>
                </Tooltip>
                :
                showPhoto ?
                <img
                    src={previewPhoto}
                    alt="profilePhoto"
                    className="rounded-full h-full w-full object-cover"
                    onError={() => {
                        setImageFailed(true);
                        setPhotoUrl?.(null);
                    }}
                />
                :
                <IconUser className="size-1/2" aria-hidden />
            }
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateProfilePhoto/profilePhoto.tsx"),
    withAxios(
        {
            url: "/api/user/data/profilePhoto",
            method: "GET",
            hideIfError: true,
            data: {},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }]
        },
        true
    ),
    withDebug(true, true, "users")
)(ProfilePhoto)