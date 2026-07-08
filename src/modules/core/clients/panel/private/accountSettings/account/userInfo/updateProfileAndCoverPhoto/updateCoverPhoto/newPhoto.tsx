import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Camera, LoaderCircle, Save} from "lucide-react";
import {useEffect, useImperativeHandle, useRef, useState} from "react";
import {Button} from "@coreModule/components/ui/button.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {UpdateProfileCoverPhotoFormResponseType} from "armonia/src/modules/core/api/user/private/data/updateProfileCoverPhoto.form.response.type.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type NewPhotoProps = WithLanguageType & WithAxiosType<UpdateProfileCoverPhotoFormResponseType> & {
    specificUserId?: string,
    toggleDeleteButton?: Function,
    forceReset: number,
    setCurrentPhotoUrl?: Function,
    onSuccess?: (cover?: string) => void
}

function NewPhoto({
    resolveLanguageKey,
    toggleDeleteButton = () => {},
    onFormDataChange,
    loading,
    forceReset,
    setCurrentPhotoUrl,
    onSuccess,
    innerRef,
    specificUserId
}: NewPhotoProps) {

    const {write} = useAccess("users", !specificUserId ? "self" : "others");
    const [fileSelected, setFileSelected] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadPhoto = async () => {
        if( !fileSelected ){
            return;
        }
        const formData = new FormData();
        const files = [fileSelected];
        for( let file of files ){
            formData.append('files', file);
        }
        onFormDataChange({
            formData
        });
    }
    useEffect(() => {
        setFileSelected(null);
    }, [forceReset]);
    useImperativeHandle(innerRef, () => ({
        success: (responseData?: UpdateProfileCoverPhotoFormResponseType) => {
            onSuccess?.(responseData?.cover);
            toggleDeleteButton(true);
            setFileSelected(null);
        }
    }));

    if( !write.cover ){
        return <HiddenElement />
    }

    return (
        <div>
            {
                fileSelected ?
                <div className="flex grow items-center justify-end space-x-2">
                    <Button
                        disabled={loading}
                        variant="destructive"
                        onClick={() => {
                            setFileSelected(null);
                            setCurrentPhotoUrl?.(null);
                            toggleDeleteButton(true);
                        }}
                    >
                        {resolveLanguageKey("cancel")}
                    </Button>
                    <Button
                        variant="outline"
                        disabled={loading}
                        onClick={() => {
                            if( !loading ){
                                uploadPhoto();
                            }
                        }}
                    >
                        {loading ? <LoaderCircle className="animate-spin"/> : <Save />}
                        {resolveLanguageKey("confirm")}
                    </Button>
                </div>
                :
                <>
                    <Button variant="ghost" className="" onClick={() => fileInputRef.current?.click()}>
                        <Camera />
                        <p>{resolveLanguageKey("updatePhoto")}</p>
                    </Button>

                    <input
                        type='file'
                        ref={fileInputRef}
                        className='hidden'
                        accept='image/*'
                        onChange={(e) => {
                            let file = e.target.files?.[0];
                            if( file ){
                                setFileSelected(file);
                                setCurrentPhotoUrl?.(URL.createObjectURL(file));
                                toggleDeleteButton(false);
                            }
                        }}
                    />
                </>
            }
        </div>
    )

}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateCoverPhoto/newPhoto.tsx"),
    withAxios(
        {
            url: "/api/user/data/coverPhoto",
            method: "PATCH",
            data: {},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }]
        },
        true
    ),
    withDebug(true, true)
)(NewPhoto);