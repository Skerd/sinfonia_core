import { useMemo } from "react";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import SingleFile from "@coreModule/components/custom/files/singleFile.tsx";
import type { Media } from "armonia/src/modules/core/types";
import { cn } from "@coreModule/components/lib/utils.ts";

export type SheetMediaFilesStripProps = {
    media: Media[];
    resolveLanguageKey: ResolveLanguageKey;
    className?: string;
    canDownload?: boolean;
    canRemove?: boolean;
    isBig?: boolean;
};

export default function SheetMediaFilesStrip({
    media,
    resolveLanguageKey,
    className,
    canDownload = true,
    canRemove = false,
    isBig = false,
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
        <div className={cn("flex flex-wrap gap-2", className)}>
            {mediaFiles.map((fileItem) => (
                <SingleFile
                    key={fileItem.id}
                    resolveLanguageKey={resolveLanguageKey}
                    file={fileItem}
                    canDownload={canDownload}
                    canRemove={canRemove}
                    isBig={isBig}
                />
            ))}
        </div>
    );
}
