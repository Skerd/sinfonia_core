import {IconUserCheck} from "@tabler/icons-react";
import {compose} from "redux";
import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useJoinPublicChat} from "@coreModule/clients/panel/private/websiteChats/center/useJoinPublicChat.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {useActionAccess} from "@coreModule/helpers/hooks/useActionAccess.ts";

function PeekComposerBar({resolveLanguageKey}: WithLanguageType) {
    // Joining, releasing and closing a website chat are one permission (D71), not a write on channel members.
    const canTakeOver = useActionAccess("channels", "answerWebsiteChats");
    const activeChannelId = useSelector((state: RootState) => state.chat.activeChannelId);
    const {joining, join} = useJoinPublicChat();

    if (!activeChannelId) {
        return <HiddenElement />;
    }

    return (
        <div className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2">
            <p className="text-sm text-muted-foreground">{resolveLanguageKey("peekingBanner")}</p>
            {canTakeOver && (
                <Button
                    type="button"
                    disabled={joining}
                    onClick={() => join(activeChannelId)}
                    size="xs"
                    className="shrink-0 rounded-md"
                >
                    <IconUserCheck size={13} />
                    {joining ? resolveLanguageKey("joining") : resolveLanguageKey("takeOver")}
                </Button>
            )}
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/websiteChats/center/peekComposerBar.tsx"),
    withDebug(true, true, "channels"),
)(PeekComposerBar);
