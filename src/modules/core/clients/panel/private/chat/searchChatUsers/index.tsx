import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Edit} from "lucide-react";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useState} from "react";
import NewChat from "@coreModule/clients/panel/private/chat/searchChatUsers/newChat.tsx";
import CreateNewChannel from "@coreModule/clients/panel/private/chat/searchChatUsers/createNewChannel.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@coreModule/components/ui/dialog.tsx";

type SearchChatUsersProps = WithLanguageType & {}

function SearchChatUsers({
    resolveLanguageKey
}: SearchChatUsersProps) {

    const [open, setOpen] = useState<boolean>(false);

    return (
        <>
            <TooltipDisplayer tooltip={resolveLanguageKey("createNewChatChannel")}>
                <Button
                    size='icon'
                    variant='ghost'
                    className='rounded-lg'
                    onClick={() => setOpen(true)}
                >
                    <Edit size={24} className='stroke-muted-foreground' />
                </Button>
            </TooltipDisplayer>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className='sm:max-w-[600px]'>
                    <DialogHeader>
                        <DialogTitle>{resolveLanguageKey("title")}</DialogTitle>
                    </DialogHeader>

                    <div className="max-w-full overflow-hidden">
                        <NewChat
                            users={[]}
                            onOpenChange={setOpen}
                            open={open}
                            ChildComponent={CreateNewChannel}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/searchChatUsers/index.tsx"),
    withDebug(true, true)
)(SearchChatUsers);