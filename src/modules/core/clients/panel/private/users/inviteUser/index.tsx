import { MailPlus } from 'lucide-react'
import {Button, ButtonTitle} from '@coreModule/components/ui/button.tsx'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@coreModule/components/ui/dialog.tsx'
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {useState} from "react";
import InviteUserForm from "@coreModule/clients/panel/private/users/inviteUser/inviteUser.form.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type UserInviteDialogProps = WithLanguageType & {
    administration: boolean
}

function UsersInviteDialog({
    resolveLanguageKey,
    administration
}: UserInviteDialogProps) {

    const [open, setOpen] = useState<boolean>(false);
    const {create} = useAccess("users");

    if( !create ){
        return (<HiddenElement />)
    }

    return (
        <>
            <Button
                variant='outline'
                className='space-x-1'
                onClick={() => setOpen(true)}
            >
                <MailPlus size={18} />
                <ButtonTitle hideMobile={true} tooltip={resolveLanguageKey("inviteUser")}>
                    {resolveLanguageKey("inviteUser")}
                </ButtonTitle>
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className='sm:max-w-md'>
                    <DialogHeader className='text-start'>
                        <DialogTitle className='flex items-center gap-2'>
                            <MailPlus /> {resolveLanguageKey(administration ? "administrationTitle" : "title")}
                        </DialogTitle>
                        <DialogDescription>
                            {resolveLanguageKey(administration ? "administrationDescription" : "description")}
                        </DialogDescription>
                    </DialogHeader>
                    <InviteUserForm
                        administration={administration}
                        onClose={() => setOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/users/inviteUser/index.tsx"),
    withDebug(true, true)
)(UsersInviteDialog)
