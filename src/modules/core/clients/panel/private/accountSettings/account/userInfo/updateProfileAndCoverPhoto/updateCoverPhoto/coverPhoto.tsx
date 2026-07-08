import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {compose} from "redux";
import {RotateCcw} from "lucide-react";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Media} from "armonia/src/modules/core/types";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Loader from "@coreModule/components/custom/loader.tsx";
import withHidden from "@coreModule/helpers/hocs/withHidden.tsx";

type ProfilePhotoProps = WithLanguageType & WithAxiosType<Media> & {
    photoUrl: string | null;
    setPhotoUrl: Function;
    forceReloadPhoto: number;
}

function CoverPhoto({
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
    const company = useSelector((state: RootState) => state.authentication?.user?.company);

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
        <div className="rounded-full flex grow items-center justify-center h-full w-full" style={{height: "150px"}}>
            {
                (loading) ?
                <Loader className="border-0"/>
                :
                <>
                    {
                        (error) ?
                        <TooltipDisplayer tooltip={resolveLanguageKey("tooltipTitle")}>
                            <RotateCcw color={"red"} className="rotate-45 hover:-rotate-45 transition-all duration-300" onClick={(e) => {e.stopPropagation(); e.preventDefault(); setForceRefresh(Date.now());}}/>
                        </TooltipDisplayer>
                        :
                        <>
                            {
                                (!data || !previewPhoto) ?
                                <h3 className="text-muted-foreground font-bold text-xl">
                                    {company?.name || ""}
                                </h3>
                                :
                                <img src={previewPhoto} alt="profilePhoto" className="rounded-lg rounded-es-none rounded-ee-none h-full w-full object-cover"/>
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
    withLanguage("src/modules/core/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateCoverPhoto/coverPhoto.tsx"),
    withAxios(
        {
            url: "/api/user/data/coverPhoto",
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
)(CoverPhoto)