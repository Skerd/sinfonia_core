import {createElement, type ReactNode} from "react";
import type {FieldBinding} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {SheetFieldRenderer} from "@baseModule/helpers/types/widgetContribution.types.ts";
import ValueNotSet from "@baseModule/components/custom/valueNotSet.tsx";
import {hasAccessPath} from "../../engine/access.ts";
import {normalizeObjectIdRef, resolvePath} from "../../engine/refs.ts";
import type {AccessMap, ViewRendererContext} from "../../engine/types.ts";
import {omitProps, wpString, wpText, wpTextList} from "../../engine/widgetProps.ts";
import {resolveIcon} from "../../registry/icons.ts";

/** Optional title (+ icon) above a gallery / media strip, so an empty state is not a bare ValueNotSet. */
function MediaSection({label, iconToken, empty, children}: {
    label: string | null;
    iconToken: string | null;
    empty?: boolean;
    children: ReactNode;
}) {
    const body = empty ? <div className="p-4">{children}</div> : children;
    if (!label) return <div>{body}</div>;
    const Icon = iconToken ? resolveIcon(iconToken) : null;
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
                {Icon ? (
                    <div className="shrink-0 rounded-md bg-background p-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                ) : null}
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
            </div>
            {body}
        </div>
    );
}

function mediaSection(binding: FieldBinding, ctx: ViewRendererContext, index: number, content: ReactNode | null): ReactNode {
    return (
        <MediaSection
            key={index}
            label={binding.label ? String(ctx.resolveLanguageKey(binding.label)) : null}
            iconToken={wpString(binding.widgetProps ?? {}, "icon") ?? null}
            empty={content == null}
        >
            {content ?? <ValueNotSet />}
        </MediaSection>
    );
}

/** Media at one path: a list (object entries only), one object, or a bare id. */
function mediaAt(raw: unknown): unknown[] {
    if (Array.isArray(raw)) return raw.filter((item) => item != null && typeof item === "object");
    if (raw != null && typeof raw === "object") return [raw];
    if (typeof raw === "string" && raw.length > 0) return [{_id: raw}];
    return [];
}

/** Media from several readable paths, in order, each id once. Entries without a string id are dropped. */
function combinedMedia(data: Record<string, any>, paths: string[], access: AccessMap | undefined): unknown[] {
    const seen = new Set<string>();
    const out: unknown[] = [];
    for (const path of paths) {
        if (!hasAccessPath(access, path)) continue;
        const value = resolvePath(data, path);
        for (const item of Array.isArray(value) ? value : [value]) {
            const id = typeof item === "string" ? item : (item as {_id?: unknown} | null)?._id;
            if (typeof id !== "string" || id.length === 0 || seen.has(id)) continue;
            seen.add(id);
            out.push(typeof item === "string" ? {_id: item} : item);
        }
    }
    return out;
}

const filesStrip: SheetFieldRenderer = ({binding, ctx, index, Component}) => {
    const {data} = ctx;
    if (!Component || !data) return null;
    const wp = binding.widgetProps ?? {};
    const combine = wpTextList(wp, "combineFromFields") ?? [];
    let media: unknown[];
    if (combine.length > 0) {
        media = combinedMedia(data, combine, ctx.access);
    } else {
        if (!hasAccessPath(ctx.access, binding.name)) return null;
        media = mediaAt(resolvePath(data, binding.name));
    }
    return mediaSection(binding, ctx, index, media.length === 0 ? null : createElement(Component, {
        media,
        resolveLanguageKey: ctx.resolveLanguageKey,
        className: wpString(wp, "className"),
        canDownload: wp.canDownload !== false,
        canRemove: wp.canRemove === true,
        isBig: wp.isBig === true,
    }));
};

const avatar: SheetFieldRenderer = ({binding, ctx, index, Component}) => {
    const {data} = ctx;
    if (!Component || !data || !hasAccessPath(ctx.access, binding.name)) return null;
    const mediaId = normalizeObjectIdRef(resolvePath(data, binding.name))?.fetchId;
    if (!mediaId) return <ValueNotSet key={index} />;
    const wp = binding.widgetProps ?? {};
    const name = resolvePath(data, wpText(wp, "nameField") ?? "name");
    return createElement(Component, {
        key: index,
        mediaId,
        name: typeof name === "string" ? name : "",
        className: wpString(wp, "className"),
        imageClassName: wpString(wp, "imageClassName"),
    });
};

/*
 * Same per-path gate as the files strip: only bind media the account may read, so a
 * narrowed account does not see a gallery just because one of its fields is readable.
 */
const gallery: SheetFieldRenderer = ({binding, ctx, index, Component}) => {
    if (!Component) return null;
    const {data, access} = ctx;
    const wp = binding.widgetProps ?? {};
    const imageField = wpText(wp, "imageGalleryField");
    const videoField = wpText(wp, "videoGalleryField");
    const canMain = hasAccessPath(access, binding.name);
    const canImages = !!imageField && hasAccessPath(access, imageField);
    const canVideos = !!videoField && hasAccessPath(access, videoField);
    if (!canMain && !canImages && !canVideos) return null;

    const listAt = (path: string | undefined, allowed: boolean): unknown[] => {
        const v = allowed && path && data ? resolvePath(data, path) : null;
        return Array.isArray(v) ? v : [];
    };

    let mainImage = canMain && data ? resolvePath(data, binding.name) : null;
    let imageGallery = listAt(imageField, canImages);
    const videoGallery = listAt(videoField, canVideos);
    // A list at the main path is really a gallery.
    if (Array.isArray(mainImage)) {
        if (imageGallery.length === 0) imageGallery = mainImage;
        mainImage = null;
    }

    const hasMain = mainImage != null && (typeof mainImage === "string" ? mainImage.length > 0 : typeof mainImage === "object");
    const hasMedia = hasMain || imageGallery.length > 0 || videoGallery.length > 0;
    return mediaSection(binding, ctx, index, hasMedia ? createElement(Component, {
        ...omitProps(wp, "icon"),
        mainImage,
        imageGallery,
        videoGallery,
    }) : null);
};

export const mediaRenderers: Record<string, SheetFieldRenderer> = {
    "#SheetMediaFilesStrip": filesStrip,
    "#SheetMediaAvatar": avatar,
    "#GalleryCarousel": gallery,
};
