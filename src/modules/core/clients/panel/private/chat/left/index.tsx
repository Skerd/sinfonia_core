import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import ChannelsList from "@coreModule/clients/panel/private/chat/left/channelsList.tsx";
import {MessagesSquare, SearchIcon} from "lucide-react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {useEffect, useRef, useState} from "react";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import SearchChatUsers from "@coreModule/clients/panel/private/chat/searchChatUsers";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";

type LeftChatPanelProps = WithLanguageType & {}

function LeftChatPanel({
    resolveLanguageKey,
}: LeftChatPanelProps){

    const {read, create} = useAccess("channels");
    const scrollRef = useRef<HTMLDivElement>(null);
    const [search, setSearch] = useState<string>("");
    const [searchForChannel, setSearchForChannel] = useState<string>("");
    useEffect(() => {
        let timeOut = setTimeout(() => {
            setSearchForChannel(search);
        }, 300);
        return () => {
            if( !!timeOut ){
                clearTimeout(timeOut);
            }
        }
    }, [search]);

    if( !read ){
        return <HiddenElement />
    }

    return (
        <div className="flex-full w-full space-y-0.5">

            <div className='px-2 pb-3 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none'>
                <div className='flex items-center justify-between py-2'>
                    <div className='flex items-center gap-2'>
                        <p className='text-xl font-bold'>{resolveLanguageKey("title")}</p>
                        <MessagesSquare size={20} />
                    </div>
                    {
                        create &&
                        <div>
                            <SearchChatUsers />
                        </div>
                    }
                </div>
                <label className={cn('focus-within:ring-ring focus-within:ring-1 focus-within:outline-hidden', 'border-border h-9 flex w-full items-center space-x-0 rounded-md border ps-2')}>
                    <SearchIcon size={15} className='me-2 stroke-slate-500' />
                    <span className='sr-only'>{resolveLanguageKey("searchChat")}</span>
                    <input
                        type='text'
                        className='w-full flex-1 bg-inherit text-sm focus-visible:outline-hidden'
                        placeholder={resolveLanguageKey("searchChat") + "..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </label>
            </div>

            <div ref={scrollRef} className='overflow-y-auto px-2 md:px-0'>
                <ChannelsList searchName={searchForChannel} scrollRoot={scrollRef}/>
            </div>
        </div>
    )

}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/chat/left/index.tsx"),
    withDebug(true, true)
)(LeftChatPanel)