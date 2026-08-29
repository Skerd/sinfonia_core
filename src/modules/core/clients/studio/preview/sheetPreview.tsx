import {useState} from "react";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import ViewRenderer, {type ViewRendererContext} from "@coreModule/components/viewEngine/ViewRenderer.tsx";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {IconLayoutSidebarRightExpand} from "@tabler/icons-react";
import type {SampleRow} from "./useSampleRows.ts";

type SheetPreviewProps = {
    config: ViewConfig;
    row: SampleRow | null;
    resolveLanguageKey: ResolveLanguageKey;
};

/**
 * Renders the sheet body through the unmodified `ViewRenderer`, with the same context
 * `SheetViewRenderer` builds for it (`mode: "sheet"`, entity data, read allowlist,
 * `sheetModel` for group collapse keys).
 *
 * Inline rather than through `SheetViewRenderer` directly, because that mounts a Radix
 * overlay that would cover the tree being edited. "Open real sheet" mounts the genuine
 * component when header, action menu and audit chrome need checking too.
 */
export default function SheetPreview({config, row, resolveLanguageKey}: SheetPreviewProps) {
    const access = useAccess(config.accessModel);
    const [realSheetOpen, setRealSheetOpen] = useState(false);

    const readAccess = access.read && typeof access.read === "object" ? access.read : {};

    const ctx: ViewRendererContext = {
        data: row ?? {},
        resolveLanguageKey,
        access: readAccess,
        mode: "sheet",
        sheetModel: config.model,
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-end border-b px-2 py-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-2xs"
                    disabled={!row}
                    onClick={() => setRealSheetOpen(true)}
                >
                    <IconLayoutSidebarRightExpand className="size-3.5" />
                    Open real sheet
                </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="flex flex-col gap-4">
                    <ViewRenderer nodes={config.nodes} ctx={ctx} />
                </div>
            </div>

            {realSheetOpen && row && (
                <SheetViewRenderer
                    config={config}
                    data={row}
                    open={realSheetOpen}
                    onOpenChange={(open) => setRealSheetOpen(open)}
                    resolveLanguageKey={resolveLanguageKey}
                    access={access}
                    /* Read-only preview: no edit target and no destructive actions. */
                    hideEdit
                    hideDelete
                    hideRestore
                    {...(config.apiUrl ? {url: `${config.apiUrl}/single`, fetchId: row._id} : {})}
                />
            )}
        </div>
    );
}
