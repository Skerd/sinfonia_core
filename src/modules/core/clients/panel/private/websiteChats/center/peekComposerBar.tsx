import {compose} from "redux";
import {useSelector} from "react-redux";
import {UserCheck} from "lucide-react";
import {RootState} from "@baseModule/helpers/redux/store/generalStore.ts";
import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@baseModule/helpers/hooks/useAccess.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useJoinPublicChat} from "@coreModule/clients/panel/private/websiteChats/center/useJoinPublicChat.ts";

function PeekComposerBar({resolveLanguageKey}: WithLanguageType) {
    const {write} = useAccess("channels");
    const canTakeOver = write === true || (!!write && typeof write === "object" && !!write.users);
    const activeChannelId = useSelector((state: RootState) => state.chat.activeChannelId);
    const {joining, join} = useJoinPublicChat();

    if (!activeChannelId) {
        return <HiddenElement />;
    }

    return (
        <div className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2">
            <p className="text-sm text-muted-foreground">{resolveLanguageKey("peekingBanner")}</p>
            {canTakeOver && (
                <button
                    type="button"
                    disabled={joining}
                    onClick={() => void join(activeChannelId)}
                    className="bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs disabled:opacity-50"
                >
                    <UserCheck size={13} />
                    {joining ? resolveLanguageKey("joining") : resolveLanguageKey("takeOver")}
                </button>
            )}
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/websiteChats/center/peekComposerBar.tsx"),
    withDebug(true, true, "channels"),
)(PeekComposerBar);
