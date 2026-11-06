import {IconPhotoOff, IconPlayerPlay} from "@tabler/icons-react";
import {compose} from "redux";
import {useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Button} from "@coreModule/components/ui/button.tsx";

type DetailGalleryProps = WithLanguageType & {
    title: string;
    images: readonly string[];
    videos?: readonly string[];
    /** Photo shape: portrait for products, landscape for cars, rooms and buildings. */
    shape?: "portrait" | "landscape";
    /** Keep the empty stage ("No photos yet") instead of omitting the gallery. */
    placeholder?: boolean;
    /** The item on stage, when the page picks it (a product variant's photo); otherwise the gallery keeps its own. */
    active?: string;
    onActiveChange?: (src: string) => void;
};

/**
 * An item's photos and videos: one on stage, the rest as thumbnails beside it on wide
 * screens and under it on narrow ones. Media URLs carry no extension, so which ones are
 * videos comes from the list they arrive in.
 */
function DetailGallery({title, images, videos = [], shape = "portrait", placeholder, active, onActiveChange, resolveLanguageKey}: DetailGalleryProps) {
    const media = [...new Set(images)].map((src) => ({src, video: false}))
        .concat([...new Set(videos)].map((src) => ({src, video: true})));
    const [own, setOwn] = useState<string>();
    const current = media.find((item) => item.src === (active ?? own)) ?? media[0];
    const select = onActiveChange ?? setOwn;
    const stage = shape === "portrait" ? "aspect-[4/5]" : "aspect-[4/3]";
    const thumbs = media.length > 1;

    if (!current) {
        if (!placeholder) return null;
        return (
            <div className={cn("flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl bg-muted text-muted-foreground", stage)}>
                <IconPhotoOff className="size-10 stroke-[1.25]" aria-hidden />
                <span className="text-sm">{resolveLanguageKey("noImage")}</span>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col gap-3", thumbs && "lg:grid lg:grid-cols-[5rem_1fr] lg:items-start")}>
            <div className={cn("w-full overflow-hidden rounded-3xl bg-muted", thumbs && "lg:col-start-2 lg:row-start-1", stage)}>
                {current.video ? (
                    // Keyed so switching clips restarts the player instead of reusing the old source.
                    <video key={current.src} src={current.src} className="size-full bg-black object-contain" controls playsInline preload="metadata" />
                ) : (
                    <img src={current.src} alt={title} className="size-full object-cover" />
                )}
            </div>
            {thumbs ? (
                <ul className="flex gap-2 overflow-x-auto lg:col-start-1 lg:row-start-1 lg:flex-col lg:overflow-visible">
                    {media.map((item, index) => (
                        <li key={item.src} className="shrink-0">
                            <Button variant="bare"
                                type="button"
                                onClick={() => select(item.src)}
                                aria-label={resolveLanguageKey(item.video ? "videoOf" : "imageOf")
                                    .replace("{number}", String(index + 1))
                                    .replace("{total}", String(media.length))}
                                aria-pressed={item === current}
                                className={cn(
                                    "relative block overflow-hidden rounded-xl border-2 bg-muted transition-colors",
                                    shape === "portrait" ? "h-20 w-16 lg:h-24 lg:w-20" : "h-14 w-20 lg:h-16",
                                    item === current ? "border-foreground" : "border-transparent hover:border-border",
                                )}
                            >
                                {item.video ? (
                                    <span className="flex size-full items-center justify-center bg-foreground/85 text-background">
                                        <IconPlayerPlay className="size-5 fill-current" aria-hidden />
                                    </span>
                                ) : (
                                    <img src={item.src} alt="" loading="lazy" className="size-full object-cover" />
                                )}
                            </Button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/shared/detailGallery.tsx"))(DetailGallery);
