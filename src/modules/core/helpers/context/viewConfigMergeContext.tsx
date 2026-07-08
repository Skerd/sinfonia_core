import { createContext, useContext, type ReactNode } from "react";
import type { ViewConfig } from "armonia/src/modules/core/api/auxiliary/private/viewConfig";

export type ViewConfigMergeFn = (
    base: ViewConfig | undefined,
    model: string,
    viewKey: string,
) => ViewConfig | undefined;

const defaultMerge: ViewConfigMergeFn = (base) => base;

const ViewConfigMergeContext = createContext<ViewConfigMergeFn>(defaultMerge);

export function ViewConfigMergeProvider({
    merge,
    children,
}: {
    merge: ViewConfigMergeFn;
    children: ReactNode;
}) {
    return (
        <ViewConfigMergeContext.Provider value={merge}>
            {children}
        </ViewConfigMergeContext.Provider>
    );
}

export function useViewConfigMerge(): ViewConfigMergeFn {
    return useContext(ViewConfigMergeContext);
}
