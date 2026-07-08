import {compose} from "redux";
import {useEffect, useImperativeHandle, useState} from "react";
import {Button} from "@coreModule/components/ui/button.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@coreModule/components/ui/dialog.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {UpdateAccountStatusFormType} from "armonia/src/modules/core/api/user/private/status/updateAccountStatus.form.type.ts";
import {UpdateAccountStatusFormResponseType} from "armonia/src/modules/core/api/user/private/status/updateAccountStatus.form.response.type.ts";
import withHidden from "@coreModule/helpers/hocs/withHidden.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type ToggleUserActiveProps = WithLanguageType & WithAxiosType<UpdateAccountStatusFormResponseType, UpdateAccountStatusFormType> & {
    active: boolean;
    username: string;
    specificUserId?: string;
    onComplete: Function;
    onSuccess: Function;
}

function ToggleUserActiveState({
    active,
    username,
    specificUserId,
    resolveLanguageKey,
    onFilterChange,
    onComplete,
    onSuccess,
    loading,
    innerRef
}: ToggleUserActiveProps) {

    const {write} = useAccess("users", !specificUserId ? "self" : "others");
    const [innerActive, setInnerActive] = useState<boolean>(active);
    const [openConfirmationModal, setOpenConfirmationModal] = useState<boolean>(true);

    useImperativeHandle(innerRef, () => ({
        start: () => {},
        success: () => {
            onSuccess(!innerActive)
            setOpenConfirmationModal(false);
            setInnerActive(!innerActive);
        },
        error: () => {
            setOpenConfirmationModal(false);
        }
    }));
    useEffect(() => {
        if( !!specificUserId ) {
            setOpenConfirmationModal(true);
        }
    }, [specificUserId])
    useEffect(() => {
        if( !openConfirmationModal ){
            onComplete(innerActive);
        }
    }, [openConfirmationModal]);

    if( !specificUserId ){
        return <></>
    }
    if( !write?.roles?.keys?.active ){
        return <HiddenElement />
    }

    return (
        <>
            <Dialog open={openConfirmationModal} onOpenChange={setOpenConfirmationModal}>
                <DialogContent className="sm:max-w-[650px]">
                    <DialogHeader>
                        <DialogTitle>{resolveLanguageKey(innerActive ? "titleDeactivate" : "titleActivate").replace(" [!!!]", !!username ? `[${username}]`: "" )}</DialogTitle>
                        <DialogDescription>
                            {resolveLanguageKey(innerActive ? "descriptionDeactivate" : "descriptionActivate").replace(" [!!!]", !!username ? `[${username}]`: "" )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onFilterChange({
                                    "status": !innerActive
                                });
                            }}
                            variant={innerActive ? "destructive" : "default"}
                            disabled={loading}
                        >
                            {resolveLanguageKey(innerActive ? "deactivate" : "activate")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default compose(
    withHidden(),
    withLanguage("src/modules/core/clients/panel/private/accountSettings/security/disableAccount/toggleUserActiveState.tsx"),
    withAxios({
        url: `/api/user/status`,
        method: "put",
        data: {},
        addToHeader: [{
            whatToGet: "specificUserId",
            whereToPut: "specificUser"
        }]
    }, true),
    withDebug(true, true)
)(ToggleUserActiveState)