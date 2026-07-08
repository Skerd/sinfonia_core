import {compose} from "redux";
import {Checkbox} from "@coreModule/components/ui/checkbox.tsx";
import {toggleDeleteMessageId} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";

type ToggleDeleteProps = {
    messageId: string
}

function ToggleDelete({
    messageId,
}: ToggleDeleteProps) {

    const {delete: deleteMessage} = useAccess("messages");
    const dispatch = useDispatch();
    const openDelete = useSelector((state: RootState) => state.chat.openDelete);
    const deleteMessageIds = useSelector((state: RootState) => state.chat.deleteMessageIds);

    if( !messageId || !openDelete || !deleteMessage){
        return (
            <></>
        )
    }

    return (
        <Checkbox
            checked={deleteMessageIds.includes(messageId)}
            id={"toggle_delete_" + messageId}
            className="me-2"
            onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                dispatch(toggleDeleteMessageId(messageId));
            }}
        />
    )
}

export default compose(
    withDebug(true, true)
)(ToggleDelete);