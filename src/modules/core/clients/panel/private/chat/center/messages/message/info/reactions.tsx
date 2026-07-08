import {compose} from "redux";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@coreModule/components/ui/tabs.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import CustomAvatar from "@coreModule/components/custom/customAvatar.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {formatDate, getName} from "@coreModule/helpers/general";
import {useImperativeHandle, useState} from "react";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {updateMessageReaction} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {RemoveReactionFormResponseType} from "armonia/src/modules/core/api/user/private/chats/messages/actions/removeReaction.form.response.type.ts";
import {RemoveReactionFormType} from "armonia/src/modules/core/api/user/private/chats/messages/actions/removeReaction.form.type.ts";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";

type ReactionsProps = WithLanguageType & WithAxiosType<RemoveReactionFormResponseType, RemoveReactionFormType> & {
    messageId: string,
    owner: boolean
}

function Reactions({
    messageId,
    owner,
    resolveLanguageKey,
    loading,
    onFilterChange,
    innerRef,
}: ReactionsProps) {

    const {read} = useAccess("messages");
    const reactionRead = read?.reactions?.keys || {};
    const maxReactions = 4;
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.authentication.user);
    const [selectedEmoji, setSelectedEmoji] = useState<string>("all");

    const {reactions} = useSelector((state: RootState) => state.chat.messages[messageId]) || {};

    useImperativeHandle(innerRef, () => ({
        success: (data: RemoveReactionFormResponseType) => {
            dispatch(
                updateMessageReaction({
                    messageId: messageId,
                    reaction: data,
                    add: false
                })
            );
        }
    }))
    if( !reactions || !reactions.length ){
        return <></>;
    }

    // Group by emoji (guard against undefined emoji for index type)
    const grouped: Record<string, typeof reactions> = reactions.reduce(
        (acc, r) => {
            const emojiKey = r.emoji ?? "_";
            if (!acc[emojiKey]) acc[emojiKey] = [];
            acc[emojiKey].push(r);
            return acc;
        },
        {} as Record<string, typeof reactions>
    );

    const emojiList = Object.keys(grouped);
    const visibleEmojis = emojiList.slice(0, maxReactions);
    const hiddenCount = emojiList.length - maxReactions;

    const removeReaction = (messageId: string, emoji: any, senderId: string) => {
        if( loading || user.id !== senderId ) return;
        onFilterChange({
            messageId,
            emoji
        })
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className={cn("flex grow items-center space-x-1 mt-0.5", {"justify-end": owner, "justify-start": !owner})}>
                    {
                        visibleEmojis.map((emoji) => {
                            const count = grouped[emoji]?.length || 0;
                            return (
                                <div key={emoji} className="flex items-center justify-center cursor-pointer space-x-0.5 border border-transparent hover:border-muted-foreground rounded-lg p-0.5" onClick={() => setSelectedEmoji(emoji)}>
                                    {
                                        reactionRead.emoji &&
                                        <p>{emoji}</p>
                                    }
                                    <p className="text-xs font-semibold">x{count}</p>
                                </div>
                            )
                        })
                    }
                    {
                        hiddenCount > 0 &&
                        <div className="flex h-7 items-center justify-center cursor-pointer p-0.5 px-1 border hover:border-muted-foreground rounded-lg" onClick={() => setSelectedEmoji("all")}>
                            <p className="text-xs font-semibold ">+{hiddenCount} {resolveLanguageKey("more")}</p>
                        </div>
                    }
                </div>
            </PopoverTrigger>

            <PopoverContent
                side={owner ? "left" : "right"}
                align="center"
                className="z-2 p-2 bg-background border rounded-md shadow-md w-64"
            >
                <Tabs defaultValue={selectedEmoji}>
                    <TabsList>
                        <TabsTrigger value="all">
                            {`${resolveLanguageKey("all")}  ${reactions.length}`}
                        </TabsTrigger>
                        {
                            emojiList.map((emoji) => {
                                return (
                                    <TabsTrigger key={emoji} value={emoji}>
                                        {`${reactionRead.emoji ? emoji : "x"}  ${grouped[emoji].length}`}
                                    </TabsTrigger>
                                )
                            })
                        }
                    </TabsList>
                    <TabsContent value={"all"} className="flex flex-col gap-1 max-h-48 overflow-y-auto p-1">
                        {
                            reactions.map((r, index) => {
                                return (
                                    <div key={`${r.user?._id ?? ""}-${String(r.date ?? "")}-${index}`} className="flex justify-between px-2 py-1 rounded hover:bg-muted/50 hover:cursor-pointer" onClick={() => r.user?._id && removeReaction(messageId, r.emoji ?? "", r.user._id)}>
                                        <div className="flex items-center space-x-1">
                                            {
                                                reactionRead.user && r.user &&
                                                <CustomAvatar avatarClassName="size-7" user={r.user} />
                                            }
                                            <div>
                                                <HiddenElement>
                                                    {
                                                        reactionRead.user && r.user &&
                                                        <p className="text-sm text-muted-foreground">{getName(r.user)}</p>
                                                    }
                                                </HiddenElement>
                                                {
                                                    user?.id === r.user?._id &&
                                                    <p className="text-xs text-muted-foreground">{resolveLanguageKey("remove")}</p>
                                                }
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            {
                                                reactionRead.emoji &&
                                                <TooltipDisplayer
                                                    tooltipRender={() => reactionRead.date ? (
                                                        <div>
                                                            {!!r.date && (
                                                                <p>{formatDate(r.date, {timeZone: user.timezone})}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <>{r.emoji}</>
                                                    )}
                                                >
                                                    <p>{r.emoji}</p>
                                                </TooltipDisplayer>
                                            }
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </TabsContent>

                    {
                        emojiList.map((emoji) => {
                            return (
                                <TabsContent key={emoji} value={emoji} className="flex flex-col gap-1 max-h-48 overflow-y-auto p-1">
                                    {
                                        grouped[emoji].map((r, index) => {
                                            return (
                                                <div key={`${r.user?._id ?? ""}-${String(r.date ?? "")}-${index}`} className="flex justify-between px-2 py-1 rounded hover:bg-muted/50 hover:cursor-pointer" onClick={() => r.user?._id && removeReaction(messageId, r.emoji ?? "", r.user._id)}>
                                                    <div className="flex items-center space-x-1">
                                                        {
                                                            reactionRead.user && r.user &&
                                                            <CustomAvatar avatarClassName="size-7" user={r.user} />
                                                        }
                                                        <div>
                                                            <HiddenElement>
                                                                {
                                                                    reactionRead.user && r.user &&
                                                                    <p className="text-sm text-muted-foreground">{getName(r.user)}</p>
                                                                }
                                                            </HiddenElement>
                                                            {
                                                                user?.id === r.user?._id &&
                                                                <p className="text-xs text-muted-foreground">{resolveLanguageKey("remove")}</p>
                                                            }
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        {
                                                            reactionRead.emoji &&
                                                            <TooltipDisplayer
                                                                tooltipRender={() => reactionRead.date ? (
                                                                    <div>
                                                                        {!!r.date && (
                                                                            <p>{formatDate(r.date, {timeZone: user.timezone})}</p>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <>{r.emoji}</>
                                                                )}
                                                            >
                                                                <p>{r.emoji}</p>
                                                            </TooltipDisplayer>
                                                        }
                                                    </div>
                                                </div>
                                            )
                                        })
                                    }
                                </TabsContent>
                            )
                        })
                    }
                </Tabs>
            </PopoverContent>
        </Popover>
    );

}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/center/messages/message/info/reactions.tsx"),
    withAxios(
        {
            url: "/api/user/chats/messages/reaction",
            method: "DELETE",
            data: {}
        },
        true
    ),
    withDebug(true, true)
)(Reactions);