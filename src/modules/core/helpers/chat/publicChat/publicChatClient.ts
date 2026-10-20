/**
 * Transport for the public-website visitor chat, shared by every public site
 * (the propertyManagement site and the eCommerce shop).
 *
 * Deliberately does NOT reuse the shared `apiClient`:
 *  - that instance attaches the logged-in panel user's `x-auth-token` to every
 *    request, which has no business going to an anonymous public endpoint; and
 *  - its response interceptor treats `no_token` / `token_verification_failed` as
 *    an expired *session* and dispatches `markSessionExpired()`. The visitor
 *    endpoints legitimately return those codes when a visitor token is missing
 *    or stale, which would pop a session-expired dialog on a public marketing
 *    page.
 *
 * A site whose visitors can sign in passes their login token to
 * {@link startSession} only — that one call is what ties the conversation to the
 * customer; every later call is authorised by the visitor token alone.
 *
 * The visitor token lives in localStorage so a returning visitor resumes the
 * same conversation; it is scoped server-side to exactly one chat channel.
 */

import axios from "axios";
import type {
    PublicChatMessageType,
    PublicChatStatusType,
} from "armonia/src/modules/core/api/user/public/publicChat/publicChat.types";
import type {
    StartPublicChatSessionFormResponseType,
} from "armonia/src/modules/core/api/user/public/publicChat/startPublicChatSession/startPublicChatSession.form.response.type";
import type {
    PublicChatMessagesFormResponseType,
} from "armonia/src/modules/core/api/user/public/publicChat/publicChatMessages/publicChatMessages.form.response.type";
import type {
    SendPublicChatMessageFormResponseType,
} from "armonia/src/modules/core/api/user/public/publicChat/sendPublicChatMessage/sendPublicChatMessage.form.response.type";
import type {
    RequestPublicChatHandoffFormResponseType,
} from "armonia/src/modules/core/api/user/public/publicChat/requestPublicChatHandoff/requestPublicChatHandoff.form.response.type";

const BASE_PATH = "/api/public/chat";
const TOKEN_STORAGE_KEY = "arpeggio.publicChat.token";
const DEVICE_ID_STORAGE_KEY = "arpeggio.publicChat.deviceId";
const VISITOR_TOKEN_HEADER = "x-visitor-token";

/** Shared axios instance for public chat calls, including feature-module ones. */
export const publicChatClient = axios.create();

// -------------------------------------------------------------------------
// Token persistence
// -------------------------------------------------------------------------

export function getVisitorToken(): string | null {
    try {
        return window.localStorage.getItem(TOKEN_STORAGE_KEY);
    }
    catch {
        // Private browsing / storage disabled: the chat still works, it just
        // cannot be resumed after a reload.
        return null;
    }
}

export function setVisitorToken(token: string): void {
    try {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
    catch {
        /* non-fatal */
    }
}

export function clearVisitorToken(): void {
    try {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    catch {
        /* non-fatal */
    }
}

/**
 * A stable per-browser device id.
 *
 * REQUIRED on every request: maestro's global request validator rejects any call
 * without `x-device-id` with a 400 before it reaches the route. An anonymous
 * visitor has no account to derive one from, so we mint and persist our own
 * under a separate key from the panel's — the two apps must not share identity.
 */
function getPublicDeviceId(): string {
    try {
        const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
        if (existing) {
            return existing;
        }
        const generated = crypto.randomUUID();
        window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, generated);
        return generated;
    }
    catch {
        // Storage blocked (private mode): a per-load id still satisfies the
        // validator, it just will not be stable across reloads.
        return crypto.randomUUID();
    }
}

/** Headers every public chat call sends: device id, visitor token, language. */
export function publicChatHeaders(languageCode?: string): Record<string, string> {
    const headers: Record<string, string> = {
        "x-device-id": getPublicDeviceId(),
    };
    const token = getVisitorToken();
    if (token) {
        headers[VISITOR_TOKEN_HEADER] = token;
    }
    if (languageCode) {
        headers["language"] = languageCode;
    }
    return headers;
}

// -------------------------------------------------------------------------
// Calls
// -------------------------------------------------------------------------

export type StartSessionInput = {
    languageCode?: string;
    entryUrl?: string;
    referrer?: string;
    /**
     * Opaque ObjectId map chosen by the feature module (e.g. propertyManagement
     * sends `project` / `unit`). Core stores the keys as-is.
     */
    context?: Record<string, string>;
    /** The site's login token, when the visitor is signed in. */
    customerToken?: string;
};

/**
 * Open or resume a conversation. Sends any stored token so the server can
 * resume; the server mints a fresh one when it cannot, which we then persist.
 */
export async function startSession(
    input: StartSessionInput = {},
): Promise<StartPublicChatSessionFormResponseType> {
    const {languageCode, entryUrl, referrer, context, customerToken} = input;
    const {data} = await publicChatClient.post<StartPublicChatSessionFormResponseType>(
        `${BASE_PATH}/session`,
        {
            entryUrl,
            referrer,
            ...(context && Object.keys(context).length > 0 ? {context} : {}),
            visitorToken: getVisitorToken() ?? undefined,
        },
        {
            headers: {
                ...publicChatHeaders(languageCode),
                ...(customerToken ? {"x-auth-token": customerToken} : {}),
            },
        },
    );
    if (data?.token) {
        setVisitorToken(data.token);
    }
    return data;
}

/** Fetch messages, optionally only those newer than `since` (the polling path). */
export async function fetchMessages(params: {
    since?: string;
    limit?: number;
    languageCode?: string;
}): Promise<PublicChatMessagesFormResponseType> {
    const {since, limit, languageCode} = params;
    const {data} = await publicChatClient.post<PublicChatMessagesFormResponseType>(
        `${BASE_PATH}/messages`,
        {since, limit},
        {headers: publicChatHeaders(languageCode)},
    );
    return data;
}

export async function sendMessage(params: {
    text: string;
    languageCode?: string;
}): Promise<SendPublicChatMessageFormResponseType> {
    const {text, languageCode} = params;
    const {data} = await publicChatClient.put<SendPublicChatMessageFormResponseType>(
        `${BASE_PATH}/messages`,
        {text},
        {headers: publicChatHeaders(languageCode)},
    );
    return data;
}

/** Ask for a human. Returns false when the chat was already escalated. */
export async function requestHandoff(params: {
    note?: string;
    languageCode?: string;
}): Promise<RequestPublicChatHandoffFormResponseType> {
    const {note, languageCode} = params;
    const {data} = await publicChatClient.post<RequestPublicChatHandoffFormResponseType>(
        `${BASE_PATH}/handoff`,
        {note},
        {headers: publicChatHeaders(languageCode)},
    );
    return data;
}

/**
 * Right-to-erasure: destroy the conversation and the anonymous identity behind
 * it. Distinct from {@link closeSession}, which keeps the transcript.
 */
export async function eraseConversation(languageCode?: string): Promise<void> {
    await publicChatClient.delete(BASE_PATH, {headers: publicChatHeaders(languageCode)});
    clearVisitorToken();
}

export async function closeSession(languageCode?: string): Promise<void> {
    await publicChatClient.post(
        `${BASE_PATH}/close`,
        {},
        {headers: publicChatHeaders(languageCode)},
    );
    clearVisitorToken();
}

export type {PublicChatMessageType, PublicChatStatusType};
