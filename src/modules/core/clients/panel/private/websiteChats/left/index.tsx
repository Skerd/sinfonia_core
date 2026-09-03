import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Globe, SearchIcon} from "lucide-react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {useEffect, useRef, useState} from "react";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {PageHelp, readPageHelp} from "@coreModule/components/custom/pageHelp.tsx";
import type {PublicChatInboxFilter} from "armonia/src/modules/core/api/user/private/chats/channels/channels.constants.ts";
import WebsiteChannelsList from "@coreModule/clients/panel/private/websiteChats/left/channelsList.tsx";

type LeftWebsiteChatPanelProps = WithLanguageType & {
    websiteChannels: PublicChatInboxFilter;
};

function LeftWebsiteChatPanel({resolveLanguageKey, websiteChannels}: LeftWebsiteChatPanelProps) {
    const {read} = useAccess("channels");
    const scrollRef = useRef<HTMLDivElement>(null);
    const [search, setSearch] = useState<string>("");
    const [searchForChannel, setSearchForChannel] = useState<string>("");

    useEffect(() => {
        const timeOut = setTimeout(() => {
            setSearchForChannel(search);
        }, 300);
        return () => {
            clearTimeout(timeOut);
        };
    }, [search]);

    if (!read) {
        return <HiddenElement />;
    }

    const help = readPageHelp(
        resolveLanguageKey,
        websiteChannels === "mine" ? "helpMine" : "helpWaiting",
    );

    return (
        <div className="flex-full w-full gap-y-0.5">
            <div className="px-2 pb-3 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none">
                <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                        <p className="text-xl font-bold">
                            {resolveLanguageKey(websiteChannels === "mine" ? "titleMine" : "titleWaiting")}
                        </p>
                        {help && <PageHelp help={help} />}
                        <Globe size={20} />
                    </div>
                </div>
                <label className={cn(
                    "focus-within:ring-ring focus-within:ring-1 focus-within:outline-hidden",
                    "border-border flex h-9 w-full items-center gap-0 rounded-md border ps-2",
                )}>
                    <SearchIcon size={15} className="me-2 text-muted-foreground" />
                    <span className="sr-only">{resolveLanguageKey("searchChat")}</span>
                    <input
                        type="text"
                        className="w-full flex-1 bg-inherit text-sm focus-visible:outline-hidden"
                        placeholder={resolveLanguageKey("searchChat") + "..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoComplete="off"
                    />
                </label>
            </div>
            <div ref={scrollRef} className="overflow-y-auto px-0 md:px-0">
                <WebsiteChannelsList
                    searchName={searchForChannel}
                    scrollRoot={scrollRef}
                    websiteChannels={websiteChannels}
                />
            </div>
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/websiteChats/left/index.tsx"),
    withDebug(true, true, "channels"),
)(LeftWebsiteChatPanel);
