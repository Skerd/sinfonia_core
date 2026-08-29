import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {
    TableColumnConfig,
} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type";
import {
    clearStoredDrafts,
    EMPTY_DRAFTS,
    loadDrafts,
    saveDrafts,
    tableDraftKey,
    viewDraftKey,
    type StudioDrafts,
} from "./studioDraftStore.ts";

/**
 * A continuous edit — typing in one inspector field — collapses into a single undo step
 * while the same {@link CommitOptions.coalesceKey} keeps arriving inside this window.
 */
const COALESCE_WINDOW_MS = 500;

/** How long to wait for typing to settle before writing to localStorage. */
const PERSIST_DEBOUNCE_MS = 300;

export type CommitOptions = {
    /**
     * Identifies the control being edited (e.g. `"0.1:field.label"`). Consecutive commits
     * carrying the same key replace the previous history entry instead of adding one, so
     * undo steps back over a whole edit rather than one character.
     */
    coalesceKey?: string;
};

type StudioDraftContextValue = {
    drafts: StudioDrafts;
    getViewDraft: (model: string, viewKey: string) => ViewConfig | undefined;
    setViewDraft: (
        model: string,
        viewKey: string,
        config: ViewConfig,
        options?: CommitOptions,
    ) => void;
    clearViewDraft: (model: string, viewKey: string) => void;
    getTableDraft: (collection: string) => TableColumnConfig[] | undefined;
    setTableDraft: (
        collection: string,
        columns: TableColumnConfig[],
        options?: CommitOptions,
    ) => void;
    clearTableDraft: (collection: string) => void;
    clearAllDrafts: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    /** Set when persistence failed — drafts are memory-only until it clears. */
    persistError: string | null;
    /**
     * Where the debounced write has got to. Persistence is deferred ~300ms, so without this
     * there is a window in which edits are not on disk and nothing on screen says so.
     */
    saveState: "idle" | "pending" | "saved" | "error";
};

const StudioDraftContext = createContext<StudioDraftContextValue | null>(null);

/** Undo depth. Deep enough for a working session, shallow enough to stay cheap. */
const HISTORY_LIMIT = 100;

