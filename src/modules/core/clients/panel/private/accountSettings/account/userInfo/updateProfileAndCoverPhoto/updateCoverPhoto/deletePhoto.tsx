import {IconLoader2, IconTrash} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {useEffect, useImperativeHandle, useState} from "react";
import {Button} from "@coreModule/components/ui/button.tsx";
import {DeleteProfileCoverPhotoFormResponseType} from "armonia/src/modules/core/api/user/private/data/deleteProfileCoverPhoto.form.response.type.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type DeletePhotoProps = WithLanguageType & WithAxiosType<DeleteProfileCoverPhotoFormResponseType> & {
    specificUserId?: string,
    toggleUploadButton?: Function,
    forceReset: number,
    onDelete: Function
};

function DeletePhoto({
    resolveLanguageKey,
    toggleUploadButton,
    forceReset,
    onFilterChange,
    loading,
    innerRef,
    onDelete,
    specificUserId
}: DeletePhotoProps) {

    const {write} = useAccess("users", !specificUserId ? "self" : "others");
    const [open, setOpen] = useState<boolean>(false);

    useEffect(() => {
        setOpen(false);
    }, [forceReset]);
    useImperativeHandle(innerRef, () => ({
        success: () => {
            setOpen(false);
            toggleUploadButton?.(true);
            onDelete?.();
        },
        error: () => {
            toggleUploadButton?.(true);
            setOpen(false);
        }
    }));

    if( !write.cover ){
        return <HiddenElement />
    }

    return (
        <div className="flex grow justify-end">
            {
                open ?
                <div className="flex grow items-center justify-end gap-x-2">
                    <Button
                        disabled={loading}
                        variant="destructive"
                        onClick={() => {
                            setOpen(false);
                            toggleUploadButton?.(true);
                        }}
                    >
                        {resolveLanguageKey("cancel")}
                    </Button>
                    <Button
                        variant="outline"
                        disabled={loading}
                        onClick={() => {
                            if( !loading ){
                                onFilterChange({});
                            }
                        }}
                    >
                        {loading ? <IconLoader2 className="animate-spin"/> : <IconTrash />}
                        {resolveLanguageKey("confirm")}
                    </Button>
                </div>
                :
                <Button variant="ghost" onClick={() => {setOpen(true); toggleUploadButton?.(false);}}>
                    <IconTrash color={"red"} />
                    <p>{resolveLanguageKey("deletePhoto")}</p>
                </Button>
            }
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/account/userInfo/updateProfileAndCoverPhoto/updateCoverPhoto/deletePhoto.tsx"),
    withAxios(
        {
            url: "/api/user/data/coverPhoto",
            method: "DELETE",
            data: {},
            addToHeader: [{
                whatToGet: "specificUserId",
                whereToPut: "specificUser"
            }]
        },
        true
    ),
    withDebug(true, true, "users")
)(DeletePhoto);