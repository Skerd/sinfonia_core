import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {CircleX} from "lucide-react";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useImperativeHandle, useState} from "react";
import {deleteChannel, openChannel} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {useDispatch} from "react-redux";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import {Channel} from "armonia/src/modules/core/api/user/private/chats/channels/channels.form.response.type.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import type {ActionMessage, SingleForm} from "armonia/src/modules/core/types/shared.types";

type ClosePublicChatProps = WithLanguageType & WithAxiosType<ActionMessage, SingleForm> & {
    channel: Channel;
};

function ClosePublicChat({
    channel,
    resolveLanguageKey,
    loading,
    onFilterChange,
    innerRef,
}: ClosePublicChatProps) {
    const {write} = useAccess("channels");
    const canAct = write === true || (!!write && typeof write === "object" && !!write.users);
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);

    useImperativeHandle(innerRef, () => ({
        success: () => {
            setOpen(false);
            dispatch(openChannel(null));
            dispatch(deleteChannel(channel._id));
        },
    }));

    if (!canAct) {
        return <HiddenElement />;
    }

    return (
        <>
            <DropdownMenuItem onClick={(event) => {event.preventDefault(); setOpen(true);}} disabled={loading}>
                <CircleX />
                {resolveLanguageKey("closeChat")}
            </DropdownMenuItem>

            <ConfirmDialog
                open={open}
                isLoading={loading}
                onOpenChange={(value: boolean) => {setOpen(value);}}
                title={resolveLanguageKey("dialog.title")}
                desc={resolveLanguageKey("dialog.description")}
                confirmText={resolveLanguageKey("dialog.confirmText")}
                cancelBtnText={resolveLanguageKey("dialog.cancelText")}
                destructive
                handleConfirm={() => {
                    if (!loading) {
                        onFilterChange({_id: channel._id});
                    }
                }}
                className="sm:max-w-sm"
            />
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/websiteChats/center/closePublicChat.tsx"),
    withAxios(
        {
            url: "/api/user/chats/channels/close",
            method: "POST",
            data: {},
        },
        true,
    ),
    withDebug(true, true),
)(ClosePublicChat);
