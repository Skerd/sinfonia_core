import {useCallback, useEffect, useMemo, useState, type ReactNode} from "react";
import {useDispatch, useSelector} from "react-redux";
import useWebSocket, {ReadyState} from "react-use-websocket";
import type {AppDispatch, RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {updateWebSocketConnectionStatus} from "@coreModule/helpers/redux/slices/uiSlice.ts";
import {handleWebSocketMessage} from "@baseModule/helpers/websocket/webSocketMessages.ts";
import {buildWebSocketUrl, reconnectDelay, shouldReconnect} from "@baseModule/helpers/websocket/webSocketConnection.ts";
import {handleError} from "@baseModule/helpers/general/errors.ts";
import {SessionSetupScreen, SESSION_SETUP_TOTAL_STEPS} from "@coreModule/components/ui/sessionSetupScreen.tsx";

/**
 * The open socket, or `null` while connecting / disconnected. Module-scoped so non-React code
 * (room joins) can reach it; it is a new object after every reconnect, so callers that need to
 * talk to "the same connection" later should capture it (see `useWebSocketRoom`).
 */
export let clientWebSocket: WebSocket | null = null;

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
 * - `ui.webSocketConnected` and `clientWebSocket` follow the hook's `readyState`, which only
 *   reflects the current socket (a replaced socket closing late cannot mark the app offline).
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
        // Assign before dispatching: effects reacting to the flag read `clientWebSocket` right away.
        clientWebSocket = open ? (getWebSocket() as WebSocket | null) : null;
        dispatch(updateWebSocketConnectionStatus(open));
    }, [readyState, getWebSocket, dispatch]);

    useEffect(() => {
        sendWebsocketMessage = (message) => sendJsonMessage(message);
        return () => {
            sendWebsocketMessage = null;
            clientWebSocket = null;
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
