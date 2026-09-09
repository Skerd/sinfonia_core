import {Suspense} from "react";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import ViewRenderer, {type ViewRendererContext} from "@coreModule/components/viewEngine/ViewRenderer.tsx";
import type {SampleRow} from "../preview/useSampleRows.ts";

type GallerySheetMountProps = {
    config: ViewConfig;
    row: SampleRow;
    resolveLanguageKey: ResolveLanguageKey;
};

/**
 * Inline sheet body through `ViewRenderer`, same as `SheetPreview`.
 *
 * `SheetViewRenderer` is a Radix overlay — one per tile would stack 50 sheets on the
 * page. Overlays (`*SheetView`) are opened from the card instead.
 */
export default function GallerySheetMount({
    config,
    row,
    resolveLanguageKey,
}: GallerySheetMountProps) {
    const ctx: ViewRendererContext = {
        data: row,
        resolveLanguageKey,
        mode: "sheet",
        sheetModel: config.model,
    };

    return (
        <div className="flex flex-col gap-4">
            <Suspense fallback={<p className="text-2xs text-muted-foreground">Loading…</p>}>
                <ViewRenderer nodes={config.nodes} ctx={ctx} />
            </Suspense>
        </div>
    );
}
