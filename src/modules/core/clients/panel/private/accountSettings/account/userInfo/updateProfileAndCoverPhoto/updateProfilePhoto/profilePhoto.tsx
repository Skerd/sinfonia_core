import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {compose} from "redux";
import {RotateCcw, User} from "lucide-react";
import {Tooltip, TooltipContent, TooltipTrigger} from "@coreModule/components/ui/tooltip.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useEffect, useState} from "react";
import {Media} from "armonia/src/modules/core/types";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import withHidden from "@coreModule/helpers/hocs/withHidden.tsx";

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

    return (
        <div className="text-white rounded-full flex grow items-center justify-center h-full w-full">
            {
                loading ?
                <Loader className="border-0"/>
                :
                <>
                    {
                        error ?
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <RotateCcw color={"red"} className="rotate-45 hover:-rotate-45 transition-all duration-300" onClick={(e) => {e.preventDefault(); e.stopPropagation(); setForceRefresh(Date.now());}}/>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{resolveLanguageKey("tooltipTitle")}</p>
                            </TooltipContent>
                        </Tooltip>
                        :
                        <>
                            {
                                (!data || !previewPhoto) ?
                                <User size="50px"/>
                                :
                                <img src={previewPhoto} alt="profilePhoto" className="rounded-full h-full w-full object-cover"/>
                            }
                        </>
                    }
                </>
            }
        </div>
    )
}

export default compose(
    withHidden(),
    withLanguage("src/modules/core/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateProfilePhoto/profilePhoto.tsx"),
    withAxios(
        {
            url: "/api/user/data/profilePhoto",
            method: "GET",
            data: {},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }]
        },
        true
    ),
    withDebug(true, true)
)(ProfilePhoto)