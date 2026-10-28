import {Link} from "react-router-dom";
import {compose} from "redux";
import {ImageOff} from "lucide-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {formatDate} from "@coreModule/helpers/general/dateTime.ts";
import type {PublicBlogPostItem} from "armonia/src/modules/core/api/auxiliary/public/blog/blog.form.response.type.ts";
import {withCompany} from "./blogCompany.ts";

const WORDS_PER_MINUTE = 220;

/** Whole minutes to read the post, at least one. */
export function blogReadingMinutes(content: string | undefined): number {
    const words = (content ?? "").trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Date · reading time, shared by the cards and the article header. */
export function blogMetaLine(resolveLanguageKey: WithLanguageType["resolveLanguageKey"], post: PublicBlogPostItem): string {
    const minutes = resolveLanguageKey("readingTime").replace("{minutes}", String(blogReadingMinutes(post.content)));
    const date = formatDate(post.publishedAt, {format: {year: "numeric", month: "long", day: "numeric"}});
    return date ? `${date} · ${minutes}` : minutes;
}

type BlogCardProps = WithLanguageType & {
    post: PublicBlogPostItem;
    /** Apex company the article should stay inside. Omitted on a company host and on a mixed list that has no site slug. */
    companySlug?: string;
    /** Name the publishing company. The mixed apex list does; a company page does not. */
    showCompany?: boolean;
};

function BlogCard({resolveLanguageKey, post, companySlug, showCompany = false}: BlogCardProps) {
    return (
        <Link
            to={withCompany(`/blog/${encodeURIComponent(post.slug)}`, companySlug)}
            className="group flex flex-col gap-3 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
                {post.mainImage ? (
                    <img src={post.mainImage} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                        <ImageOff className="size-6" aria-hidden />
                        <span className="text-xs">{resolveLanguageKey("noImage")}</span>
                    </div>
                )}
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    {post.category ? (
                        <span className="rounded-full bg-foreground px-2.5 py-1 font-semibold text-background">{post.category.name}</span>
                    ) : null}
                    <span className="text-muted-foreground">{blogMetaLine(resolveLanguageKey, post)}</span>
                </div>
                <p className="line-clamp-2 font-display text-xl font-semibold leading-snug tracking-tight underline-offset-4 group-hover:underline">{post.title}</p>
                {post.excerpt ? <p className="line-clamp-3 text-[15px] leading-relaxed text-muted-foreground">{post.excerpt}</p> : null}
                {post.authorName ? (
                    <span className="text-xs text-muted-foreground">{resolveLanguageKey("byAuthor").replace("{author}", post.authorName)}</span>
                ) : null}
                {showCompany && post.seller ? (
                    <span className="text-xs font-medium text-muted-foreground">{resolveLanguageKey("fromCompany").replace("{company}", post.seller.name)}</span>
                ) : null}
            </div>
        </Link>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/blog/blogCard.tsx"))(BlogCard);
