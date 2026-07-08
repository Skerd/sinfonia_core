import {compose} from "redux"
import {Button} from "@coreModule/components/ui/button.tsx"
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx"
import {useEffect, useImperativeHandle, useState} from 'react'
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx"
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@coreModule/components/ui/dialog.tsx"
import {DisableMfaFormType} from "armonia/src/modules/core/api/user/public/mfa/disableMfa.form.type.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {IconKeyOff} from "@tabler/icons-react";
import {Loader2} from "lucide-react";

type DisableOTPProps = WithAxiosType & WithLanguageType & {
    username: string,
    password: string,
    openNow: number,
    onRequestSent: () => void,
}

function DisableOTP({
    onFilterChange = () => {},
    loading,
    username,
    password,
    resolveLanguageKey,
    openNow,
    onRequestSent,
    innerRef
}: DisableOTPProps){

    const requestMFADeactivation = () => {
        const postBody: DisableMfaFormType = {
            password: password,
            username: username
        }
        onFilterChange(postBody);
    }

    useImperativeHandle(innerRef, () => ({
        start: () => {},
        success: () => {
            setOpen(false);
            onRequestSent();
        },
        error: () => {
            onRequestSent();
        }
    }));

    const [open, setOpen] = useState<boolean>(openNow > 0);

    useEffect(() => {
        if( openNow > 0 ){
            setOpen(true);
        }
    }, [openNow]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{resolveLanguageKey("title")}</DialogTitle>
                    <DialogDescription>{resolveLanguageKey("description")}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button disabled={loading} type="button" onClick={() => {requestMFADeactivation()}}>
                        {(loading) ? <Loader2 className='animate-spin' /> : <IconKeyOff /> }
                        {resolveLanguageKey("confirmTitle")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/public/auth/login/disableOTP.form.tsx"),
    withAxios(
        {
            method: "post",
            url: `/api/user/mfa/requestDeactivation`,
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(DisableOTP)
