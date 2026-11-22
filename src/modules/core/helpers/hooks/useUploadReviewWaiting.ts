import {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {registerWebSocketMessageHandler} from "@coreModule/helpers/websocket/webSocketMessages.ts";
import {
    UPLOAD_REVIEW_COUNTS_CODE,
    UPLOAD_REVIEW_VIEWS,
    type UploadReviewCounts,
} from "armonia/src/modules/core/api/auxiliary/private/uploadReview/uploadReview.dto.ts";

/** The counts of an `UPLOAD_REVIEW_COUNTS` frame, read field by field; null when it is not one. */
export function readUploadReviewCounts(payload: Record<string, unknown>): UploadReviewCounts | null {
    const counts = payload.counts;
    if (typeof counts !== "object" || counts === null) return null;
    const count = (view: (typeof UPLOAD_REVIEW_VIEWS)[number]): number | null => {
        const value: unknown = Reflect.get(counts, view);
        return typeof value === "number" ? value : null;
    };
    const [flagged, rejected, approved, refused] = UPLOAD_REVIEW_VIEWS.map(count);
    if (flagged === null || rejected === null || approved === null || refused === null) return null;
    return {flagged, rejected, approved, refused};
}

/**
 * How many uploads wait for the platform's review (D177), for the menu's badge: read once per company, then kept
 * current by the counts the server sends after each flagged upload and each decision. 0 while `enabled` is false
 * (outside the platform company, or without the review permission).
 */
export function useUploadReviewWaiting(enabled: boolean): number {
    const companyId = useSelector((state: RootState) => state.authentication.user?.company?._id);
    const [waiting, setWaiting] = useState(0);

    useEffect(() => {
        if (!enabled) {
            setWaiting(0);
            return;
        }
        const controller = new AbortController();
        apiClient.post<UploadReviewCounts>("/api/auxiliary/uploadReview/counts", {}, {signal: controller.signal})
            .then(({data}) => {
                if (!controller.signal.aborted) setWaiting(data.flagged);
            })
            .catch(() => {
                // A badge must not take down the shell when the review is briefly unavailable.
            });
        const unregister = registerWebSocketMessageHandler(UPLOAD_REVIEW_COUNTS_CODE, (payload) => {
            const counts = readUploadReviewCounts(payload);
            if (counts) setWaiting(counts.flagged);
        });
        return () => {
            controller.abort();
            unregister();
        };
    }, [enabled, companyId]);

    return waiting;
}
