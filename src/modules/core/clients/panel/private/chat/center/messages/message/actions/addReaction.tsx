import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import EmojiPicker, {Categories, Theme as EmojiTheme} from "emoji-picker-react";
import {useTheme} from "@baseModule/helpers/context/providers/theme-provider.tsx";
import withAxios, {WithAxiosType} from "@baseModule/helpers/hocs/withAxios.tsx";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import {useImperativeHandle} from "react";
import {updateMessageReaction} from "@baseModule/helpers/redux/slices/chatSlice.ts";
import {useDispatch} from "react-redux";
import {AddReactionFormResponseType} from "armonia/src/modules/core/api/user/private/chats/messages/actions/addReaction.form.response.type.ts";
import {AddReactionFormType} from "armonia/src/modules/core/api/user/private/chats/messages/actions/addReaction.form.type.ts";
import {useAccess} from "@baseModule/helpers/hooks/useAccess.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type ReactToMessageProps = WithLanguageType & WithAxiosType<AddReactionFormResponseType, AddReactionFormType> & {
    messageId: string,
    onSuccess: Function
}

function ReactToMessage({
    messageId,
    resolveLanguageKey,
    innerRef,
    loading,
    onFilterChange,
    onSuccess
}: ReactToMessageProps) {

    const {write} = useAccess("messages");
    const dispatch = useDispatch();
    const { resolvedTheme } = useTheme();

    useImperativeHandle(innerRef, () => ({
        success: (data: AddReactionFormResponseType) => {
            if( !!data ){
                dispatch(
                    updateMessageReaction({
                        messageId: messageId,
                        reaction: data,
                        add: true
                    })
                );
                onSuccess?.();
            }
        }
    }))

    if( !write || !write.reactions ){
        return <HiddenElement />
    }

    return (
        <EmojiPicker
            theme={resolvedTheme as EmojiTheme}
            reactionsDefaultOpen
            searchPlaceholder={resolveLanguageKey("searchPlaceholder")}
            className="shadow-lg"
            previewConfig={{
                showPreview: false,
            }}
            categories={[
                {
                    category: Categories.SUGGESTED,
                    name: resolveLanguageKey("suggested"),
                },
                {
                    category: Categories.SMILEYS_PEOPLE,
                    name: resolveLanguageKey("smileys_people"),
                },
                {
                    category: Categories.ANIMALS_NATURE,
                    name: resolveLanguageKey("animals_nature"),
                },
                {
                    category: Categories.FOOD_DRINK,
                    name: resolveLanguageKey("food_drink"),
                },
                {
                    category: Categories.TRAVEL_PLACES,
                    name: resolveLanguageKey("travel_places"),
                },
                {
                    category: Categories.ACTIVITIES,
                    name: resolveLanguageKey("activities"),
                },
                {
                    category: Categories.OBJECTS,
                    name: resolveLanguageKey("objects"),
                },
                {
                    category: Categories.SYMBOLS,
                    name: resolveLanguageKey("symbols"),
                },
                {
                    category: Categories.FLAGS,
                    name: resolveLanguageKey("flags"),
                },
            ]}
            onEmojiClick={(emojiData) => {
                let {emoji} = emojiData;
                if( loading ){return}
                onFilterChange({
                    messageId,
                    emoji
                })
            }}
        />
    )
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/messages/message/actions/addReaction.tsx"),
    withAxios(
        {
            url: "/api/user/chats/messages/reaction",
            method: "PUT",
            data: {}
        },
        true
    ),
    withDebug(true, true, "messages")
)(ReactToMessage);