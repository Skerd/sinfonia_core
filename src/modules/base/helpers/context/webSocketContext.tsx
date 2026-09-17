import {useCallback, useEffect, useMemo, useState, type ReactNode} from "react";
import {useDispatch, useSelector} from "react-redux";
import useWebSocket, {ReadyState} from "react-use-websocket";
import type {AppDispatch, RootState} from "@baseModule/helpers/redux/store/generalStore.ts";
import {updateWebSocketConnectionStatus} from "@baseModule/helpers/redux/slices/uiSlice.ts";
import {handleWebSocketMessage} from "@baseModule/helpers/websocket/webSocketMessages.ts";
import {buildWebSocketUrl, reconnectDelay, shouldReconnect} from "@baseModule/helpers/websocket/webSocketConnection.ts";
import {handleError} from "@baseModule/helpers/general/errors.ts";
import {setRoomSocket, type RoomSocket} from "@baseModule/helpers/websocket/roomMemberships.ts";
import {SessionSetupScreen, SESSION_SETUP_TOTAL_STEPS} from "@coreModule/components/ui/sessionSetupScreen.tsx";

/**
 * Sends a JSON message on the socket. While disconnected, messages are queued and flushed on the
 * next open. `null` outside `WebSocketProvider`.
 */
export let sendWebsocketMessage: ((message: unknown) => void) | null = null;

type WebSocketProviderProps = {
    children: ReactNode;
    setupStep?: number;
    setupTotal?: number;
};

/**
 * Shows the setup step, starts the socket, and immediately continues.
 * The connection completes in the background — the panel does not wait for it.
 *
 * - Incoming frames are applied to the store by `handleWebSocketMessage`.
 * - `ui.webSocketConnected` and the room socket (`setRoomSocket`) follow the hook's `readyState`,
 *   which only reflects the current socket (a replaced socket closing late cannot mark the app offline).
 * - Reconnects with backoff unless `shouldReconnect` says the close is final; the URL
 *   (token / language) changing opens a fresh connection.
 */
export function WebSocketProvider({
    children,
    setupStep = 3,
    setupTotal = SESSION_SETUP_TOTAL_STEPS,
}: WebSocketProviderProps) {
    const dispatch = useDispatch<AppDispatch>();
    const token = useSelector((state: RootState) => state.authentication.token);
    const userId = useSelector((state: RootState) => state.authentication.user?.id);
    const languageCode = useSelector((state: RootState) => state.language.languageCode);
    const [showSetup, setShowSetup] = useState(true);

    const url = useMemo(() => (token ? buildWebSocketUrl(token, languageCode) : null), [token, languageCode]);

    const onMessage = useCallback(
        (event: MessageEvent) => handleWebSocketMessage(event.data, {dispatch, userId}),
        [dispatch, userId],
    );

    const {sendJsonMessage, getWebSocket, readyState} = useWebSocket(url, {
        // Every socket error is followed by a close, and the close handler already reconnects;
        // retrying on the error as well would schedule two reconnects per failure.
        retryOnError: false,
        reconnectAttempts: Infinity,
        reconnectInterval: reconnectDelay,
        shouldReconnect,
        onClose: (event) => {
            console.info(`WS: connection closed (code: ${event.code}, reason: ${event.reason || "none"})`);
        },
        // A socket `error` event carries no detail; the close that follows has the code.
        onError: () => handleError(new Error("WebSocket connection error"), {context: "WebSocket"}),
        onMessage,
    });

    useEffect(() => {
        const open = readyState === ReadyState.OPEN;
        setRoomSocket(open ? (getWebSocket() as RoomSocket | null) : null);
        dispatch(updateWebSocketConnectionStatus(open));
        return () => setRoomSocket(null);
    }, [readyState, getWebSocket, dispatch]);

    useEffect(() => {
        sendWebsocketMessage = (message) => sendJsonMessage(message);
        return () => {
            sendWebsocketMessage = null;
            dispatch(updateWebSocketConnectionStatus(false));
        };
    }, [sendJsonMessage, dispatch]);

    useEffect(() => {
        setShowSetup(false);
    }, []);

    if (showSetup) {
        return (
            <SessionSetupScreen
                step={setupStep}
                total={setupTotal}
                phase="websocket"
                error={false}
                onRetry={noop}
            />
        );
    }

    return children;
}

const noop = () => {};
