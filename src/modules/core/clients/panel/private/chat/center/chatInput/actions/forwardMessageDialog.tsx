import {useState, useEffect, useImperativeHandle} from "react";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {compose} from "redux";
import withLanguage, {ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from "@coreModule/components/ui/dialog.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Checkbox} from "@coreModule/components/ui/checkbox.tsx";
import {newMessage, setActionMessage} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {Forward} from "lucide-react";
import {Input} from "@coreModule/components/ui/input.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import InfiniteList from "@coreModule/components/custom/infiniteList";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import {Channel} from "armonia/src/modules/core/api/user/private/chats/channels/channels.form.response.type.ts";
import {AllChannelsFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/allChannels.form.response.type.ts";
import {AllChannelsFormType} from "armonia/src/modules/core/api/user/private/chats/channels/allChannels.form.type.ts";
import {ForwardMessageFormResponseType, MessageType} from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {ForwardMessageFormType} from "armonia/src/modules/core/api/user/private/chats/messages/forwardMessage.form.type.ts";

type ChannelsInfiniteListProps = WithAxiosType<AllChannelsFormResponseType, AllChannelsFormType> & {
    resolveLanguageKey: ResolveLanguageKey;
    selectedChannels: string[];
    onChannelToggle: (channelId: string) => void;
    userId: string;
};

function ChannelsInfiniteList({
    resolveLanguageKey,
    data,
    loading,
    error,
    onFilterChange,
    selectedChannels,
    onChannelToggle,
    userId
}: ChannelsInfiniteListProps) {
    return (
        <InfiniteList<Channel>
            data={data}
            loading={loading}
            error={error}
            onFilterChange={onFilterChange}
            limit={50}
            scrollRootClassName="max-h-60 overflow-y-auto space-y-0 border rounded-lg p-2"
            getId={(item) => item._id}
            renderItem={(channel) => (
                <div
                    role="button"
                    tabIndex={0}
                    key={channel._id}
                    className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => onChannelToggle(channel._id)}
                    onKeyDown={(e) => e.key === "Enter" && onChannelToggle(channel._id)}
                >
                    <Checkbox
                        checked={selectedChannels.includes(channel._id)}
                        onCheckedChange={() => onChannelToggle(channel._id)}
                    />
                    <p className="text-sm flex-1">
                        {channel.metaData?.isGroup ? channel.name : channel.users?.find((u) => u._id !== userId)?.name ?? ""}
                    </p>
                </div>
            )}
            renderError={({onRetry}) => (
                <SimpleError
                    title={resolveLanguageKey("failTitle")}
                    description={resolveLanguageKey("failTitleTooltip")}
                    onClick={onRetry}
                />
            )}
            renderNoData={() => (
                <div className="p-4 text-center text-muted-foreground text-sm">
                    {resolveLanguageKey("noDataTitle")}
                </div>
            )}
        />
    );
}

const ChannelsInfiniteListWithAxios = compose(
    withAxios(
        {
            url: "/api/user/chats/channels",
            method: "POST",
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(ChannelsInfiniteList);

type ForwardMessageDialogProps = WithLanguageType & WithAxiosType<ForwardMessageFormResponseType, ForwardMessageFormType> & {
    message: MessageType | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function ForwardMessageDialog({
    resolveLanguageKey,
    message,
    open,
    onOpenChange,
    onFilterChange,
    loading,
    innerRef
}: ForwardMessageDialogProps) {

    const {write} = useAccess("messages");

    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.authentication.user);
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
    const [forwardText, setForwardText] = useState<string>("");

    useEffect(() => {
        if (open && message) {
            setSelectedChannels([]);
            setForwardText("");
        }
    }, [open, message]);

    const handleChannelToggle = (channelId: string) => {
        setSelectedChannels(prev => 
            prev.includes(channelId) 
                ? prev.filter(id => id !== channelId)
                : [...prev, channelId]
        );
    };

    const handleForward = async () => {
        if (!message || selectedChannels.length === 0) {
            return;
        }
        onFilterChange({
            messageId: message._id,
            channelIds: selectedChannels,
            text: forwardText || undefined
        })
    };

    useImperativeHandle(innerRef, () => ({
        success: (data) => {
            if( !!data && !!data.messages )
            for( let message of data.messages ){
                dispatch(newMessage({channelId: message.channelId, message: message}));
            }
            dispatch(setActionMessage(null));
            onOpenChange(false);
        }
    }));

    if( !write || !write.forwardedText ){
        return <HiddenElement />;
    }
    if (!message) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Forward size={20} />
                        {resolveLanguageKey("forward")} {resolveLanguageKey("message")}
                    </DialogTitle>
                    <DialogDescription>
                        {resolveLanguageKey("selectChannelsToForward")}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Message preview */}
                    <div className="bg-muted rounded-lg p-3 border-l-4 border-blue-500">
                        <div className="text-xs text-muted-foreground mb-1">
                            {message.sender.name} {message.sender.surname}
                        </div>
                        <div className="text-sm">
                            {message.status === "deleted" ? resolveLanguageKey("messageDeleted") : message.message}
                        </div>
                    </div>

                    {/* Optional text */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            {resolveLanguageKey("addComment")}
                        </label>
                        <Input
                            value={forwardText}
                            onChange={(e) => setForwardText(e.target.value)}
                            placeholder={resolveLanguageKey("addCommentPlaceholder")}
                        />
                    </div>

                    {/* Channel selection */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            {resolveLanguageKey("selectChannels")}
                        </label>
                        <ChannelsInfiniteListWithAxios
                            //@ts-expect-error
                            resolveLanguageKey={resolveLanguageKey}
                            selectedChannels={selectedChannels}
                            onChannelToggle={handleChannelToggle}
                            userId={user?.id ?? ""}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false);
                                dispatch(setActionMessage(null));
                            }}
                            disabled={loading}
                        >
                            {resolveLanguageKey("cancel")}
                        </Button>
                        <Button
                            onClick={handleForward}
                            disabled={loading || selectedChannels.length === 0}
                        >
                            {loading ? resolveLanguageKey("sending") : resolveLanguageKey("forward")}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/chatInput/actions/forwardMessageDialog.tsx"),
    withAxios(
        {
            url: "/api/user/chats/messages/forward",
            method: "PUT",
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(ForwardMessageDialog);

