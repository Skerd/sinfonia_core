import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {LoaderCircle, Trash} from "lucide-react";
import {updateDeletedMessageIds, updateOpenDelete} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {useImperativeHandle} from "react";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {DeleteMessageFormResponseType} from "armonia/src/modules/core/api/user/private/chats/messages/deleteMessage.form.response.type.ts";
import {DeleteMessageFormType} from "armonia/src/modules/core/api/user/private/chats/messages/deleteMessage.form.type.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";

type DeleteMessagesProps = WithLanguageType & WithAxiosType<DeleteMessageFormResponseType, DeleteMessageFormType> & {
    specificUserId?: string
}
function DeleteMessages({
    resolveLanguageKey,
    onFilterChange,
    loading,
    innerRef
}: DeleteMessagesProps) {

    const {delete: deleteMessages} = useAccess("messages");
    const dispatch = useDispatch();
    const deleteMessageIds = useSelector((state: RootState) => state.chat.deleteMessageIds);

    useImperativeHandle(innerRef, () => ({
        start: () => {},
        success: () => {
            dispatch(updateDeletedMessageIds(deleteMessageIds));
            dispatch(updateOpenDelete(false));
        },
        error: () => {}
    }));

    if( !deleteMessages ){
        return <HiddenElement />
    }

    return (
        <>
            <div className='flex items-center justify-between border-input text-center bg-card text-muted-foreground text-xs rounded-md border px-2 py-1'>
                <p>{deleteMessageIds.length} {resolveLanguageKey("selected")}</p>
                <Button
                    variant="ghost"
                    className="hover:text-destructive"
                    onClick={() => {onFilterChange({messageIds: deleteMessageIds})}}
                    disabled={loading}
                >
                    {loading ? <LoaderCircle className="animate-spin"/> : <Trash />}
                    {resolveLanguageKey("delete")}
                </Button>
                <Button disabled={loading} variant="outline" size="sm" onClick={() => {dispatch(updateOpenDelete(false));}}>
                    {resolveLanguageKey("cancel")}
                </Button>
            </div>
        </>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/chatInput/actions/deleteMessages.tsx"),
    withAxios(
        {
            url: "/api/user/chats/messages",
            method: "DELETE",
            data: {},
            addToHeader: [
                {
                    whatToGet: "specificUserId",
                    whereToPut: "specificUser"
                }
            ]
        },
        true
    ),
    withDebug(true, true)
)(DeleteMessages);