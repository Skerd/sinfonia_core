import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

export type ReferencesListViewMode = "compact" | "cards";

type ReferencesViewModeContextValue = {
    mode: ReferencesListViewMode;
    setMode: (m: ReferencesListViewMode) => void;
    hasItems: boolean;
    reportItemCount: (count: number) => void;
};

const ReferencesViewModeContext = createContext<ReferencesViewModeContextValue | null>(null);

export function useReferencesViewModeOptional(): ReferencesViewModeContextValue | null {
    return useContext(ReferencesViewModeContext);
}

export type ReferencesViewModeScopeProps = {
    storageKey: string;
    defaultMode?: ReferencesListViewMode;
    children?: ReactNode;
};

export function ReferencesViewModeScope({
    storageKey,
    defaultMode = "compact",
    children,
}: ReferencesViewModeScopeProps) {
    const [mode, setModeState] = useState<ReferencesListViewMode>(() => {
        if (typeof window === "undefined") {
            return defaultMode;
        }
        try {
            const v = localStorage.getItem(storageKey);
            if (v === "compact" || v === "cards") {
                return v;
            }
        } catch {
            /* ignore */
        }
        return defaultMode;
    });
    const [hasItems, setHasItems] = useState(true);

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, mode);
        } catch {
            /* ignore */
        }
    }, [storageKey, mode]);

    const setMode = useCallback((m: ReferencesListViewMode) => {
        setModeState(m);
    }, []);

    const reportItemCount = useCallback((count: number) => {
        setHasItems(count > 0);
    }, []);

    return (
        <ReferencesViewModeContext.Provider value={{ mode, setMode, hasItems, reportItemCount }}>
            {children}
        </ReferencesViewModeContext.Provider>
    );
}
