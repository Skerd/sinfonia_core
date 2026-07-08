import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {useEffect, useImperativeHandle} from "react";
import {useDispatch} from "react-redux";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import { Button } from "@coreModule/components/ui/button.tsx";
import {Pencil, X} from "lucide-react";
import {getName} from "@coreModule/helpers/general";
import {editMessage as editMessageAction, setActionMessage} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import withLanguage from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {EditMessageFormResponseType} from "armonia/src/modules/core/api/user/private/chats/messages/editMessage.form.response.type.ts";
import {EditMessageFormType} from "armonia/src/modules/core/api/user/private/chats/messages/editMessage.form.type.ts";
import {MessageType} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";

type EditMessageProps = WithAxiosType<EditMessageFormResponseType, EditMessageFormType> & {
    editMessage: MessageType,
    newMessage: string,
    fireUpdate: number,
    onSuccess: Function,
}

function EditMessage({
    editMessage,
    newMessage,
    fireUpdate,
    onSuccess = () => {},
    onFilterChange,
    loading,
    innerRef
}: EditMessageProps){

    const {write} = useAccess("messages");
    const dispatch = useDispatch();

    useEffect(() => {
        if( !write || !write.text ) return;
        if( !fireUpdate || loading ){
            return;
        }
        onFilterChange({
            messageId: editMessage._id,
            text: newMessage
        });
    }, [fireUpdate]);

    useImperativeHandle(innerRef, () => ({
        success: (data: EditMessageFormResponseType) => {
            dispatch(editMessageAction({
                messageId: editMessage._id,
                ...data
            }))
            onSuccess();
        }
    }))

    if( !write || !write.text ){
        return <HiddenElement />
    }

    return (
        <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 border-l-4 border-primary">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <Pencil size={16} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-primary">
                        {getName(editMessage?.sender)}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                        <p>
                            {`${(editMessage.message).substring(0, 50)}${editMessage.message.length > 50 ? "..." : ""}`}
                        </p>
                    </div>
                </div>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => dispatch(setActionMessage(null))}
            >
                <X size={14} />
            </Button>
        </div>
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/chatInput/actions/editMessage.tsx"),
    withAxios(
        {
            url: "/api/user/chats/messages",
            method: "PATCH",
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(EditMessage);