export function StudioDraftProvider({children}: {children: ReactNode}) {
    const [drafts, setDrafts] = useState<StudioDrafts>(() => loadDrafts());

    /*
     * History is in-memory only. Persisting it would let an undo reach back past a
     * page reload to a state the developer can no longer see in the editor, which
     * reads as the Studio changing things on its own.
     */
    const past = useRef<StudioDrafts[]>([]);
    const future = useRef<StudioDrafts[]>([]);
    const [historyVersion, setHistoryVersion] = useState(0);

    /**
     * Tracks the control the last commit came from, so a run of keystrokes in one field
     * produces one undo entry. Structural edits pass no key and always push.
     */
    const lastCommit = useRef<{key: string; at: number} | null>(null);

    const [persistError, setPersistError] = useState<string | null>(null);
    const [saveState, setSaveState] = useState<"idle" | "pending" | "saved" | "error">("idle");

    /*
     * Persistence is debounced, and separately from the undo coalescing above: that
     * collapses *history entries*, this collapses *writes*. Every commit used to
     * `JSON.stringify` every draft synchronously, so a fast typist re-serialised the whole
     * store on each keystroke.
     */
    const pending = useRef<StudioDrafts | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const flush = useCallback(() => {
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
        }
        const next = pending.current;
        if (!next) return;
        pending.current = null;
        const result = saveDrafts(next);
        setPersistError(result.ok ? null : result.error);
        setSaveState(result.ok ? "saved" : "error");
    }, []);

    const persist = useCallback(
        (next: StudioDrafts) => {
            pending.current = next;
            setSaveState("pending");
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(flush, PERSIST_DEBOUNCE_MS);
        },
        [flush],
    );

    /* A reload must not race the debounce window. */
    useEffect(() => {
        const onBeforeUnload = () => flush();
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", onBeforeUnload);
            flush();
        };
    }, [flush]);

    /** Single write path: pushes the previous value onto the undo stack and persists. */
    const commit = useCallback((next: StudioDrafts) => {
        lastCommit.current = null;
        setDrafts((prev) => {
            past.current = [...past.current, prev].slice(-HISTORY_LIMIT);
            future.current = [];
            persist(next);
            return next;
        });
        setHistoryVersion((v) => v + 1);
    }, [persist]);

    const setViewDraft = useCallback((
        model: string,
        viewKey: string,
        config: ViewConfig,
        options?: CommitOptions,
    ) => {
        const now = Date.now();
        const previous = lastCommit.current;
        const coalesce =
            !!options?.coalesceKey &&
            previous?.key === options.coalesceKey &&
            now - previous.at < COALESCE_WINDOW_MS;
        lastCommit.current = options?.coalesceKey
            ? {key: options.coalesceKey, at: now}
            : null;

        setDrafts((prev) => {
            if (!coalesce) {
                past.current = [...past.current, prev].slice(-HISTORY_LIMIT);
            }
            future.current = [];
            const next: StudioDrafts = {
                ...prev,
                views: {...prev.views, [viewDraftKey(model, viewKey)]: config},
            };
            persist(next);
            return next;
        });
        setHistoryVersion((v) => v + 1);
    }, [persist]);

    const clearViewDraft = useCallback((model: string, viewKey: string) => {
        lastCommit.current = null;
        setDrafts((prev) => {
            const key = viewDraftKey(model, viewKey);
            if (!(key in prev.views)) return prev;
            past.current = [...past.current, prev].slice(-HISTORY_LIMIT);
            future.current = [];
            const views = {...prev.views};
            delete views[key];
            const next: StudioDrafts = {...prev, views};
            persist(next);
            return next;
        });
        setHistoryVersion((v) => v + 1);
    }, [persist]);

    const setTableDraft = useCallback((
        collection: string,
        columns: TableColumnConfig[],
        options?: CommitOptions,
    ) => {
        const now = Date.now();
        const previous = lastCommit.current;
        const coalesce =
            !!options?.coalesceKey &&
            previous?.key === options.coalesceKey &&
            now - previous.at < COALESCE_WINDOW_MS;
        lastCommit.current = options?.coalesceKey ? {key: options.coalesceKey, at: now} : null;

        setDrafts((prev) => {
            if (!coalesce) {
                past.current = [...past.current, prev].slice(-HISTORY_LIMIT);
            }
            future.current = [];
            const next: StudioDrafts = {
                ...prev,
                tables: {...prev.tables, [tableDraftKey(collection)]: columns},
            };
            persist(next);
            return next;
        });
        setHistoryVersion((v) => v + 1);
    }, [persist]);

    const clearTableDraft = useCallback((collection: string) => {
        lastCommit.current = null;
        setDrafts((prev) => {
            const key = tableDraftKey(collection);
            if (!(key in prev.tables)) return prev;
            past.current = [...past.current, prev].slice(-HISTORY_LIMIT);
            future.current = [];
            const tables = {...prev.tables};
            delete tables[key];
            const next: StudioDrafts = {...prev, tables};
            persist(next);
            return next;
        });
        setHistoryVersion((v) => v + 1);
    }, [persist]);

    const clearAllDrafts = useCallback(() => {
        clearStoredDrafts();
        commit(EMPTY_DRAFTS);
        flush();
    }, [commit, flush]);

    const undo = useCallback(() => {
        lastCommit.current = null;
        /* A deliberate checkpoint: persist it now rather than after a delay. */
        setDrafts((prev) => {
            const previous = past.current[past.current.length - 1];
            if (!previous) return prev;
            past.current = past.current.slice(0, -1);
            future.current = [prev, ...future.current].slice(0, HISTORY_LIMIT);
            persist(previous);
            return previous;
        });
        setHistoryVersion((v) => v + 1);
    }, [persist]);

    const redo = useCallback(() => {
        lastCommit.current = null;
        /* A deliberate checkpoint: persist it now rather than after a delay. */
        setDrafts((prev) => {
            const next = future.current[0];
            if (!next) return prev;
            future.current = future.current.slice(1);
            past.current = [...past.current, prev].slice(-HISTORY_LIMIT);
            persist(next);
            return next;
        });
        setHistoryVersion((v) => v + 1);
    }, [persist]);

    const getViewDraft = useCallback(
        (model: string, viewKey: string) => drafts.views[viewDraftKey(model, viewKey)],
        [drafts],
    );

    const getTableDraft = useCallback(
        (collection: string) => drafts.tables[tableDraftKey(collection)],
        [drafts],
    );

    const value = useMemo<StudioDraftContextValue>(
        () => ({
            drafts,
            getViewDraft,
            setViewDraft,
            clearViewDraft,
            getTableDraft,
            setTableDraft,
            clearTableDraft,
            clearAllDrafts,
            undo,
            redo,
            canUndo: past.current.length > 0,
            canRedo: future.current.length > 0,
            persistError,
            saveState,
        }),
        // `historyVersion` is the dependency that makes canUndo/canRedo (read from refs) re-evaluate.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            drafts,
            historyVersion,
            getViewDraft,
            setViewDraft,
            clearViewDraft,
            getTableDraft,
            setTableDraft,
            clearTableDraft,
            clearAllDrafts,
            undo,
            redo,
            persistError,
            saveState,
        ],
    );

    return <StudioDraftContext.Provider value={value}>{children}</StudioDraftContext.Provider>;
}

export function useStudioDrafts(): StudioDraftContextValue {
    const ctx = useContext(StudioDraftContext);
    if (!ctx) {
        throw new Error("useStudioDrafts must be used inside StudioDraftProvider");
    }
    return ctx;
}
