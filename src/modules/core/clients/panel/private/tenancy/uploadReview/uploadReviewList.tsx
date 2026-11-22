import {useEffect, useRef, useState} from "react";
import {useSearchParams} from "react-router-dom";
import {compose} from "redux";
import {IconChevronLeft, IconChevronRight, IconPhotoCheck} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {Tabs, TabsList, TabsTrigger} from "@coreModule/components/ui/tabs.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from "@coreModule/components/ui/empty.tsx";
import UploadReviewCard from "@coreModule/clients/panel/private/tenancy/uploadReview/uploadReviewCard.tsx";
import UploadReviewSheet from "@coreModule/clients/panel/private/tenancy/uploadReview/uploadReviewSheet.tsx";
import UploadReviewSheetLoader from "@coreModule/clients/panel/private/tenancy/uploadReview/uploadReviewSheetLoader.tsx";
import {registerWebSocketMessageHandler} from "@coreModule/helpers/websocket/webSocketMessages.ts";
import {
    UPLOAD_REVIEW_COUNTS_CODE,
    UPLOAD_REVIEW_VIEWS,
    type UploadReviewItem,
    type UploadReviewListResponse,
    type UploadReviewView,
} from "armonia/src/modules/core/api/auxiliary/private/uploadReview/uploadReview.dto.ts";

export const UPLOAD_REVIEW_PAGE_SIZE = 24;

type ListFilter = {view: UploadReviewView; page: number; limit: number};

type UploadReviewListProps = WithLanguageType & WithAxiosType<UploadReviewListResponse, ListFilter>;

const isView = (value: string): value is UploadReviewView => UPLOAD_REVIEW_VIEWS.some((view) => view === value);

/** One list of the upload review at a time, chosen with its tab (each tab says how many it holds), a page at a time. */
function UploadReviewList({resolveLanguageKey, data, loading, onFilterChange, justForceRefresh}: UploadReviewListProps) {
    const [filter, setFilter] = useState<ListFilter>({view: "flagged", page: 1, limit: UPLOAD_REVIEW_PAGE_SIZE});
    const show = (next: ListFilter) => {
        setFilter(next);
        onFilterChange(next);
    };
    // A file flagged, or decided by another reviewer, while the page is open: the server sends the new counts.
    const refresh = useRef(justForceRefresh);
    refresh.current = justForceRefresh;
    useEffect(() => registerWebSocketMessageHandler(UPLOAD_REVIEW_COUNTS_CODE, () => refresh.current()), []);
    // A file's sheet: opened from its card, or from the address (`?open=<id>`, a notice's link).
    const [sheetItem, setSheetItem] = useState<UploadReviewItem | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const openId = searchParams.get("open");
    const closeAddressSheet = () => setSearchParams((params) => {
        params.delete("open");
        return params;
    }, {replace: true});
    const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
    const items = data?.items ?? [];

    return (
        <div className="flex flex-col gap-4 pb-24">
            <Tabs value={filter.view} onValueChange={(value) => isView(value) && show({...filter, view: value, page: 1})}>
                <TabsList>
                    {UPLOAD_REVIEW_VIEWS.map((view) => (
                        <TabsTrigger key={view} value={view}>
                            {resolveLanguageKey(`views.${view}`)}
                            {data ? <span className="ms-1.5 text-muted-foreground tabular-nums">{data.counts[view]}</span> : null}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {!loading && data && items.length === 0 ? (
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon"><IconPhotoCheck /></EmptyMedia>
                        <EmptyTitle>{resolveLanguageKey(`empty.${filter.view}.title`)}</EmptyTitle>
                        <EmptyDescription>{resolveLanguageKey(`empty.${filter.view}.description`)}</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {items.map((item) => (
                        <UploadReviewCard key={item._id} item={item} onDecided={justForceRefresh} onOpenDetails={() => setSheetItem(item)} />
                    ))}
                </div>
            )}

            {sheetItem && (
                <UploadReviewSheet
                    key={sheetItem._id}
                    open
                    onOpenChange={(open: boolean) => { if (!open) setSheetItem(null); }}
                    item={sheetItem}
                    onDecided={justForceRefresh}
                />
            )}
            {openId && !sheetItem && (
                <UploadReviewSheetLoader key={openId} mediaId={openId} onClose={closeAddressSheet} onDecided={justForceRefresh} />
            )}

            {pages > 1 && (
                <div className="flex items-center justify-end gap-2">
                    <span className="text-sm text-muted-foreground">
                        {resolveLanguageKey("pagination.page").replace("{page}", String(filter.page)).replace("{pages}", String(pages))}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={resolveLanguageKey("pagination.previous")}
                        disabled={loading || filter.page <= 1}
                        onClick={() => show({...filter, page: filter.page - 1})}
                    >
                        <IconChevronLeft />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={resolveLanguageKey("pagination.next")}
                        disabled={loading || filter.page >= pages}
                        onClick={() => show({...filter, page: filter.page + 1})}
                    >
                        <IconChevronRight />
                    </Button>
                </div>
            )}
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/uploadReview/uploadReviewList.tsx"),
    withAxios<UploadReviewListResponse, ListFilter>({method: "POST", url: "/api/auxiliary/uploadReview/list", data: {}}),
    withDebug(true, true, "media"),
)(UploadReviewList);
