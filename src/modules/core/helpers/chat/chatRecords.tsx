import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode} from "react";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {useDynamicLanguage} from "@coreModule/helpers/hooks/useDynamicLanguage.ts";
import {recordRefKey, type MessageRecordRef} from "armonia/src/modules/core/helpers/chatTokens";
import type {
    ResolveChatRecordsFormResponseType,
    ResolvedChatRecord,
    SearchChatRecordsFormResponseType,
} from "armonia/src/modules/core/api/user/private/chats/records/records.form.response.type";

/**
 * Records shared in chat messages (D162), as the signed-in user may see them. A message carries only `{collection, id}`;
 * the labels come from `/api/user/chats/records/resolve`, under the user's own permissions. One provider per chat page
 * caches them (entity data stays out of Redux, FE-05) and batches the refs every message, preview and composer asks for
 * into one request per render.
 */

const RESOLVE_URL = "/api/user/chats/records/resolve";
/** The resolve form's own limit. */
const RESOLVE_BATCH = 100;

type ChatRecordsContextValue = {
    /** What is known of `ref`; `undefined` until it is resolved. */
    get: (ref: MessageRecordRef) => ResolvedChatRecord | undefined;
    /** Resolves the refs not known or asked for yet. */
    request: (refs: MessageRecordRef[]) => void;
    /** Resolves `ref` again (after its sheet was open: it may have been renamed or deleted there). */
    refresh: (ref: MessageRecordRef) => void;
};

const ChatRecordsContext = createContext<ChatRecordsContextValue | null>(null);

export function ChatRecordsProvider({children}: {children: ReactNode}) {
    const [records, setRecords] = useState<ReadonlyMap<string, ResolvedChatRecord>>(() => new Map());
    /** Asked for, answered or not: a failed request is not retried on every render, only through `refresh`. */
    const asked = useRef(new Set<string>());
    const queue = useRef(new Map<string, MessageRecordRef>());
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            if (timer.current) clearTimeout(timer.current);
        };
    }, []);

    const flush = useCallback(() => {
        timer.current = null;
        const refs = [...queue.current.values()];
        queue.current.clear();
        for (let start = 0; start < refs.length; start += RESOLVE_BATCH) {
            const batch = refs.slice(start, start + RESOLVE_BATCH);
            apiClient.post<ResolveChatRecordsFormResponseType>(RESOLVE_URL, {refs: batch})
                .then((response) => {
                    if (!mounted.current) return;
                    setRecords((previous) => {
                        const next = new Map(previous);
                        for (const record of response.data.records) next.set(recordRefKey(record), record);
                        return next;
                    });
                })
                .catch(() => {
                    // Left unresolved: the chip shows the record's type until the user opens it or reloads.
                });
        }
    }, []);

    const request = useCallback((refs: MessageRecordRef[]) => {
        let added = false;
        for (const ref of refs) {
            const key = recordRefKey(ref);
            if (asked.current.has(key)) continue;
            asked.current.add(key);
            queue.current.set(key, ref);
            added = true;
        }
        if (added && !timer.current) timer.current = setTimeout(flush, 0);
    }, [flush]);

    const refresh = useCallback((ref: MessageRecordRef) => {
        asked.current.delete(recordRefKey(ref));
        request([ref]);
    }, [request]);

    const get = useCallback((ref: MessageRecordRef) => records.get(recordRefKey(ref)), [records]);

    const value = useMemo(() => ({get, request, refresh}), [get, request, refresh]);
    return <ChatRecordsContext value={value}>{children}</ChatRecordsContext>;
}

/** The records cache, or `null` outside a chat page (website chats share no records). */
export function useChatRecords(): ChatRecordsContextValue | null {
    return useContext(ChatRecordsContext);
}

/** Resolves `refs` (once) and returns what the user may see of each, in the same order. */
export function useResolvedRecords(refs: MessageRecordRef[]): (ResolvedChatRecord | undefined)[] {
    const records = useChatRecords();
    const key = refs.map(recordRefKey).join("|");
    useEffect(() => {
        if (records && refs.length > 0) records.request(refs);
        // `key` stands for `refs`, which callers rebuild every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [records, key]);
    return refs.map((ref) => records?.get(ref));
}

/**
 * A record's name for plain-text previews (channel list, reply quotes, the composer): its label once resolved, its
 * kind's name until then, or when the user may not see it. Asks for the unknown ones as it goes.
 */
export function useRecordLabel(): (ref: MessageRecordRef) => string {
    const records = useChatRecords();
    const typeLabel = useRecordTypeLabel();
    return useCallback((ref: MessageRecordRef) => {
        const resolved = records?.get(ref);
        if (resolved?.status === "ok") return resolved.label;
        // Only queues the ref; the answer arrives in a later render.
        if (!resolved) records?.request([ref]);
        return typeLabel(ref.collection);
    }, [records, typeLabel]);
}

const SEARCH_URL = "/api/user/chats/records/search";
/** Characters before the composer searches records, as the server asks. */
const SEARCH_MIN_CHARS = 2;
/** Wait for the user to pause typing before searching every kind. */
const SEARCH_DEBOUNCE_MS = 250;

/** A record the composer offers after `@`. */
export type ChatRecordSuggestion = MessageRecordRef & {label: string; photo?: string};

/**
 * Searches every kind of record the user may read, for the composer's `@` list. Debounced: a query typed over is never
 * sent, and react-mentions ignores answers to queries it no longer shows.
 */
export function useChatRecordSearch(): (query: string, done: (suggestions: ChatRecordSuggestion[]) => void) => void {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
    }, []);
    return useCallback((query: string, done: (suggestions: ChatRecordSuggestion[]) => void) => {
        if (timer.current) clearTimeout(timer.current);
        const q = query.trim();
        if (q.length < SEARCH_MIN_CHARS) {
            done([]);
            return;
        }
        timer.current = setTimeout(() => {
            apiClient.post<SearchChatRecordsFormResponseType>(SEARCH_URL, {q})
                .then((response) => done(response.data.groups.flatMap((group) =>
                    group.items.map((item) => ({collection: group.collection, id: item.id, label: item.label, photo: item.photo})))))
                .catch(() => done([]));
        }, SEARCH_DEBOUNCE_MS);
    }, []);
}

/** The roles screen names every kind of record (`groups.<Collection>`, merged from every module); chat reuses it. */
const RECORD_TYPE_LANGUAGE = "src/modules/core/clients/panel/private/tenancy/systemSettings/roles/permissionsTable.tsx";

/** A record kind's name, e.g. `products` → "Products", from the permission groups each module labels. */
export function useRecordTypeLabel(): (collection: string) => string {
    const {resolveLanguageKey} = useDynamicLanguage(RECORD_TYPE_LANGUAGE);
    return useCallback((collection: string) => {
        const group = collection.charAt(0).toUpperCase() + collection.slice(1).toLowerCase();
        return resolveLanguageKey(`groups.${group}`, true) ?? group;
    }, [resolveLanguageKey]);
}
