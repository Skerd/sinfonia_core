import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import {RefObject, useEffect, useRef, useState} from "react";
import {appendChannels, setChannels} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {useDispatch} from "react-redux";
import useIsInViewport from "@coreModule/helpers/hooks/useIsInViewPort.ts";
import Loader from "@coreModule/components/custom/loader.tsx";
import SimpleError from "@coreModule/components/custom/errorViewWrapper.tsx";
import NoData from "@coreModule/components/custom/noData.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import type {PublicChatInboxFilter} from "armonia/src/modules/core/api/user/private/chats/channels/channels.constants.ts";
import {AllChannelsFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/allChannels.form.response.type.ts";
import {AllChannelsFormType} from "armonia/src/modules/core/api/user/private/chats/channels/allChannels.form.type.ts";

type WebsiteChannelsFetcherProps = WithLanguageType & WithAxiosType<AllChannelsFormResponseType, AllChannelsFormType> & {
    searchName: string;
    scrollRoot: RefObject<HTMLElement>;
    websiteChannels: PublicChatInboxFilter;
};

function WebsiteChannelsFetcher({
    resolveLanguageKey,
    loading,
    data,
    error,
    onFilterChange,
    searchName,
    scrollRoot,
    websiteChannels,
}: WebsiteChannelsFetcherProps) {
    const {read} = useAccess("channels");
    const ref = useRef<HTMLDivElement>(null);
    const dispatch = useDispatch();
    const [offset, setOffset] = useState<number>(0);
    const [total, setTotal] = useState<number>(-1);
    const [forceReload, setForceReload] = useState<number>(1);
    const inView = useIsInViewport(ref, scrollRoot);
    const [lastTriggeredOffset, setLastTriggeredOffset] = useState<number | null>(null);

    const limit = 50;
    const hasNext = offset + limit < total;

    useEffect(() => {
        if (!inView) return;
        if (!hasNext) return;
        const nextOffset = offset + limit;
        if (lastTriggeredOffset === nextOffset) return;
        setOffset(nextOffset);
    }, [inView, hasNext, lastTriggeredOffset, offset]);

    useEffect(() => {
        if (!read) return;
        onFilterChange({
            name: searchName,
            websiteChannels: websiteChannels,
            limit,
            offset,
        });
    }, [forceReload, offset, searchName, websiteChannels, read]);

    useEffect(() => {
        setOffset(0);
        setLastTriggeredOffset(null);
        if (scrollRoot?.current) {
            scrollRoot.current.scrollTop = 0;
        }
    }, [searchName, websiteChannels]);

    useEffect(() => {
        if (!data) return;
        setTotal(data.total);
        dispatch(offset === 0 ? setChannels({...data, kind: "website"}) : appendChannels(data));
        setLastTriggeredOffset(offset);
    }, [data]);

    if (!read) {
        return <HiddenElement />;
    }
    if (loading) {
        return <Loader />;
    }
    if (error) {
        return (
            <SimpleError
                title={resolveLanguageKey("failTitle")}
                description={resolveLanguageKey("failTitleTooltip")}
                onClick={() => setForceReload(Date.now())}
            />
        );
    }
    if ((!data || data?.data.length === 0) && !!searchName) {
        return <NoData title={resolveLanguageKey("noDataTitle")} />;
    }
    if (offset === 0 && data?.data?.length === 0) {
        return <></>;
    }

    return <div ref={ref} className="" />;
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/websiteChats/left/channelsFetcher.tsx"),
    withAxios(
        {
            url: "/api/user/chats/channels",
            method: "POST",
            data: {},
        },
        true,
    ),
    withDebug(true, true),
)(WebsiteChannelsFetcher);
