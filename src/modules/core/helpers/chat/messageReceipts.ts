import {sendWebsocketMessage} from "@coreModule/helpers/hocs/withWebSocket.tsx";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import {store} from "@coreModule/helpers/redux/store/generalStore.ts";
import {MarkMessageReceiptFormResponseType} from "armonia/src/modules/core/api/user/private/chats/messages/actions/markMessageReceipt.form.response.type.ts";
import {WebSocketFEMessageCodes} from "armonia/src/modules/core/websocket/types.ts";

type ReceiptKind = "delivered" | "read";

export function sendReceiptsNow(channelId: string, messageIds: string[], kind: ReceiptKind): void {
    const ids = [...new Set(messageIds.filter(Boolean))];
    if (!channelId || !ids.length) {
        return;
    }

    const payload = {channelId, messageIds: ids, kind};
    const wsOk = store.getState().ui.webSocketConnected;
    if (wsOk && sendWebsocketMessage) {
        sendWebsocketMessage?.({
            code: WebSocketFEMessageCodes.MESSAGE_RECEIPT_UPDATE,
            payload
        });
        return;
    }
    void apiClient.patch<MarkMessageReceiptFormResponseType>("/api/user/chats/messages/readReceipt", payload).catch(() => {});
}

/** Multiple ids in a single request (e.g. after loading history). */
export function sendMessageReceiptBatch(channelId: string, messageIds: string[], kind: ReceiptKind): void {
    sendReceiptsNow(channelId, messageIds, kind);
}
