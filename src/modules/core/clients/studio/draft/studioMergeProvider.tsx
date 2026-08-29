import {useCallback, type ReactNode} from "react";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {
    ViewConfigMergeProvider,
    type ViewConfigMergeFn,
} from "@coreModule/helpers/context/viewConfigMergeContext.tsx";
import {useStudioDrafts} from "./studioDraftProvider.tsx";

/**
 * Feeds Studio drafts into the merge hook that `ViewConfigProvider.getViewConfig`
 * already calls. Every preview in the Studio — `SheetViewRenderer`, `FormViewRenderer`,
 * anything reaching `useViewConfig` — picks up the draft with no change to the engine.
 *
 * Must wrap `ViewConfigProvider`, not sit inside it: the provider reads this context
 * during its own render.
 */
export function StudioMergeProvider({children}: {children: ReactNode}) {
    const {getViewDraft} = useStudioDrafts();

    const merge = useCallback<ViewConfigMergeFn>(
        (base: ViewConfig | undefined, model: string, viewKey: string) =>
            getViewDraft(model, viewKey) ?? base,
        [getViewDraft],
    );

    return <ViewConfigMergeProvider merge={merge}>{children}</ViewConfigMergeProvider>;
}
