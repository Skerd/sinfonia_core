import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {compose} from "redux";
import {Button} from "@coreModule/components/ui/button.tsx";
import {useEffect, useImperativeHandle, useRef} from "react";
import {useDispatch} from "react-redux";
import {openChannel, upsertChannel} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {CreateChannelFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/createChannel.form.response.type.ts";
import {CreateChannelFormType} from "armonia/src/modules/core/api/user/private/chats/channels/createChannel.form.type.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type CreateNewChannelProps = WithLanguageType & WithAxiosType<CreateChannelFormResponseType, CreateChannelFormType> & {
    groupName: string,
    fireUpdate?: number,
    handleClose: Function,
    userIds: string[]
}

function CreateNewChannel({
    resolveLanguageKey,
    groupName,
    fireUpdate = 0,
    onFilterChange,
    loading,
    innerRef,
    handleClose,
    userIds = []
}: CreateNewChannelProps) {

    const {create} = useAccess("channels");
    const dispatch = useDispatch();
    const lastFiredRef = useRef<number>(0);

    // Only trigger API call when fireUpdate changes (form submit). Omitting groupName, userIds, onFilterChange
    // from deps to avoid infinite loop (userIds is a new array ref each render from form.watch).
    useEffect(() => {
        if (!fireUpdate || fireUpdate === lastFiredRef.current) return;
        lastFiredRef.current = fireUpdate;
        onFilterChange({
            name: groupName,
            userIds
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: run only on fireUpdate change
    }, [fireUpdate]);

    useImperativeHandle(innerRef, () => ({
        start: () => {},
        success: (data: CreateChannelFormResponseType) => {
            if (data.alreadyExist) {
                dispatch(openChannel(data.channelInfo._id));
            } else {
                dispatch(upsertChannel(data.channelInfo));
            }
            handleClose(false);
        }
    }));

    if (!create) {
        return <HiddenElement />;
    }

    return (
        <>
            <Button
                type="submit"
                variant="default"
                disabled={userIds.length === 0 || loading}
                className="w-full"
            >
                {resolveLanguageKey("chat")}
            </Button>
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/searchChatUsers/createNewChannel.tsx"),
    withAxios(
        {
            url: "/api/user/chats/channels",
            method: "PUT",
            data: {},
            onSuccessMessage: {
                if: "alreadyExist",
                condition: true,
                message: "successExists"
            }
        },
        true
    ),
    withDebug(true, true)
)(CreateNewChannel);