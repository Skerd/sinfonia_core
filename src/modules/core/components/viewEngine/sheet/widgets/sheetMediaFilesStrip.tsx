import { useMemo } from "react";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import SingleFile from "@coreModule/components/viewEngine/widgets/media/singleFile.tsx";
import type { Media } from "armonia/src/modules/core/types";
import { cn } from "@coreModule/components/lib/utils.ts";

export type SheetMediaFilesStripProps = {
    media: Media[];
    resolveLanguageKey: ResolveLanguageKey;
    className?: string;
    canDownload?: boolean;
    canRemove?: boolean;
    /** Thumbnail size when the layout is a tile. Ignored when `nameOnly` is set. */
    isBig?: boolean;
    /** File name plus the file menu, instead of the thumbnail tile. */
    nameOnly?: boolean;
};

export default function SheetMediaFilesStrip({
    media,
    resolveLanguageKey,
    className,
    canDownload = true,
    canRemove = false,
    isBig = false,
    nameOnly = false,
}: SheetMediaFilesStripProps) {
    const mediaFiles = useMemo(
        () =>
            (media ?? []).map((m: Media) => ({
                id: m._id,
                file: m,
                path: `/api/auxiliary/media/${m._id}`,
                body: undefined as undefined,
            })),
        [media],
    );

    if (!mediaFiles.length) return null;

    return (
        <div className={cn(nameOnly ? "flex w-full min-w-0 flex-col gap-1" : "flex flex-wrap gap-2", className)}>
            {mediaFiles.map((fileItem) => (
                <SingleFile
                    key={fileItem.id}
                    resolveLanguageKey={resolveLanguageKey}
                    file={fileItem}
                    canDownload={canDownload}
                    canRemove={canRemove}
                    isBig={isBig}
                    layout={nameOnly ? "name" : "tile"}
                    className={nameOnly ? "w-full" : undefined}
                />
            ))}
        </div>
    );
}
