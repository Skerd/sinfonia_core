import {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {registerWebSocketMessageHandler} from "@coreModule/helpers/websocket/webSocketMessages.ts";
import {REPORT_DESK_COUNTS_CODE, type ReportDeskCounts} from "armonia/src/modules/core/api/reports/contentReport.dto.ts";

/** The count of a `REPORT_DESK_COUNTS` frame; null when it is not one. */
export function readReportDeskCounts(payload: Record<string, unknown>): ReportDeskCounts | null {
    const counts = payload.counts;
    if (typeof counts !== "object" || counts === null) return null;
    const open: unknown = Reflect.get(counts, "open");
    return typeof open === "number" ? {open} : null;
}

/**
 * How many reports wait for the platform's decision (D191), for the menu's badge: read once per company, then kept
 * current by the count the server sends after each report and each decision. 0 while `enabled` is false (outside the
 * platform company, or without the permission to decide reports).
 */
export function useReportDeskOpen(enabled: boolean): number {
    const companyId = useSelector((state: RootState) => state.authentication.user?.company?._id);
    const [open, setOpen] = useState(0);

    useEffect(() => {
        if (!enabled) {
            setOpen(0);
            return;
        }
        const controller = new AbortController();
        apiClient.post<ReportDeskCounts>("/api/reports/desk/counts", {}, {signal: controller.signal})
            .then(({data}) => {
                if (!controller.signal.aborted) setOpen(data.open);
            })
            .catch(() => {
                // A badge must not take down the shell when the desk is briefly unavailable.
            });
        const unregister = registerWebSocketMessageHandler(REPORT_DESK_COUNTS_CODE, (payload) => {
            const counts = readReportDeskCounts(payload);
            if (counts) setOpen(counts.open);
        });
        return () => {
            controller.abort();
            unregister();
        };
    }, [enabled, companyId]);

    return open;
}
