import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useState} from "react";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@coreModule/components/ui/dialog.tsx";
import CreateUserForm from "@coreModule/clients/panel/private/users/createUser/createUser.form.tsx";
import {UserPlus} from "lucide-react";
import {Button, ButtonTitle} from "@coreModule/components/ui/button.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type CreateUsersProps = WithLanguageType & {
    administration: boolean
}

function CreateUsers({
    resolveLanguageKey,
    administration
}: CreateUsersProps) {

    const [open, setOpen] = useState<boolean>(false);
    const {create} = useAccess("users");

    if( !create ){
        return <HiddenElement/>
    }

    return (
        <>
            <Button className='space-x-1' onClick={() => setOpen(true)}>
                <UserPlus size={18} />
                <ButtonTitle hideMobile={true} tooltip={resolveLanguageKey("addUser")}>
                    {resolveLanguageKey("addUser")}
                </ButtonTitle>
            </Button>

            <Dialog
                open={open}
                onOpenChange={setOpen}
            >
                <DialogContent className='sm:max-w-lg'>
                    <DialogHeader className='text-start'>
                        <DialogTitle>{resolveLanguageKey(administration ? "administrationTitle" : "title")}</DialogTitle>
                        <DialogDescription>{resolveLanguageKey(administration ? "administrationDescription" : "description")}</DialogDescription>
                    </DialogHeader>
                    <CreateUserForm
                        onClose={() => {setOpen(false)}}
                        administration={administration}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/users/createUser/index.tsx"),
    withDebug(true, true)
)(CreateUsers)