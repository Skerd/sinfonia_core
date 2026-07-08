import {useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";

type TypingIndicatorsProps = WithLanguageType & {}

function TypingIndicators({resolveLanguageKey}: TypingIndicatorsProps) {

    const activeChannelId = useSelector((state: RootState) => state.chat.activeChannelId);
    const openedChannel = useSelector((state: RootState) => state.chat.channels[activeChannelId ?? ""]);
    const typingUsers = useSelector((state: RootState) => state.chat.typingUsers?.[activeChannelId ?? ""]);

    const renderTypingText = () => {
        let typingUserNames = [];
        let channelMembers = openedChannel.users;
        for( let userId of Object.keys(typingUsers ?? {}) ){
            let user = channelMembers.find(member => member._id === userId);
            if( user ){
                typingUserNames.push(user.name);
            }
        }
        if( typingUserNames.length === 1 ){
            return `${typingUserNames[0]} ${resolveLanguageKey("isTyping")}`
        }
        else if (typingUserNames.length === 2) {
            `${typingUserNames[0]} ${resolveLanguageKey("and")} ${typingUserNames[1]} ${resolveLanguageKey("areTyping")}`
        }
        else if( typingUserNames.length > 2 ){
            `${typingUserNames[0]} ${resolveLanguageKey("and")} ${typingUserNames.length - 1} ${resolveLanguageKey("others")} ${resolveLanguageKey("areTyping")}`;
        }
        else {
            return "";
        }
    }

    if (!activeChannelId || !openedChannel) {
        return <></>;
    }

    return (
        <div className="px-2 text-xs text-muted-foreground italic animate-pulse h-4" style={{border: "0px solid red"}}>
            {renderTypingText()}
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/typingIndicators.tsx")
)(TypingIndicators);

