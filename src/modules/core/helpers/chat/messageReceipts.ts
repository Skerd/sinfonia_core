import {sendWebsocketMessage} from "@coreModule/helpers/context/webSocketContext.tsx";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {store} from "@coreModule/helpers/redux/store/generalStore.ts";
import type {MarkMessageReceiptFormType} from "armonia/src/modules/core/api/user/private/chats/messages/actions/markMessageReceipt.form.type.ts";
import type {MarkMessageReceiptFormResponseType} from "armonia/src/modules/core/api/user/private/chats/messages/actions/markMessageReceipt.form.response.type.ts";
import {WebSocketFEMessageCodes} from "armonia/src/modules/core/websocket/types.ts";

const RECEIPT_HTTP_RETRY_MS = 750;

/**
 * Best-effort delivery/read receipts.
 * Prefers the live socket (no client ack from apply); otherwise PATCH with one retry.
 * Server `applyMessageReceipts` is idempotent — retries are safe.
 *
 * @returns `true` if the send was accepted locally (WS) or the HTTP call succeeded.
 */
export async function sendReceiptsNow(
    channelId: string,
    messageIds: string[],
    kind: MarkMessageReceiptFormType["kind"],
): Promise<boolean> {
    const ids = [...new Set(messageIds.filter(Boolean))];
    if (!channelId || !ids.length) {
        return true;
    }

    const payload: MarkMessageReceiptFormType = {channelId, messageIds: ids, kind};

    // Prefer WS only while Redux says OPEN — `sendWebsocketMessage` queues while reconnecting;
    // receipts should hit REST immediately instead of sitting in that queue.
    if (store.getState().ui.webSocketConnected && sendWebsocketMessage) {
        try {
            sendWebsocketMessage({
                code: WebSocketFEMessageCodes.MESSAGE_RECEIPT_UPDATE,
                payload,
            });
            return true;
        } catch {
            // Fall through to HTTP.
        }
    }

    return patchReceiptsWithRetry(payload);
}

async function patchReceiptsWithRetry(payload: MarkMessageReceiptFormType): Promise<boolean> {
    if (await patchReceipts(payload)) {
        return true;
    }
    await wait(RECEIPT_HTTP_RETRY_MS);
    return patchReceipts(payload);
}

async function patchReceipts(payload: MarkMessageReceiptFormType): Promise<boolean> {
    try {
        await apiClient.patch<MarkMessageReceiptFormResponseType>(
            "/api/user/chats/messages/readReceipt",
            payload,
        );
        return true;
    } catch {
        return false;
    }
}

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
